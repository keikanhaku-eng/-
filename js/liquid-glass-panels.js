/*!
 * Adapted from shuding/liquid-glass (MIT)
 * Original: https://github.com/shuding/liquid-glass
 * Copyright (c) 2025 Shu Ding
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  "use strict";

  const SVG_NS = "http://www.w3.org/2000/svg";
  const XLINK_NS = "http://www.w3.org/1999/xlink";

  // The refraction is applied via inline backdrop-filter on the element itself:
  // a child overlay would lose its backdrop once an ancestor carries opacity or
  // a filter (both make it a backdrop root), which the GSAP scenes rely on.
  // magnify: how hard the bezel band compresses the backdrop toward the
  // centre (0..1); bezel: width of that band as a fraction of the surface;
  // radius: corner rounding of the lens field in uv units.
  const TARGETS = [
    {
      // Hero: the three floating glass folders.
      selector: ".glass-plate",
      filter: "blur(4px) contrast(1.12) brightness(1.1) saturate(1.3)",
      magnify: 0.26,
      bezel: 0.22,
      radius: 0.14,
      wave: 0.9,
    },
    {
      // Story: the photo frame faces on the left.
      selector: ".device-face",
      filter: "blur(6px) contrast(1.1) brightness(1.06) saturate(1.28)",
      magnify: 0.22,
      bezel: 0.18,
      radius: 0.1,
      wave: 0.6,
    },
    {
      // Story: the dark text panels on the right.
      selector: ".story-panel:not([hidden])",
      filter: "blur(14px) contrast(1.1) brightness(0.96) saturate(1.22)",
      magnify: 0.16,
      bezel: 0.15,
      radius: 0.06,
      wave: 0.7,
    },
  ];

  // Displacement maps are generated at reduced resolution and stretched by
  // feImage (preserveAspectRatio="none"): the per-pixel loop stays cheap even
  // for the large story panels, and a displacement map needs no fine detail.
  const MAP_MAX_SIZE = 240;

  function smoothStep(a, b, t) {
    t = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function length(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function roundedRectSDF(x, y, width, height, radius) {
    const qx = Math.abs(x) - width + radius;
    const qy = Math.abs(y) - height + radius;
    return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius;
  }

  function texture(x, y) {
    return { type: "t", x, y };
  }

  function generateId() {
    return `liquid-glass-${Math.random().toString(36).slice(2, 11)}`;
  }

  let sharedSvg = null;
  let sharedDefs = null;

  function ensureDefs() {
    if (sharedDefs) return sharedDefs;

    sharedSvg = document.createElementNS(SVG_NS, "svg");
    sharedSvg.setAttribute("xmlns", SVG_NS);
    sharedSvg.setAttribute("width", "0");
    sharedSvg.setAttribute("height", "0");
    sharedSvg.setAttribute("aria-hidden", "true");
    sharedSvg.classList.add("liquid-glass-defs");
    sharedSvg.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;pointer-events:none;";

    sharedDefs = document.createElementNS(SVG_NS, "defs");
    sharedSvg.appendChild(sharedDefs);
    document.body.appendChild(sharedSvg);

    return sharedDefs;
  }

  class LiquidGlassSurface {
    constructor(element, index, options) {
      this.element = element;
      this.index = index;
      this.options = options;
      this.id = generateId();
      this.width = 0;
      this.height = 0;
      this.mapWidth = 0;
      this.mapHeight = 0;
      this.mapScale = 1;

      this.createFilter();
      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d", { willReadFrequently: false });
      this.outputCanvas = document.createElement("canvas");
      this.outputContext = this.outputCanvas.getContext("2d");

      this.updateSize();
      this.updateShader();

      const filterValue = `url(#${this.id}) ${options.filter}`;
      this.element.style.webkitBackdropFilter = filterValue;
      this.element.style.backdropFilter = filterValue;
      this.element.classList.add("has-liquid-glass");
    }

    createFilter() {
      const defs = ensureDefs();

      this.filter = document.createElementNS(SVG_NS, "filter");
      this.filter.setAttribute("id", this.id);
      this.filter.setAttribute("filterUnits", "userSpaceOnUse");
      this.filter.setAttribute("colorInterpolationFilters", "sRGB");
      this.filter.setAttribute("x", "0");
      this.filter.setAttribute("y", "0");

      this.feImage = document.createElementNS(SVG_NS, "feImage");
      this.feImage.setAttribute("result", `${this.id}-map`);
      this.feImage.setAttribute("preserveAspectRatio", "none");

      this.feDisplacementMap = document.createElementNS(SVG_NS, "feDisplacementMap");
      this.feDisplacementMap.setAttribute("in", "SourceGraphic");
      this.feDisplacementMap.setAttribute("in2", `${this.id}-map`);
      this.feDisplacementMap.setAttribute("xChannelSelector", "R");
      this.feDisplacementMap.setAttribute("yChannelSelector", "G");

      this.filter.appendChild(this.feImage);
      this.filter.appendChild(this.feDisplacementMap);
      defs.appendChild(this.filter);
    }

    getLayoutSize() {
      // offsetWidth/Height is the untransformed layout size, which is what the
      // userSpaceOnUse filter region maps to even while plates are 3D-tilted;
      // getBoundingClientRect would return the projected (skewed) bounds.
      const width = this.element.offsetWidth || this.element.getBoundingClientRect().width;
      const height = this.element.offsetHeight || this.element.getBoundingClientRect().height;

      return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
      };
    }

    updateSize() {
      const { width, height } = this.getLayoutSize();

      if (width === this.width && height === this.height) return false;

      this.width = width;
      this.height = height;
      this.mapScale = Math.min(1, MAP_MAX_SIZE / Math.max(width, height));
      this.mapWidth = Math.max(1, Math.round(width * this.mapScale));
      this.mapHeight = Math.max(1, Math.round(height * this.mapScale));

      this.filter.setAttribute("width", String(width));
      this.filter.setAttribute("height", String(height));
      this.feImage.setAttribute("width", String(width));
      this.feImage.setAttribute("height", String(height));

      this.canvas.width = this.mapWidth;
      this.canvas.height = this.mapHeight;

      return true;
    }

    fragment(uv) {
      const ix = uv.x - 0.5;
      const iy = uv.y - 0.5;
      // Depth inside the surface: 0 at the border, rising toward the centre.
      const depth = -roundedRectSDF(ix, iy, 0.5, 0.5, this.options.radius);
      // rim is 1 on the border and fades out across the bezel band, so the
      // centre stays undistorted while the edge bends like a lens.
      const rim = smoothStep(this.options.bezel, 0, depth);
      const scaled = 1 - rim * this.options.magnify;
      const phase = this.index * 0.7;
      const waveAmp = 0.012 * this.options.wave * (0.35 + 0.65 * rim);
      const waveX = Math.sin((uv.y * 6.2 + uv.x * 2.4 + phase) * Math.PI) * waveAmp;
      const waveY = Math.cos((uv.x * 4.8 - uv.y * 2.2 + phase) * Math.PI) * waveAmp * 0.8;

      return texture(ix * scaled + 0.5 + waveX, iy * scaled + 0.5 + waveY);
    }

    updateShader() {
      if (!this.context) return;

      const w = this.mapWidth;
      const h = this.mapHeight;
      const data = new Uint8ClampedArray(w * h * 4);
      const rawValues = [];
      let maxScale = 0;

      for (let i = 0; i < data.length; i += 4) {
        const x = (i / 4) % w;
        const y = Math.floor(i / 4 / w);
        const pos = this.fragment({ x: x / w, y: y / h });
        const dx = pos.x * w - x;
        const dy = pos.y * h - y;

        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy));
        rawValues.push(dx, dy);
      }

      maxScale = Math.max(1, maxScale * 0.5);

      let index = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = rawValues[index++] / maxScale + 0.5;
        const g = rawValues[index++] / maxScale + 0.5;

        data[i] = r * 255;
        data[i + 1] = g * 255;
        data[i + 2] = 0;
        data[i + 3] = 255;
      }

      this.context.putImageData(new ImageData(data, w, h), 0, 0);

      // Upload the map at the element's full size: Chromium does not reliably
      // stretch a smaller feImage across the filter region, so the cheap
      // low-res map is upscaled here instead.
      this.outputCanvas.width = this.width;
      this.outputCanvas.height = this.height;
      this.outputContext.imageSmoothingEnabled = true;
      this.outputContext.imageSmoothingQuality = "high";
      this.outputContext.drawImage(this.canvas, 0, 0, this.width, this.height);

      const displacementMap = this.outputCanvas.toDataURL();
      this.feImage.setAttributeNS(XLINK_NS, "href", displacementMap);
      this.feImage.setAttribute("href", displacementMap);
      // maxScale is measured in map pixels; dividing by mapScale converts the
      // displacement back to element pixels.
      this.feDisplacementMap.setAttribute("scale", String(maxScale / this.mapScale));
    }

    refresh() {
      if (this.updateSize()) {
        this.updateShader();
      }
    }

    destroy() {
      this.filter.remove();
      this.element.style.webkitBackdropFilter = "";
      this.element.style.backdropFilter = "";
      this.element.classList.remove("has-liquid-glass");
    }
  }

  function initLiquidGlass() {
    const instances = [];

    TARGETS.forEach((target) => {
      document.querySelectorAll(target.selector).forEach((element) => {
        instances.push(new LiquidGlassSurface(element, instances.length, target));
      });
    });

    if (!instances.length) return;

    const refresh = () => instances.forEach((instance) => instance.refresh());

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(refresh);
      instances.forEach((instance) => resizeObserver.observe(instance.element));
    }

    window.addEventListener("load", refresh, { once: true });
    window.addEventListener("resize", refresh);
    window.liquidGlassPanels = {
      refresh,
      destroy() {
        instances.forEach((instance) => instance.destroy());
        if (sharedSvg) {
          sharedSvg.remove();
          sharedSvg = null;
          sharedDefs = null;
        }
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiquidGlass, { once: true });
  } else {
    initLiquidGlass();
  }
})();
