import * as THREE from "three";
import { keyboardRows, type KeyboardKey } from "./keyboard-layout";

export const keyboardSize = { width: 294, depth: 110, height: 40 } as const;

const pitch = 19.05;
const keycapHeightScale = 0.9;
const rowStart = 7.8;
const leftEdge = -15 * pitch / 2;
const atlasWidth = 2048;
const atlasHeight = 1024;
const pixelsPerMm = 6.75;
const atlasRowHeight = 29;

type Point = [number, number];

// A path through the molded corners, with enough points on the straight edges
// to carry the concave key-top profile and its printed legends.
function roundedRing(width: number, depth: number, radius: number): Point[] {
  const points: Point[] = [];
  for (let corner = 0; corner < 4; corner++) {
    const a = corner * Math.PI / 2;
    const cx = (corner === 0 || corner === 3 ? 1 : -1) * (width / 2 - radius);
    const cy = (corner < 2 ? 1 : -1) * (depth / 2 - radius);
    for (let step = 0; step <= 3; step++) {
      const angle = a + Math.PI / 2 * step / 3;
      points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
    }
    const [x, y] = points[points.length - 1];
    const ex = corner % 2 === 0 ? -cx : x;
    const ey = corner % 2 === 1 ? -cy : y;
    for (let step = 1; step < 5; step++) points.push([x + (ex - x) * step / 5, y + (ey - y) * step / 5]);
  }
  return points;
}

function roundedPath<T extends THREE.Path>(path: T, vertices: Point[], radius: number): T {
  const toward = (a: Point, b: Point): Point => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const fraction = radius / Math.hypot(dx, dy);
    return [a[0] + dx * fraction, a[1] + dy * fraction];
  };
  vertices.forEach((point, i) => {
    const before = toward(point, vertices[(i + vertices.length - 1) % vertices.length]);
    const after = toward(point, vertices[(i + 1) % vertices.length]);
    if (i === 0) path.moveTo(...before);
    else path.lineTo(...before);
    path.quadraticCurveTo(...point, ...after);
  });
  path.closePath();
  return path;
}

function rectangle(width: number, rear: number, front: number, radius: number) {
  const x = width / 2;
  return roundedPath(new THREE.Shape(), [[-x, rear], [x, rear], [x, front], [-x, front]], radius);
}

const deckLevel = (y: number) => 29.7 - 0.123 * y;

function housingPart(shape: THREE.Shape, depth: number, bevel: number, zAt: (y: number, z: number) => number) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 4,
  });
  const vertices = geo.getAttribute("position");
  for (let i = 0; i < vertices.count; i++) vertices.setZ(i, zAt(vertices.getY(i), vertices.getZ(i)));
  geo.computeVertexNormals();
  return geo;
}

function makeHousing(group: THREE.Group, body: THREE.Material, lower: THREE.Material, seam: THREE.Material, plate: THREE.Material) {
  // The seam follows the side wall below the sloping deck. The lower molding
  // narrows toward the desk and the upper molding surrounds the stepped well.
  const join = (y: number) => 9.0 - 0.027 * y;
  const rim = rectangle(291.6, 1.2, 108.8, 3.0);
  const lowerBody = housingPart(rim, 7, 1.1, (y, z) => 1.25 + z / 7 * (join(y) - 2.05));
  const baseVertices = lowerBody.getAttribute("position");
  for (let i = 0; i < baseVertices.count; i++) {
    const z = baseVertices.getZ(i);
    const taper = Math.max(0, 1 - z / 8);
    baseVertices.setX(i, baseVertices.getX(i) * (1 - 0.013 * taper));
    baseVertices.setY(i, 55 + (baseVertices.getY(i) - 55) * (1 - 0.029 * taper));
  }
  lowerBody.computeVertexNormals();
  lowerBody.computeBoundingBox();
  lowerBody.translate(0, 0, -lowerBody.boundingBox!.min.z);
  group.add(new THREE.Mesh(lowerBody, lower));
  group.add(new THREE.Mesh(housingPart(rectangle(293.2, 0.5, 109.5, 3.0), 1.3, 0.16,
    (y, z) => join(y) - 0.45 + z), seam));

  const slotLeft = leftEdge - 0.45;
  const slotRight = -slotLeft;
  const back = rowStart - 0.45;
  const front = rowStart + 5 * pitch + 0.45;
  const step = rowStart + 4 * pitch + 0.50;
  const leftBlock = leftEdge + 1.5 * pitch - 0.55;
  const rightBlock = leftEdge + 12.5 * pitch + 0.55;
  rim.holes.push(roundedPath(new THREE.Path(), [
    [slotLeft, back], [slotRight, back], [slotRight, step], [rightBlock, step],
    [rightBlock, front], [leftBlock, front], [leftBlock, step], [slotLeft, step],
  ], 1.45));
  group.add(new THREE.Mesh(housingPart(rim, 15, 1.2, (y, z) =>
    join(y) + 1.48 + z / 15 * (deckLevel(y) - join(y) - 2.66)), body));
  group.add(new THREE.Mesh(housingPart(rectangle(288.2, 5.2, 105.1, 1.4), 1, 0.18,
    (y, z) => deckLevel(y) - 6 + z), plate));
}

interface KeyPosition {
  key: KeyboardKey;
  x: number;
  y: number;
  width: number;
  row: number;
}

function positions(): KeyPosition[] {
  return keyboardRows.flatMap((keys, row) => {
    let start = leftEdge + (row === 4 ? 1.5 * pitch : 0);
    return keys.map(key => {
      const units = (key.quarters ?? 4) / 4;
      const x = start + units * pitch / 2;
      start += units * pitch;
      return { key, x, y: rowStart + (row + 0.5) * pitch, width: units * pitch - 1.0, row };
    });
  });
}

// The top and front legends of each row share one atlas. All other faces
// sample a blank strip, so there is no duplicate printing on the rear wall.
function legendAtlas(keys: KeyPosition[]) {
  const canvas = document.createElement("canvas");
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  const ctx = canvas.getContext("2d")!;
  // A single repeating patch gives the molded PBT a fine satin surface
  // without introducing a new material or draw call for every key.
  const grain = document.createElement("canvas");
  grain.width = grain.height = 96;
  const grainContext = grain.getContext("2d")!;
  const pixels = grainContext.createImageData(grain.width, grain.height);
  let random = 17;
  for (let i = 0; i < pixels.data.length; i += 4) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    const shade = 242 + (random >>> 28) * 0.8;
    pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = shade;
    pixels.data[i + 3] = 255;
  }
  grainContext.putImageData(pixels, 0, 0);
  ctx.fillStyle = ctx.createPattern(grain, "repeat")!;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(pixelsPerMm, pixelsPerMm);
  ctx.fillStyle = "#414141";
  ctx.textBaseline = "middle";
  for (const { x, width, row, key } of keys) {
    if (!key.label) continue;
    const middle = keyboardSize.width / 2 + x;
    const rowTop = 2 + row * atlasRowHeight;
    const left = middle - width / 2 + 3.4;
    const print = (text: string, x: number, y: number, size: number, weight = 520) => {
      ctx.font = `${weight} ${size}px Arial, sans-serif`;
      ctx.fillText(text, x, y);
    };
    if (key.modifier && key.shift) {
      print(key.shift, middle, rowTop + 4.1, 2.55);
      print(key.label, left, rowTop + 8.6, 3.35);
    } else if (key.shift) {
      print(key.shift, left, rowTop + 3.95, 2.95);
      print(key.label, left, rowTop + 8.6, 3.7);
    } else {
      print(key.label, left, rowTop + (key.modifier ? 7.9 : 6.0), key.label.length > 1 ? 2.8 : 3.9);
    }
    if (key.front) print(key.front, left - 0.4, rowTop + 20.6, 2.25);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

class Surface {
  private points: number[] = [];
  private colors: number[] = [];
  private uv: number[] = [];
  private indices: number[] = [];

  vertex(x: number, y: number, z: number, tone: number, u: number, v: number) {
    const index = this.points.length / 3;
    this.points.push(x, y, z);
    this.colors.push(tone, tone, tone);
    this.uv.push(u, v);
    return index;
  }

  connect(a: number[], b: number[]) {
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      this.indices.push(a[i], a[j], b[i], a[j], b[j], b[i]);
    }
  }

  close(ring: number[], center: number) {
    for (let i = 0; i < ring.length; i++) this.indices.push(ring[i], ring[(i + 1) % ring.length], center);
  }

  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(this.points, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(this.colors, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(this.uv, 2));
    g.setIndex(this.indices);
    g.computeVertexNormals();
    return g;
  }
}

function addCap(surface: Surface, { key, x: cx, y: cy, row, width }: KeyPosition) {
  const depth = pitch - 1;
  const capWidth = width - 4.0;
  const capDepth = depth - 4.7;
  const space = !key.label;
  const tilt = [-0.095, -0.052, 0.015, 0.11, 0.16][row];
  const topZ = [keyboardSize.height - 0.56, 35.65, 32.2, 29.8, 27.4][row];
  const baseZ = deckLevel(cy) - 4.15;
  const crownOffset = -0.75;
  const atlasX = (x: number) => (keyboardSize.width / 2 + cx + x) * pixelsPerMm / atlasWidth;
  const atlasY = (y: number) => 1 - (2 + row * atlasRowHeight + y) * pixelsPerMm / atlasHeight;
  const crown = (x: number, y: number) => {
    const xRatio = 2 * x / capWidth;
    const yRatio = 2 * y / capDepth;
    const profileZ = topZ + tilt * y + (space ? 0.8 * (1 - yRatio ** 2) : -0.82 * (1 - xRatio ** 2));
    return THREE.MathUtils.lerp(baseZ, profileZ, keycapHeightScale);
  };
  // Extra loops at both ends of the skirt form the molded toe and shoulder.
  // On the front face, the legend follows the slant instead of floating on top.
  let last: number[] | undefined;
  const profiles = [
    { w: width - 0.45, d: depth - 0.45, t: 0, r: 1.20, tone: 0.20 },
    { w: width, d: depth, t: 0.11, r: 1.10, tone: 0.36 },
    { w: width - 0.28, d: depth - 0.30, t: 0.28, r: 1.00, tone: 0.59 },
    { w: capWidth + 0.8, d: capDepth + 0.8, t: 0.955, r: 0.90, tone: 0.94 },
    { w: capWidth, d: capDepth, t: 1, r: 0.94, tone: 0.97 },
  ];
  for (const { w, d, t, r, tone } of profiles) {
    const ring = roundedRing(w, d, r).map(([x, y]) => {
      const z = THREE.MathUtils.lerp(baseZ, crown(x * capWidth / w, y * capDepth / d), t);
      const front = y >= d / 2 - r;
      return surface.vertex(cx + x, cy + y + t * crownOffset, z, tone,
        atlasX(x), atlasY(front ? 17 + (1 - t) * 12 : 27.8));
    });
    if (last) surface.connect(last, ring);
    last = ring;
  }

  const border = roundedRing(capWidth, capDepth, 0.94);
  let top: number[] | undefined;
  for (const scale of [1, 0.83, 0.60, 0.35, 0.15]) {
    const ring = border.map(([bx, by]) => {
      const x = bx * scale, y = by * scale;
      return surface.vertex(cx + x, cy + y + crownOffset, crown(x, y), 1,
        atlasX(x), atlasY(7 + y));
    });
    if (top) surface.connect(top, ring);
    top = ring;
  }
  surface.close(top!, surface.vertex(cx, cy + crownOffset, crown(0, 0), 1, atlasX(0), atlasY(7)));
}

export function createKeyboardModel() {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ roughness: 0.70 });
  const lower = new THREE.MeshStandardMaterial({ roughness: 0.76 });
  const seam = new THREE.MeshStandardMaterial({ roughness: 0.89 });
  const plate = new THREE.MeshStandardMaterial({ roughness: 0.92 });
  makeHousing(group, body, lower, seam, plate);

  const keys = positions();
  const map = legendAtlas(keys);
  const alphas = new THREE.MeshStandardMaterial({ map, roughness: 0.68, vertexColors: true });
  const modifiers = alphas.clone();
  const alphaSurface = new Surface();
  const modifierSurface = new Surface();
  for (const placed of keys) addCap(placed.key.modifier ? modifierSurface : alphaSurface, placed);
  group.add(new THREE.Mesh(alphaSurface.geometry(), alphas), new THREE.Mesh(modifierSurface.geometry(), modifiers));

  let lastAppearance: boolean | undefined;
  function setDark(dark: boolean) {
    if (dark === lastAppearance) return;
    lastAppearance = dark;
    body.color.set(dark ? 0x30363a : 0xe1e1dc);
    lower.color.set(dark ? 0x242a2d : 0xbfc1bc);
    seam.color.set(dark ? 0x101415 : 0x92968f);
    plate.color.set(dark ? 0x111619 : 0x383c3c);
    alphas.color.set(dark ? 0x34393d : 0xf0f0eb);
    modifiers.color.set(dark ? 0x32373b : 0xb4bcc0);
  }

  setDark(false);
  return { group, setDark };
}
