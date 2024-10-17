import "./style.css";
import "./setup.ts";
import redShoesGraph, { DataConfig } from "./redShoesGraph.ts";
import { getRandomDateFn } from "./generateTestData.ts";
import { randomInt } from "d3";

const randomDateFn = getRandomDateFn(new Date(2020, 0), new Date(2020, 11));
//const sampleSize = 10;
const randomNum = randomInt(35);
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
    { id: "17", name: "asdf", parentId: "16" },
    { id: "18", name: "f", parentId: "16" },
    { id: "19", name: "envd1", parentId: "16" },
    { id: "20", name: "dsf", parentId: "16" },
    { id: "21", name: "v", parentId: "16" },
    { id: "22", name: "vxvc", parentId: "16" },
    { id: "23", name: "dfsfg", parentId: "16" },
    { id: "24", name: "fgh", parentId: "16" },
    { id: "25", name: "fgh", parentId: "16" },
    { id: "26", name: "ggf", parentId: "16" },
    { id: "27", name: "dfghd", parentId: "16" },
    { id: "28", name: "dfghd", parentId: "16" },
    { id: "29", name: "dfgh", parentId: "16" },
    { id: "30", name: "werwe", parentId: "16" },
    { id: "31", name: "sdfsf", parentId: "16" },
    { id: "32", name: "324", parentId: "16" },
    { id: "33", name: "435", parentId: "16" },
    { id: "34", name: "end_end", parentId: "16" },
  ],
  events: Array.from({ length: 1000000 }).map(() => {
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
  width: window.innerWidth - 20,
  height: window.innerHeight - 20,
  padding: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 50,
  },
  data,
});
