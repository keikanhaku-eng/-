// Rain-on-glass overlays (aling-raining / codrops RainEffect core, vendored
// in js/rain-glass/). Attaches a WebGL rain canvas to the hero front glass
// plate and to both photo screens of the story showcase device.
import Raindrops from "./rain-glass/raindrops.js";
import RainRenderer from "./rain-glass/rain-renderer.js";
import createCanvas from "./rain-glass/create-canvas.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktopQuery = window.matchMedia("(min-width: 981px)");
const MAX_DPR = 2;

const DROP_TEXTURES = {
  alpha: "img/rain/drop-alpha.png",
  color: "img/rain/drop-color.png",
};

// Tuned for ~330x430 panels; Raindrops scales density by area internally.
const DROP_OPTIONS = {
  minR: 8,
  maxR: 24,
  rainChance: 0.3,
  rainLimit: 3,
  dropletsRate: 22,
  dropletsSize: [1.5, 3.5],
  trailRate: 1.1,
  trailScaleRange: [0.2, 0.45],
  collisionRadius: 0.45,
  dropletsCleaningRadiusMultiplier: 0.28,
};

const RENDER_OPTIONS = {
  brightness: 1.04,
  alphaMultiply: 6,
  alphaSubtract: 3,
};

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)));
    img.src = src;
  });

const imageCache = new Map();
const loadImageCached = (src) => {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      loadImage(src).catch((error) => {
        imageCache.delete(src);
        throw error;
      })
    );
  }
  return imageCache.get(src);
};

// object-fit: cover with a little overscan so ctx.filter blur has no
// transparent fringe at the texture edges.
const drawCover = (ctx, source, width, height, overscan = 0) => {
  const sourceWidth = source.naturalWidth || source.width;
  const sourceHeight = source.naturalHeight || source.height;

  if (!sourceWidth || !sourceHeight) return;

  const targetWidth = width + overscan * 2;
  const targetHeight = height + overscan * 2;
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  if (sourceRatio > targetRatio) {
    cropWidth = sourceHeight * targetRatio;
  } else {
    cropHeight = sourceWidth / targetRatio;
  }

  ctx.drawImage(
    source,
    (sourceWidth - cropWidth) / 2,
    (sourceHeight - cropHeight) / 2,
    cropWidth,
    cropHeight,
    -overscan,
    -overscan,
    targetWidth,
    targetHeight
  );
};

// Night-street bokeh for the hero plate: the glass has no photo behind it,
// so the refraction texture is painted procedurally in the site palette.
const paintNightBokeh = (width, height) => {
  const scene = createCanvas(width, height);
  const ctx = scene.getContext("2d");
  const base = ctx.createLinearGradient(0, 0, 0, height);

  base.addColorStop(0, "#04090b");
  base.addColorStop(0.45, "#0a1417");
  base.addColorStop(0.78, "#071009");
  base.addColorStop(1, "#050806");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  const glow = (x, y, r, color, alpha) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color.replace("ALPHA", String(alpha)));
    gradient.addColorStop(1, color.replace("ALPHA", "0"));
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  const teal = "rgba(68, 214, 196, ALPHA)";
  const gold = "rgba(232, 199, 108, ALPHA)";
  const coral = "rgba(255, 138, 98, ALPHA)";
  const white = "rgba(214, 238, 232, ALPHA)";

  glow(width * 0.74, height * 0.22, width * 0.52, teal, 0.34);
  glow(width * 0.2, height * 0.68, width * 0.46, gold, 0.2);
  glow(width * 0.82, height * 0.82, width * 0.4, coral, 0.18);

  const palette = [teal, teal, gold, coral, white];

  for (let i = 0; i < 30; i++) {
    glow(
      Math.random() * width,
      Math.random() * height,
      4 + Math.random() * Math.random() * width * 0.055,
      palette[Math.floor(Math.random() * palette.length)],
      0.16 + Math.random() * 0.3
    );
  }

  // Distant neon signs: a few soft vertical streaks.
  for (let i = 0; i < 4; i++) {
    const x = width * (0.12 + Math.random() * 0.76);
    const streakHeight = height * (0.16 + Math.random() * 0.24);
    const y = height * (0.1 + Math.random() * 0.5);
    const streak = ctx.createLinearGradient(0, y, 0, y + streakHeight);
    const color = palette[Math.floor(Math.random() * palette.length)];

    streak.addColorStop(0, color.replace("ALPHA", "0"));
    streak.addColorStop(0.5, color.replace("ALPHA", "0.5"));
    streak.addColorStop(1, color.replace("ALPHA", "0"));
    ctx.fillStyle = streak;
    ctx.fillRect(x, y, 2 + Math.random() * 3, streakHeight);
  }

  return scene;
};

class RainPanel {
  // insert decides where the canvas sits in the host's paint order:
  // below text on the hero plate, above the photo on the device screens.
  constructor(host, paintSource, insert) {
    this.host = host;
    this.paintSource = paintSource; // () => canvas | img (current refraction source)
    this.insert = insert || ((canvas) => host.prepend(canvas));
    this.canvas = null;
    this.raindrops = null;
    this.renderer = null;
    this.textureBg = null;
    this.textureFg = null;
    this.visible = true;
    this.destroyed = false;
    this.resizeTimer = 0;
    this.lastWidth = 0;
    this.lastHeight = 0;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        this.visible = entries[entries.length - 1].isIntersecting;
        this.syncRunning();
      },
      { rootMargin: "80px" }
    );
    this.resizeObserver = new ResizeObserver(() => {
      if (!this.canvas) return;

      const { width, height } = this.measure();

      if (
        Math.abs(width - this.lastWidth) < 2 &&
        Math.abs(height - this.lastHeight) < 2
      ) {
        return;
      }

      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => this.build(), 250);
    });

    this.build();
    this.intersectionObserver.observe(host);
    this.resizeObserver.observe(host);
  }

  measure() {
    return { width: this.host.clientWidth, height: this.host.clientHeight };
  }

  build() {
    if (this.destroyed) return;

    this.teardownScene();

    const { width, height } = this.measure();

    if (width < 40 || height < 40) return;

    this.lastWidth = width;
    this.lastHeight = height;

    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const canvas = document.createElement("canvas");

    canvas.className = "rain-glass-canvas";
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    this.textureBg = createCanvas(320, Math.round((320 * height) / width));
    this.textureFg = createCanvas(128, Math.round((128 * height) / width));
    this.paintTextures();

    this.raindrops = new Raindrops(
      canvas.width,
      canvas.height,
      dpr,
      dropTextures.alpha,
      dropTextures.color,
      Object.assign({}, DROP_OPTIONS)
    );
    this.renderer = new RainRenderer(
      canvas,
      this.raindrops.getCanvas(),
      this.textureFg,
      this.textureBg,
      null,
      RENDER_OPTIONS
    );

    if (!this.renderer.gl || !this.renderer.gl.gl) {
      this.teardownScene();
      return;
    }

    this.canvas = canvas;
    this.insert(canvas);
    this.syncRunning();
  }

  paintTextures() {
    const source = this.paintSource();

    if (!source || !this.textureBg) return;

    [
      // Background slightly out of focus, droplets refract the sharper copy.
      { canvas: this.textureBg, blur: 2.5 },
      { canvas: this.textureFg, blur: 0 },
    ].forEach(({ canvas, blur }) => {
      const ctx = canvas.getContext("2d");

      ctx.save();
      ctx.filter = blur > 0 ? `blur(${blur}px)` : "none";
      drawCover(ctx, source, canvas.width, canvas.height, blur > 0 ? 8 : 0);
      ctx.restore();
    });
  }

  refreshTextures() {
    if (!this.renderer) return;

    this.paintTextures();
    this.renderer.updateTextures();
  }

  syncRunning() {
    if (!this.raindrops || !this.renderer) return;

    if (this.visible && !this.destroyed) {
      this.raindrops.startAnimation();
      this.renderer.resume();
    } else {
      this.raindrops.pauseAnimation();
      this.renderer.pause();
    }
  }

  teardownScene() {
    if (this.raindrops) {
      this.raindrops.abort();
      this.raindrops = null;
    }

    if (this.renderer) {
      this.renderer.abort();
      this.renderer = null;
    }

    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
    }
  }

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.resizeTimer);
    this.intersectionObserver.disconnect();
    this.resizeObserver.disconnect();
    this.teardownScene();
  }
}

let dropTextures = null;
let panels = [];
let photoObservers = [];

const attachPhotoPanel = (screenSelector, photoSelector) => {
  const host = document.querySelector(screenSelector);
  const photo = document.querySelector(photoSelector);

  if (!host || !photo) return;

  let currentSource = null;
  const panel = new RainPanel(host, () => currentSource, (canvas) => photo.after(canvas));

  const applySrc = (src) => {
    if (!src) return;

    loadImageCached(src)
      .then((img) => {
        currentSource = img;
        panel.refreshTextures();
      })
      .catch(() => {
        // Missing photo: keep whatever texture is on the glass.
      });
  };

  applySrc(photo.getAttribute("src"));

  // script.js swaps the device photos while scrolling; follow along.
  const observer = new MutationObserver(() => applySrc(photo.getAttribute("src")));

  observer.observe(photo, { attributes: true, attributeFilter: ["src"] });
  panels.push(panel);
  photoObservers.push(observer);
};

const buildAll = () => {
  if (panels.length) return;

  const plate = document.querySelector(".hero-stage .plate-front");

  if (plate) {
    const width = Math.max(plate.clientWidth, 1);
    const height = Math.max(plate.clientHeight, 1);
    const bokeh = paintNightBokeh(512, Math.round((512 * height) / width));

    panels.push(new RainPanel(plate, () => bokeh));
  }

  attachPhotoPanel(".device-face-front .device-screen", "[data-device-photo-front]");
  attachPhotoPanel(".device-face-back .device-screen", "[data-device-photo-back]");
};

const destroyAll = () => {
  panels.forEach((panel) => panel.destroy());
  photoObservers.forEach((observer) => observer.disconnect());
  panels = [];
  photoObservers = [];
};

const syncToViewport = () => {
  if (desktopQuery.matches && !reduceMotion.matches) {
    buildAll();
  } else {
    destroyAll();
  }
};

const start = async () => {
  if (!window.WebGLRenderingContext) return;

  try {
    const [alpha, color] = await Promise.all([
      loadImageCached(DROP_TEXTURES.alpha),
      loadImageCached(DROP_TEXTURES.color),
    ]);

    dropTextures = { alpha, color };
  } catch (error) {
    console.warn("rain-glass: drop textures unavailable, effect disabled.", error);
    return;
  }

  syncToViewport();
  desktopQuery.addEventListener("change", syncToViewport);
  reduceMotion.addEventListener("change", syncToViewport);
};

start();
