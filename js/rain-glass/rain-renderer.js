// Vendored from aling-raining@0.1.3 (dist/lib/core/rain-renderer.js).
// Changes: import specifiers resolved for native browser ESM, pause()/resume()
// added so offscreen panels stop burning GPU frames, and a transparentBg mode
// that renders droplets over an alpha canvas instead of an opaque texture.
// The shader import carries a version query to bust stale browser caches.
import GL from "./gl-obj.js";
import createCanvas from "./create-canvas.js";
import { vertShader, fragShader } from "./shaders.js?v=intro-neon-20260708-3";
/**
 * RainRenderer 默认参数配置：
 *
 * renderShadow: 是否渲染水滴阴影（true/false）
 * minRefraction: 折射最小值，影响水滴的折射强度
 * maxRefraction: 折射最大值，影响水滴的折射强度
 * brightness: 整体亮度系数
 * alphaMultiply: alpha 通道乘法系数（影响水滴透明度）
 * alphaSubtract: alpha 通道减法系数（影响水滴透明度）
 * parallaxBg: 背景视差系数
 * parallaxFg: 前景视差系数
 */
const defaultOptions = {
    renderShadow: false, // 是否渲染水滴阴影
    minRefraction: 256, // 折射最小值
    maxRefraction: 512, // 折射最大值
    brightness: 1, // 亮度系数
    alphaMultiply: 20, // alpha 通道乘法系数
    alphaSubtract: 5, // alpha 通道减法系数
    parallaxBg: 5, // 背景视差系数
    parallaxFg: 20, // 前景视差系数
    transparentBg: false, // 是否透明背景（只渲染水滴，玻璃保持透明）
};
class RainRenderer {
    constructor(canvas, canvasLiquid, imageFg, imageBg, imageShine = null, options = {}) {
        this.gl = null;
        this.width = 0;
        this.height = 0;
        this.textures = null;
        this.programWater = null;
        this.programBlurX = null;
        this.programBlurY = null;
        this.parallaxX = 0;
        this.parallaxY = 0;
        this.renderShadow = false;
        this._animationFrameId = null;
        this.canvas = canvas;
        this.canvasLiquid = canvasLiquid;
        this.imageShine = imageShine;
        this.imageFg = imageFg;
        this.imageBg = imageBg;
        this.options = Object.assign({}, defaultOptions, options);
        this.init();
    }
    init() {
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        // Straight (non-premultiplied) alpha matches the shader's blend() output.
        this.gl = new GL(this.canvas, this.options.transparentBg
            ? { alpha: true, premultipliedAlpha: false }
            : { alpha: false }, vertShader, fragShader);
        const gl = this.gl;
        this.programWater = gl.program;
        gl.createUniform("2f", "resolution", this.width, this.height);
        gl.createUniform("1i", "transparentBg", this.options.transparentBg ? 1 : 0);
        gl.createUniform("1f", "textureRatio", this.imageBg.width / this.imageBg.height);
        gl.createUniform("1i", "renderShine", this.imageShine == null ? false : true);
        gl.createUniform("1i", "renderShadow", this.options.renderShadow);
        gl.createUniform("1f", "minRefraction", this.options.minRefraction);
        gl.createUniform("1f", "refractionDelta", this.options.maxRefraction - this.options.minRefraction);
        gl.createUniform("1f", "brightness", this.options.brightness);
        gl.createUniform("1f", "alphaMultiply", this.options.alphaMultiply);
        gl.createUniform("1f", "alphaSubtract", this.options.alphaSubtract);
        gl.createUniform("1f", "parallaxBg", this.options.parallaxBg);
        gl.createUniform("1f", "parallaxFg", this.options.parallaxFg);
        gl.createTexture(null, 0);
        this.textures = [
            { name: "textureShine", img: this.imageShine == null ? createCanvas(2, 2) : this.imageShine },
            { name: "textureFg", img: this.imageFg },
            { name: "textureBg", img: this.imageBg },
        ];
        this.textures.forEach((texture, i) => {
            gl.createTexture(texture.img, i + 1);
            gl.createUniform("1i", texture.name, i + 1);
        });
        this.draw();
    }
    abort() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
        if (this.gl) {
            if (this.textures) {
                this.textures.forEach((texture, i) => {
                    if (this.gl && this.gl.deleteTexture) {
                        this.gl.deleteTexture(i + 1);
                    }
                });
            }
            if (this.gl.deleteProgram) {
                this.gl.deleteProgram();
            }
            this.gl = null;
        }
        if (this.canvas && this.canvas.getContext) {
            const ctx = this.canvas.getContext("2d");
            ctx && ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        if (this.canvasLiquid && this.canvasLiquid.getContext) {
            const ctx = this.canvasLiquid.getContext("2d");
            ctx && ctx.clearRect(0, 0, this.canvasLiquid.width, this.canvasLiquid.height);
        }
        this.canvas = null;
        this.canvasLiquid = null;
        this.imageShine = null;
        this.imageFg = null;
        this.imageBg = null;
        this.textures = null;
        this.programWater = null;
        this.programBlurX = null;
        this.programBlurY = null;
    }
    pause() {
        if (this._animationFrameId) {
            cancelAnimationFrame(this._animationFrameId);
            this._animationFrameId = null;
        }
    }
    resume() {
        if (!this._animationFrameId && this.gl) {
            this.draw();
        }
    }
    draw() {
        if (!this.gl || !this.programWater)
            return;
        this.gl.useProgram(this.programWater);
        this.gl.createUniform("2f", "parallax", this.parallaxX, this.parallaxY);
        this.updateTexture();
        this.gl.draw();
        this._animationFrameId = requestAnimationFrame(this.draw.bind(this));
    }
    updateTextures() {
        if (!this.gl || !this.textures)
            return;
        this.textures.forEach((texture, i) => {
            this.gl.activeTexture(i + 1);
            this.gl.updateTexture(texture.img);
        });
    }
    updateTexture() {
        if (!this.gl)
            return;
        this.gl.activeTexture(0);
        this.gl.updateTexture(this.canvasLiquid);
    }
    resize() {
    }
    get overlayTexture() {
        return null;
    }
    set overlayTexture(v) {
    }
}
export default RainRenderer;
