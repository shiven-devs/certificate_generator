export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

export function intensityLevel(count: number): IntensityLevel {
  if (count <= 0) {
    return 0;
  }
  if (count === 1) {
    return 1;
  }
  if (count <= 3) {
    return 2;
  }
  if (count <= 6) {
    return 3;
  }
  return 4;
}
