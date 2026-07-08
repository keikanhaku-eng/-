/**
 * 创建一个指定宽度和高度的HTML Canvas元素
 * @param width - Canvas的宽度
 * @param height - Canvas的高度
 * @returns 新创建的HTMLCanvasElement
 */
export default function createCanvas(width, height) {
    let canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}
