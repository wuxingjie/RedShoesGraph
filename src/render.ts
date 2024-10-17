import * as d3 from "d3";
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

render(genRects());
//setInterval(() => render(rects()), 2000);
//setInterval(clear, 3000);
