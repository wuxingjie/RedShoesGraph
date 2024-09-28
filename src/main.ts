import "./style.css";
import "./setup.ts";
import redShoesGraph, { DataConfig } from "./redShoesGraph.ts";
import { getRandomDateFn } from "./generateTestData.ts";
import { randomInt } from "d3";

const randomDateFn = getRandomDateFn(
  new Date(2020, 0, 1),
  new Date(2020, 2, 1),
);
//const sampleSize = 10;
const randomNum = randomInt(9);
const data: DataConfig = {
  entities: [
    { id: "0", name: "Eve", parentId: "" },
    { id: "1", name: "Cain", parentId: "0" },
    { id: "2", name: "Seth", parentId: "0" },
    { id: "3", name: "Enos", parentId: "2" },
    { id: "4", name: "Noam", parentId: "2" },
    { id: "5", name: "Abel", parentId: "0" },
    { id: "6", name: "Awan", parentId: "0" },
    { id: "7", name: "Enoch", parentId: "6" },
    { id: "8", name: "Azura", parentId: "0" },
  ],
  events: Array.from({ length: 100 }).map(() => {
    return {
      id: randomNum() + "",
      entityIds: [randomNum() + ""],
      type: "event",
      time: {
        start: randomDateFn().getTime(),
      },
    };
  }),
};

redShoesGraph({
  container: document.querySelector<HTMLDivElement>("#app")!,
  width: 800,
  height: 500,
  padding: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50,
  },
  data,
});
