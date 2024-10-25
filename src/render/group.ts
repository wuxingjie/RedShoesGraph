import { Shape } from "./shape/shape.ts";
import { Container, ContainerOptions } from "./container.ts";

export class Group extends Container<ContainerOptions, Group | Shape> {}
