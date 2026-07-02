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
  const PANEL_SELECTOR = ".story-panel:not([hidden])";

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

  class LiquidGlassPanel {
    constructor(panel, index) {
      this.panel = panel;
      this.index = index;
      this.id = generateId();
      this.canvasDPI = 1;
      this.width = 1;
      this.height = 1;

      this.createElements();
      this.updateSize();
      this.updateShader();
    }

    createElements() {
      this.svg = document.createElementNS(SVG_NS, "svg");
      this.svg.setAttribute("xmlns", SVG_NS);
      this.svg.setAttribute("width", "0");
      this.svg.setAttribute("height", "0");
      this.svg.setAttribute("aria-hidden", "true");
      this.svg.classList.add("liquid-glass-svg");

      const defs = document.createElementNS(SVG_NS, "defs");
      this.filter = document.createElementNS(SVG_NS, "filter");
      this.filter.setAttribute("id", `${this.id}_filter`);
      this.filter.setAttribute("filterUnits", "userSpaceOnUse");
      this.filter.setAttribute("colorInterpolationFilters", "sRGB");
      this.filter.setAttribute("x", "0");
      this.filter.setAttribute("y", "0");

      this.feImage = document.createElementNS(SVG_NS, "feImage");
      this.feImage.setAttribute("id", `${this.id}_map`);

      this.feDisplacementMap = document.createElementNS(SVG_NS, "feDisplacementMap");
      this.feDisplacementMap.setAttribute("in", "SourceGraphic");
      this.feDisplacementMap.setAttribute("in2", `${this.id}_map`);
      this.feDisplacementMap.setAttribute("xChannelSelector", "R");
      this.feDisplacementMap.setAttribute("yChannelSelector", "G");

      this.filter.appendChild(this.feImage);
      this.filter.appendChild(this.feDisplacementMap);
      defs.appendChild(this.filter);
      this.svg.appendChild(defs);

      this.backdrop = document.createElement("span");
      this.backdrop.className = "liquid-glass-backdrop";
      this.backdrop.setAttribute("aria-hidden", "true");

      const filterValue = `url(#${this.id}_filter) blur(18px) contrast(1.18) brightness(1.08) saturate(1.24)`;
      this.backdrop.style.webkitBackdropFilter = filterValue;
      this.backdrop.style.backdropFilter = filterValue;

      this.canvas = document.createElement("canvas");
      this.context = this.canvas.getContext("2d", { willReadFrequently: false });

      this.panel.prepend(this.svg);
      this.panel.prepend(this.backdrop);
      this.panel.classList.add("has-liquid-glass");
    }

    getTargetSize() {
      const backdropRect = this.backdrop.getBoundingClientRect();
      const panelRect = this.panel.getBoundingClientRect();
      const width = Math.round(backdropRect.width || panelRect.width || 1);
      const height = Math.round(backdropRect.height || panelRect.height || 1);

      return {
        width: Math.max(1, width),
        height: Math.max(1, height),
      };
    }

    updateSize() {
      const { width, height } = this.getTargetSize();

      if (width === this.width && height === this.height) return false;

      this.width = width;
      this.height = height;

      this.filter.setAttribute("width", String(width));
      this.filter.setAttribute("height", String(height));
      this.feImage.setAttribute("width", String(width));
      this.feImage.setAttribute("height", String(height));

      this.canvas.width = Math.max(1, Math.round(width * this.canvasDPI));
      this.canvas.height = Math.max(1, Math.round(height * this.canvasDPI));

      return true;
    }

    fragment(uv) {
      const ix = uv.x - 0.5;
      const iy = uv.y - 0.5;
      const aspect = this.width / Math.max(this.height, 1);
      const edgeWidth = aspect > 1.2 ? 0.42 : 0.36;
      const edgeHeight = aspect > 1.2 ? 0.3 : 0.36;
      const distanceToEdge = roundedRectSDF(ix, iy, edgeWidth, edgeHeight, 0.28);
      const displacement = smoothStep(0.72, 0, distanceToEdge - 0.14);
      const scaled = smoothStep(0, 1, displacement);
      const phase = this.index * 0.7;
      const waveX = Math.sin((uv.y * 6.2 + uv.x * 2.4 + phase) * Math.PI) * 0.012 * scaled;
      const waveY = Math.cos((uv.x * 4.8 - uv.y * 2.2 + phase) * Math.PI) * 0.01 * scaled;

      return texture(ix * scaled + 0.5 + waveX, iy * scaled + 0.5 + waveY);
    }

    updateShader() {
      if (!this.context) return;

      const w = this.canvas.width;
      const h = this.canvas.height;
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
      const displacementMap = this.canvas.toDataURL();
      this.feImage.setAttributeNS(XLINK_NS, "href", displacementMap);
      this.feImage.setAttribute("href", displacementMap);
      this.feDisplacementMap.setAttribute("scale", String(maxScale / this.canvasDPI));
    }

    refresh() {
      if (this.updateSize()) {
        this.updateShader();
      }
    }

    destroy() {
      this.svg.remove();
      this.backdrop.remove();
      this.canvas.remove();
      this.panel.classList.remove("has-liquid-glass");
    }
  }

  function initLiquidGlassPanels() {
    const panels = Array.from(document.querySelectorAll(PANEL_SELECTOR));
    const instances = panels.map((panel, index) => new LiquidGlassPanel(panel, index));

    if (!instances.length) return;

    const refresh = () => instances.forEach((instance) => instance.refresh());

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(refresh);
      panels.forEach((panel) => resizeObserver.observe(panel));
    }

    window.addEventListener("load", refresh, { once: true });
    window.addEventListener("resize", refresh);
    window.liquidGlassPanels = {
      refresh,
      destroy() {
        instances.forEach((instance) => instance.destroy());
      },
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLiquidGlassPanels, { once: true });
  } else {
    initLiquidGlassPanels();
  }
})();
