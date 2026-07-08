// Vendored from aling-raining@0.1.3 (dist/lib/core/gl-obj.js).
// Import specifier gets a .js extension so native browser ESM can resolve it.
import * as WebGL from "./webgl.js";
export default class GL {
    constructor(canvas, options, vert, frag) {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.width = 0;
        this.height = 0;
        this.textures = [];
        this.init(canvas, options, vert, frag);
    }
    init(canvas, options, vert, frag) {
        this.canvas = canvas;
        this.width = canvas.width;
        this.height = canvas.height;
        this.gl = WebGL.getContext(canvas, options);
        this.program = this.createProgram(vert, frag);
        if (this.program) {
            this.useProgram(this.program);
        }
    }
    createProgram(vert, frag) {
        if (!this.gl)
            return null;
        let program = WebGL.createProgram(this.gl, vert, frag);
        return program;
    }
    useProgram(program) {
        this.program = program;
        if (this.gl) {
            this.gl.useProgram(program);
        }
    }
    createTexture(source, i) {
        if (!this.gl)
            return null;
        const texture = WebGL.createTexture(this.gl, source, i);
        this.textures[i] = texture;
        return texture;
    }
    deleteProgram() {
        if (this.program && this.gl) {
            this.gl.deleteProgram(this.program);
            this.program = null;
        }
    }
    deleteTexture(i) {
        if (this.textures && this.textures[i] && this.gl) {
            this.gl.deleteTexture(this.textures[i]);
            this.textures[i] = null;
        }
    }
    createUniform(type, name, ...v) {
        if (this.gl && this.program) {
            WebGL.createUniform(this.gl, this.program, type, name, ...v);
        }
    }
    activeTexture(i) {
        if (this.gl) {
            WebGL.activeTexture(this.gl, i);
        }
    }
    updateTexture(source) {
        if (this.gl) {
            WebGL.updateTexture(this.gl, source);
        }
    }
    draw() {
        if (this.gl) {
            WebGL.setRectangle(this.gl, -1, -1, 2, 2);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }
}
