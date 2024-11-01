const degToRad = Math.PI / 180;
export function degreesToArc(degrees: number): number {
  return degrees * degToRad;
}
