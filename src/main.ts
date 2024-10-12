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
const randomNum = randomInt(18);
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
    { id: "9", name: "asd", parentId: "0" },
    { id: "10", name: "dff", parentId: "0" },
    { id: "11", name: "adfa", parentId: "0" },
    { id: "12", name: "gh", parentId: "0" },
    { id: "13", name: "gdfth", parentId: "0" },
    { id: "14", name: "dfgh", parentId: "0" },
    { id: "15", name: "ert", parentId: "0" },
    { id: "16", name: "end", parentId: "0" },
    { id: "17", name: "end1", parentId: "16" },
  ],
  events: Array.from({ length: 10000 }).map(() => {
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
  height: 200,
  padding: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50,
  },
  data,
});
