import { Stage } from "./render/stage.ts";
import { Layer } from "./render/layer.ts";
import { Text } from "./render/shape/text.ts";
import * as d3 from "d3";
import { Line } from "./render/shape/line.ts";
import { Shape } from "./render/shape/shape.ts";

const width = window.innerWidth;
const height = window.innerHeight;
const rectHCount = 50;
const rectVCount = 50;
const rectWidth = width / rectHCount;
const rectHeight = height / rectVCount;
const stage = new Stage({
  container: "canvas",
  width: width,
  height: height,
});

const layer = new Layer({ x: 0, y: 0 });

stage.add(layer);

const color = d3.scaleSequential([0, 100], d3.schemeCategory10);

for (let i = 0; i < rectVCount; i++) {
  for (let j = 0; j < rectHCount; j++) {
    layer.add(
      new Line({
        //text: `hello${i + j}`,
        points: [0, 0, rectWidth, 0],
        x: j * rectWidth,
        y: i * rectHeight,
        rotationDeg: 10,
        strokeStyle: color(Math.random() * 100),
        width: rectWidth,
        height: rectHeight,
      }),
    );
  }
}
// 单个shape测试
/*layer.add(
  new Line({
    //text: `hello${i + j}`,
    points: [0, 0, rectWidth, 0],
    x: 0,
    y: 0,
    rotationDeg: 10,
    strokeStyle: color(Math.random() * 100),
    width: rectWidth,
    height: rectHeight,
  }),
);*/

// FPS
const fpsText = new Text({
  text: `FPS FPS`,
  x: 0,
  y: 50,
  //strokeStyle: "red",
  fillStyle: "black",
  lineWidth: 2,
  fontSize: 50,
  textBaseline: "bottom",
  textDecoration: "line-through",
  textAlign: "center",
});
layer.add(fpsText);

let frameCount = 0; // 帧计数
let lastTime = 0; // 上一次更新的时间
let fps = 0; // 帧率

function render(currentTime: number) {
  frameCount++; // 增加帧计数

  // 计算经过的时间（秒）
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    // 每秒更新一次帧率
    fps = frameCount; // 更新帧率
    frameCount = 0; // 重置帧计数
    lastTime = currentTime; // 更新最后的时间
    fpsText.text(`FPS: ${fps}`);
  }

  //layer.x(layer.x()! + 2);
  for (const el of layer.children) {
    const rect = el as Shape;
    rect.strokeStyle(color(Math.random() * 100));
    //.x(rect.x()! + 2);
  }

  layer.batchDraw();

  //setTimeout(() => render(performance.now()), 3000);
  //requestAnimationFrame(render);
}
requestAnimationFrame(render);

/*import * as d3 from "d3";
const canvasEl: HTMLCanvasElement = document.getElementById(
  "canvas",
) as HTMLCanvasElement;
const width = window.innerWidth;
const height = window.innerHeight;
canvasEl.width = width;
canvasEl.height = height;
canvasEl.style.width = width + "px";
canvasEl.style.height = height + "px";

const ctx = canvasEl.getContext("2d")!;

const color = d3.scaleSequential([0, 100], d3.schemeCategory10);
const rectHCount = 100;
const rectVCount = 100;
const rectWidth = width / rectHCount;
const rectHeight = height / rectVCount;

type Rects = { x: number; y: number; color: string }[];
function genRects() {
  console.time("rects");
  const rects: Rects = [];
  for (let i = 0; i < rectVCount; i++) {
    for (let j = 0; j < rectHCount; j++) {
      rects.push({
        x: j * rectWidth,
        y: i * rectHeight,
        color: color(Math.random() * 100),
      });
    }
  }
  console.timeEnd("rects");
  return rects;
}
let offset = 0;
function render(rects: Rects) {
  console.time("render");
  ctx.clearRect(0, 0, width, height);
  rects.forEach((r) => {
    ctx.fillStyle = r.color;
    ctx.fillRect(r.x + offset, r.y, rectWidth, height);
    ctx.strokeStyle = "pink";
    ctx.strokeRect(r.x + offset, r.y, rectWidth, height);
  });
  console.timeEnd("render");
  requestAnimationFrame((t) => {
    console.log(t);
    render(genRects());
  });
}

render(genRects());*/
//setInterval(() => render(rects()), 2000);
//setInterval(clear, 3000);
