interface FoldPosition {
  opening: number;
  roll: number;
  tilt: number;
  yaw: number;
  elevation: number;
  distance: number;
  targetY: number;
}

export const foldPoses = [
  { id: "folded", at: 0, opening: 0, roll: 0, tilt: 0, yaw: -14, elevation: 5, distance: 7.2, targetY: 0 },
  { id: "folded-landscape", at: 0.22, opening: 0, roll: -90, tilt: 0, yaw: -8, elevation: 7, distance: 7, targetY: 0 },
  { id: "open-landscape", at: 0.48, opening: 180, roll: 0, tilt: 0, yaw: 7, elevation: 4, distance: 7.6, targetY: 0 },
  { id: "open", at: 0.73, opening: 180, roll: -90, tilt: 0, yaw: -6, elevation: 4, distance: 9, targetY: 0 },
  { id: "seated", at: 1, opening: 98, roll: -90, tilt: -90, yaw: -13, elevation: 24, distance: 8.4, targetY: 0.78 },
] as const satisfies readonly (FoldPosition & { id: string; at: number })[];

export function clampProgress(progress: number) {
  return Math.max(0, Math.min(progress, 1));
}

export function sampleFold(progress: number) {
  const next = foldPoses.findIndex((pose, index) => index > 0 && pose.at >= progress);
  const previous = next - 1;
  const a = foldPoses[previous];
  const b = foldPoses[next];
  const t = (progress - a.at) / (b.at - a.at);
  const ease = (value: number) => value * value * (3 - 2 * value);
  const time = ease(t);
  const between = (key: keyof FoldPosition) => a[key] + (b[key] - a[key]) * time;

  return {
    previous,
    next,
    active: t < 0.5 ? previous : next,
    dissolve: ease(clampProgress((t - 0.30) / 0.40)),
    opening: between("opening"),
    roll: between("roll"),
    tilt: between("tilt"),
    yaw: between("yaw"),
    elevation: between("elevation"),
    distance: between("distance"),
    targetY: between("targetY"),
  };
}

export type FoldSample = ReturnType<typeof sampleFold>;
