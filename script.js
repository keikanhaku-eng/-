const canvas = document.getElementById("network-bg");
const ctx = canvas?.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (!canvas || !ctx) {
  throw new Error("Background canvas is not available.");
}

let width = 0;
let height = 0;
let ratio = 1;
let nodes = [];
let pointer = { x: -1000, y: -1000 };
let frameId = null;

function nodeCount() {
  const area = window.innerWidth * window.innerHeight;
  return Math.max(34, Math.min(86, Math.floor(area / 15000)));
}

function resize() {
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  nodes = Array.from({ length: nodeCount() }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.22,
    vy: (Math.random() - 0.5) * 0.22,
    tone: Math.random() > 0.58 ? "warm" : "cool",
  }));

  draw();
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  ctx.lineWidth = 1;

  for (let i = 0; i < nodes.length; i += 1) {
    const first = nodes[i];

    for (let j = i + 1; j < nodes.length; j += 1) {
      const second = nodes[j];
      const dx = first.x - second.x;
      const dy = first.y - second.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 150) {
        const alpha = (1 - distance / 150) * 0.18;
        ctx.strokeStyle = `rgba(15, 139, 141, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        ctx.lineTo(second.x, second.y);
        ctx.stroke();
      }
    }

    const pointerDistance = Math.hypot(first.x - pointer.x, first.y - pointer.y);
    if (pointerDistance < 190) {
      ctx.strokeStyle = `rgba(214, 106, 74, ${(1 - pointerDistance / 190) * 0.22})`;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(pointer.x, pointer.y);
      ctx.stroke();
    }
  }

  for (const node of nodes) {
    ctx.fillStyle =
      node.tone === "warm" ? "rgba(214, 106, 74, 0.42)" : "rgba(15, 139, 141, 0.42)";
    ctx.beginPath();
    ctx.arc(node.x, node.y, 1.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tick() {
  for (const node of nodes) {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;
  }

  draw();
  frameId = window.requestAnimationFrame(tick);
}

function start() {
  if (reduceMotion.matches) {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = null;
    draw();
    return;
  }

  if (!frameId) {
    frameId = window.requestAnimationFrame(tick);
  }
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY };
});
window.addEventListener("pointerleave", () => {
  pointer = { x: -1000, y: -1000 };
});

if (typeof reduceMotion.addEventListener === "function") {
  reduceMotion.addEventListener("change", start);
} else {
  reduceMotion.addListener(start);
}
resize();
start();
