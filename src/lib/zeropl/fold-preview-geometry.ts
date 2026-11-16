import * as THREE from "three";

export const mm = (millimeters: number) => millimeters * 0.027;

// Reference proportions: https://www.apple.com/iphone-duo/specs/
export const enclosure = {
  width: mm(164.6),
  height: mm(117.8),
  thickness: mm(5.2),
  foldedWidth: mm(84.1),
  foldedThickness: mm(11.3),
  corner: mm(12.4),
};

export const displays = {
  inner: { width: mm(2670 * 25.4 / 430), height: mm(1878 * 25.4 / 430) },
  cover: { width: mm(1398 * 25.4 / 460), height: mm(2034 * 25.4 / 460) },
};

const leafWidth = enclosure.width / 2;
const foldedHingeWidth = enclosure.foldedWidth - leafWidth;
const minimumRadius = (enclosure.foldedThickness - 2 * enclosure.thickness) / 2;

export function roundedRectangle(width: number, height: number, leftRadius: number, rightRadius = leftRadius) {
  const x = width / 2;
  const y = height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-x + leftRadius, -y);
  shape.lineTo(x - rightRadius, -y);
  shape.quadraticCurveTo(x, -y, x, -y + rightRadius);
  shape.lineTo(x, y - rightRadius);
  shape.quadraticCurveTo(x, y, x - rightRadius, y);
  shape.lineTo(-x + leftRadius, y);
  shape.quadraticCurveTo(-x, y, -x, y - leftRadius);
  shape.lineTo(-x, -y + leftRadius);
  shape.quadraticCurveTo(-x, -y, -x + leftRadius, -y);
  return shape;
}

export function createShell(hingeOnLeft: boolean) {
  const bevel = mm(0.45);
  const sideInset = mm(0.12);
  const sideDepth = enclosure.thickness - 2 * bevel;
  const cornerSegments = 12;
  const xCenter = (hingeOnLeft ? 1 : -1) * leafWidth / 2;
  const corners = [
    { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 },
  ];
  const outline = corners.flatMap(({ x, y }, corner) =>
    Array.from({ length: cornerSegments + 1 }, (_, step) => {
      const angle = (corner + step / cornerSegments) * Math.PI / 2;
      return { x, y, nx: Math.cos(angle), ny: Math.sin(angle) };
    }));
  const edge = Array.from({ length: 4 }, (_, index) => {
    const angle = index / 3 * Math.PI / 2;
    const radial = Math.sin(angle);
    const axial = Math.cos(angle);
    return { inset: sideInset + bevel * (1 - radial), depth: bevel * (1 - axial), radial, axial };
  });
  // A shallow crown moves the reflected light across the polished sidewall.
  const side = Array.from({ length: 7 }, (_, index) => {
    const progress = (index + 1) / 8;
    const angle = 2 * Math.PI * progress;
    const slope = Math.PI * sideInset * Math.sin(angle) / sideDepth;
    const length = Math.hypot(1, slope);
    return {
      inset: sideInset * (1 + Math.cos(angle)) / 2,
      z: -enclosure.thickness + bevel + progress * sideDepth,
      radial: 1 / length,
      axial: -slope / length,
    };
  });
  const rings = [
    ...edge.map(({ inset, depth, radial, axial }) => ({ inset, z: -enclosure.thickness + depth, radial, axial: -axial })),
    ...side,
    ...edge.slice().reverse().map(({ inset, depth, radial, axial }) => ({ inset, z: -depth, radial, axial })),
  ];
  const perimeter = outline.length;
  const backCenter = rings.length * perimeter;
  const frontCenter = backCenter + 1;
  const positions = new THREE.BufferAttribute(new Float32Array((frontCenter + 1) * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const normals = new THREE.BufferAttribute(new Float32Array((frontCenter + 1) * 3), 3);
  rings.forEach(({ radial, axial }, ring) => {
    outline.forEach(({ nx, ny }, index) => {
      normals.setXYZ(ring * perimeter + index, radial * nx, radial * ny, axial);
    });
  });
  normals.setXYZ(backCenter, 0, 0, -1);
  normals.setXYZ(frontCenter, 0, 0, 1);
  const indices: number[] = [];
  for (let index = 0; index < perimeter; index++) {
    const next = (index + 1) % perimeter;
    const front = backCenter - perimeter;
    indices.push(backCenter, next, index, frontCenter, front + index, front + next);
    for (let ring = 0; ring < rings.length - 1; ring++) {
      const offset = ring * perimeter;
      const a = offset + index;
      const b = offset + next;
      indices.push(a, b, a + perimeter, b, b + perimeter, a + perimeter);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute("position", positions);
  geometry.setAttribute("normal", normals);
  positions.setXYZ(backCenter, xCenter, 0, -enclosure.thickness);
  positions.setXYZ(frontCenter, xCenter, 0, 0);
  let lastRadius = -1;

  return {
    geometry,
    update(hingeRadius: number) {
      if (hingeRadius === lastRadius) return;
      lastRadius = hingeRadius;
      rings.forEach(({ inset, z }, ring) => {
        outline.forEach(({ x, y, nx, ny }, index) => {
          const atHinge = hingeOnLeft ? x < 0 : x > 0;
          const radius = atHinge ? hingeRadius : enclosure.corner;
          const cx = xCenter + x * (leafWidth / 2 - radius);
          const cy = y * (enclosure.height / 2 - radius);
          positions.setXYZ(ring * perimeter + index, cx + (radius - inset) * nx, cy + (radius - inset) * ny, z);
        });
      });
      positions.needsUpdate = true;
    },
  };
}

export function foldProfile(angle: number) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const radius = THREE.MathUtils.lerp(mm(2.6), minimumRadius, (angle / Math.PI) ** 4);
  const halfArc = radius * angle / 2;
  const leafX = halfArc * (1 + cos) - radius * sin;
  const leafZ = radius * (1 - cos) - halfArc * sin;
  return { angle, sin, cos, radius, halfArc, leafX, leafZ };
}

type FoldProfile = ReturnType<typeof foldProfile>;

function stripIndices(columns: number) {
  const indices: number[] = [];
  for (let column = 0; column < columns - 1; column++) {
    const edge = column * 2;
    indices.push(edge, edge + 2, edge + 1, edge + 2, edge + 3, edge + 1);
  }
  return indices;
}

export function createFoldSurface(width: number, height: number, corner: number, offset: number) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const band = mm(6);
  const columns = (from: number, to: number, count: number) =>
    Array.from({ length: count }, (_, index) => THREE.MathUtils.lerp(from, to, index / count));
  const xs = [
    ...columns(-halfWidth, -band, 72),
    ...columns(-band, band, 48),
    ...columns(band, halfWidth, 72),
    halfWidth,
  ];
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array(xs.length * 6), 3).setUsage(THREE.DynamicDrawUsage);
  const uv = new THREE.BufferAttribute(new Float32Array(xs.length * 4), 2);
  const color = new THREE.BufferAttribute(new Float32Array(xs.length * 6), 3).setUsage(THREE.DynamicDrawUsage);

  xs.forEach((x, index) => {
    const roundEdge = Math.max(0, Math.abs(x) - (halfWidth - corner));
    const edge = halfHeight - corner + Math.sqrt(Math.max(0, corner ** 2 - roundEdge ** 2));
    position.setXYZ(index * 2, x, -edge, offset);
    position.setXYZ(index * 2 + 1, x, edge, offset);
    uv.setXY(index * 2, x / width + 0.5, 0.5 - edge / height);
    uv.setXY(index * 2 + 1, x / width + 0.5, 0.5 + edge / height);
  });
  geometry.setIndex(stripIndices(xs.length));
  geometry.setAttribute("position", position);
  geometry.setAttribute("uv", uv);
  geometry.setAttribute("color", color);

  return {
    geometry,
    update(profile: FoldProfile) {
      const { angle, sin, cos, radius, halfArc, leafX, leafZ } = profile;
      const crease = Math.sin(angle / 2) * 0.07;
      // The left leaf bends toward the fixed right side. UVs follow the glass.
      xs.forEach((x, index) => {
        let px = x;
        let pz = offset;
        if (x < -halfArc) {
          px = leafX + x * cos + offset * sin;
          pz = leafZ - x * sin + offset * cos;
        } else if (x < halfArc) {
          const turn = (halfArc - x) / radius;
          px = halfArc - (radius - offset) * Math.sin(turn);
          pz = radius - (radius - offset) * Math.cos(turn);
        }
        const light = 1 - crease * Math.exp(-((x / mm(1.8)) ** 2));
        const bottom = 2 * index;
        position.setXYZ(bottom, px, position.getY(bottom), pz);
        position.setXYZ(bottom + 1, px, position.getY(bottom + 1), pz);
        color.setXYZ(bottom, light, light, light);
        color.setXYZ(bottom + 1, light, light, light);
      });
      position.needsUpdate = true;
      color.needsUpdate = true;
    },
  };
}

export function createBackSpine() {
  const segments = 24;
  const count = segments + 1;
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array(count * 6), 3).setUsage(THREE.DynamicDrawUsage);
  const indices = stripIndices(count);
  for (let i = 1; i < segments; i++) {
    indices.push(0, 2 * i + 2, 2 * i, 1, 2 * i + 1, 2 * i + 3);
  }
  geometry.setIndex(indices);
  geometry.setAttribute("position", position);

  return {
    geometry,
    update({ angle, leafX, leafZ, sin, cos }: FoldProfile, corner: number) {
      const thickness = enclosure.thickness;
      const halfHeight = enclosure.height / 2 - corner - mm(0.1);
      const endX = leafX - thickness * sin;
      const endZ = leafZ - thickness * cos;
      const tangent = (4 / 3) * foldedHingeWidth * Math.sin(angle / 2);
      const endInset = mm(1.05) * Math.sin(angle / 2);
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const inverse = 1 - t;
        const a = 3 * inverse ** 2 * t;
        const b = 3 * inverse * t ** 2;
        const x = -a * tangent + b * (endX + tangent * cos) + t ** 3 * endX;
        const z = -(inverse ** 3 + a) * thickness + b * (endZ - tangent * sin) + t ** 3 * endZ;
        const edge = halfHeight - endInset * Math.sin(Math.PI * t);
        position.setXYZ(2 * i, x, -edge, z);
        position.setXYZ(2 * i + 1, x, edge, z);
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
    },
  };
}
