import * as THREE from "three";
import type { FoldSample } from "./fold-preview-poses";
import { createBackSpine, createFoldSurface, createShell, displays, enclosure, foldProfile, mm, roundedRectangle } from "./fold-preview-geometry";
import type { createPageTurnProjection } from "./fold-preview-projection";

const lastCoverPose = 1;
const firstInnerPose = 2;

function flatScreenGeometry(width: number, height: number, hingeRadius: number, outerRadius: number) {
  const geometry = new THREE.ShapeGeometry(roundedRectangle(width, height, hingeRadius, outerRadius), 16);
  const points = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv");
  for (let index = 0; index < points.count; index++) {
    uv.setXY(index, points.getX(index) / width + 0.5, points.getY(index) / height + 0.5);
  }
  return geometry;
}

function displayMaterials(vertexColors = false) {
  return [
    new THREE.MeshBasicMaterial({ color: 0x121614, toneMapped: false, vertexColors }),
    new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, toneMapped: false, vertexColors,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    }),
  ] as const;
}

function addDisplay(group: THREE.Group, shape: THREE.BufferGeometry, materials: ReturnType<typeof displayMaterials>, x = 0, z = 0, reverse = false) {
  materials.forEach(material => {
    const mesh = new THREE.Mesh(shape, material);
    mesh.position.set(x, 0, z);
    mesh.rotation.y = reverse ? Math.PI : 0;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
}

function blendDisplay(materials: ReturnType<typeof displayMaterials>, from: THREE.Texture, to: THREE.Texture, mix: number, brightness: number) {
  materials.forEach((material, index) => {
    const map = index === 0 ? from : to;
    if (material.map !== map) {
      material.map = map;
      material.needsUpdate = true;
    }
    material.color.setScalar(brightness);
  });
  materials[1].opacity = from === to ? 0 : mix;
  materials[1].visible = materials[1].opacity > 0;
}

async function captureTexture(url: string, index: number, anisotropy: number, maxTextureSize: number) {
  const photo = await new THREE.ImageLoader().loadAsync(url);
  const quarterTurn = index === lastCoverPose || index > firstInnerPose;
  const display = index < firstInnerPose ? displays.cover : displays.inner;
  const aspect = display.width / display.height;
  const imageAspect = quarterTurn ? 1 / aspect : aspect;
  // Add the display's padding around the original pixels.
  const frameWidth = Math.max(photo.naturalWidth, Math.ceil(photo.naturalHeight * imageAspect));
  const frameHeight = Math.max(photo.naturalHeight, Math.ceil(photo.naturalWidth / imageAspect));
  const textureScale = Math.min(1, maxTextureSize / Math.max(frameWidth, frameHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(frameWidth * textureScale));
  canvas.height = Math.max(1, Math.floor(frameHeight * textureScale));
  const context = canvas.getContext("2d")!;
  const scale = Math.min(1, canvas.width / photo.naturalWidth, canvas.height / photo.naturalHeight);
  const width = Math.max(1, Math.round(photo.naturalWidth * scale));
  const height = Math.max(1, Math.round(photo.naturalHeight * scale));
  context.fillStyle = index < firstInnerPose ? "#000" : "#121614";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = "high";
  context.drawImage(photo, Math.floor((canvas.width - width) / 2), Math.floor((canvas.height - height) / 2), width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = anisotropy;
  texture.center.set(0.5, 0.5);
  texture.rotation = quarterTurn ? Math.PI / 2 : 0;
  return texture;
}

function createStudioReflections(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color(0x393c3e);
  const panel = new THREE.PlaneGeometry();
  const size = 64;
  const pixels = new Uint8Array(size * size * 4).fill(255);
  const edge = (pixel: number) => 1 - Math.abs((pixel + 0.5) / size * 2 - 1);
  for (let y = 0; y < size; y++) {
    const vertical = THREE.MathUtils.smoothstep(edge(y), 0, 0.83);
    for (let x = 0; x < size; x++) {
      const horizontal = THREE.MathUtils.smoothstep(edge(x), 0, 0.62);
      pixels[(y * size + x) * 4 + 3] = Math.round(vertical * horizontal * 255);
    }
  }
  const gradient = new THREE.DataTexture(pixels, size, size);
  gradient.magFilter = THREE.LinearFilter;
  gradient.minFilter = THREE.LinearFilter;
  gradient.needsUpdate = true;
  const lights = [
    { position: [1.7, -3.05, 8], width: 9.2, height: 2.3, intensity: 2.7 },
    { position: [-2.4, -4.95, 8.1], width: 11, height: 2.55, intensity: 0.85 },
    { position: [-4, 6, 2], width: 6.5, height: 2.25, intensity: 2.4 },
    { position: [6.5, 2.3, -3.2], width: 4.2, height: 6.3, intensity: 1.65 },
  ] as const;

  const cards = lights.map(({ position, width, height, intensity }) => {
    const card = new THREE.Mesh(panel, new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xffffff).multiplyScalar(intensity),
      map: gradient,
      transparent: true,
      depthWrite: false,
    }));
    card.position.fromArray(position);
    card.scale.set(width, height, 1);
    card.lookAt(0, 0, 0);
    studio.add(card);
    return card;
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const reflections = pmrem.fromScene(studio).texture;
  pmrem.dispose();
  panel.dispose();
  gradient.dispose();
  cards.forEach(card => card.material.dispose());
  return reflections;
}

export function createFoldPreviewScene(
  host: HTMLElement,
  options: { pageTurnProjection?: typeof createPageTurnProjection } = {},
) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  scene.add(new THREE.HemisphereLight(0xf7faf9, 0x797d73, 2.15));
  const key = new THREE.DirectionalLight(0xfff9ed, 2.6);
  key.position.set(-3, 5, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdcefea, 1.5);
  rim.position.set(4, 1, -3);
  scene.add(rim);

  const stand = new THREE.Group();
  const orientation = new THREE.Group();
  const hinge = new THREE.Group();
  const fixed = new THREE.Group();
  const leaf = new THREE.Group();
  scene.add(stand);
  stand.add(orientation);
  orientation.add(hinge);
  hinge.add(fixed, leaf);

  const reflections = createStudioReflections(renderer);
  const shell = new THREE.MeshStandardMaterial({
    color: 0xb5bbbb, metalness: 0.94, roughness: 0.19, envMap: reflections, envMapIntensity: 1.05,
  });
  const spineMaterial = new THREE.MeshStandardMaterial({
    color: 0x929b9a, metalness: 0.72, roughness: 0.61, envMap: reflections, envMapIntensity: 0.82,
    side: THREE.DoubleSide,
  });
  const glass = new THREE.MeshBasicMaterial({ color: 0x0d100f, toneMapped: false });
  const leftShell = createShell(false);
  const rightShell = createShell(true);
  fixed.add(new THREE.Mesh(rightShell.geometry, shell));
  leaf.add(new THREE.Mesh(leftShell.geometry, shell));

  const spine = createBackSpine();
  const spineMesh = new THREE.Mesh(spine.geometry, spineMaterial);
  spineMesh.frustumCulled = false;
  hinge.add(spineMesh);

  const innerBezel = createFoldSurface(enclosure.width - mm(1.45), enclosure.height - mm(1.45),
    enclosure.corner - mm(0.7), mm(0.13));
  const innerBezelMesh = new THREE.Mesh(innerBezel.geometry, glass);
  innerBezelMesh.frustumCulled = false;
  hinge.add(innerBezelMesh);
  const innerScreen = createFoldSurface(displays.inner.width, displays.inner.height, enclosure.corner - mm(3.4), mm(0.23));

  const coverBezel = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectangle(
    enclosure.width / 2 - mm(1.5), enclosure.height - mm(1.5), mm(1.15), enclosure.corner - mm(0.75),
  ), 16), glass);
  coverBezel.rotation.y = Math.PI;
  coverBezel.position.set(-enclosure.width / 4, 0, -enclosure.thickness - mm(0.13));
  leaf.add(coverBezel);

  const outer = displayMaterials();
  const inner = displayMaterials(true);
  const updateProjection = options.pageTurnProjection?.(outer, inner);
  addDisplay(hinge, innerScreen.geometry, inner);
  addDisplay(leaf, flatScreenGeometry(displays.cover.width, displays.cover.height, mm(1.25), enclosure.corner - mm(2.7)), outer,
    (enclosure.foldedWidth - enclosure.width) / 2, -enclosure.thickness - mm(0.23), true);

  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const { maxTextureSize } = renderer.capabilities;
  const gl = renderer.getContext();
  const maxBufferSide = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
  const [maxViewportWidth, maxViewportHeight] = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  const halfWidth = enclosure.width / 2;
  const halfHeight = enclosure.height / 2;
  const panelCorners = (edge: number) => [0, edge].flatMap(x => [-halfHeight, halfHeight].flatMap(y =>
    [-enclosure.thickness, mm(0.23)].map(z => new THREE.Vector3(x, y, z))));
  const panelBounds = [
    { panel: fixed, corners: panelCorners(halfWidth) },
    { panel: leaf, corners: panelCorners(-halfWidth) },
  ];
  const target = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const cornerInView = new THREE.Vector3();
  const verticalSlope = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.9;
  let width = 0;
  let height = 0;
  let pixelRatio = 0;
  let lastBend = -1;

  return {
    canvas: renderer.domElement,
    async loadCaptures(urls: string[]) {
      const results = await Promise.allSettled(urls.map((url, index) => captureTexture(url, index, anisotropy, maxTextureSize)));
      const textures = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
      if (textures.length !== urls.length) {
        textures.forEach(texture => texture.dispose());
        throw new Error("A folding preview capture could not be loaded");
      }
      return textures;
    },
    render(pose: FoldSample, textures: THREE.Texture[]) {
      const nextWidth = host.clientWidth;
      const nextHeight = host.clientHeight;
      if (nextWidth === 0 || nextHeight === 0) return;

      const viewportScale = Math.max(1, window.visualViewport?.scale ?? 1);
      const nextPixelRatio = Math.min(
        window.devicePixelRatio * viewportScale,
        4,
        Math.min(maxBufferSide, maxViewportWidth) / nextWidth,
        Math.min(maxBufferSide, maxViewportHeight) / nextHeight,
        Math.sqrt(8_000_000 / (nextWidth * nextHeight)),
      );
      if (nextWidth !== width || nextHeight !== height || nextPixelRatio !== pixelRatio) {
        width = nextWidth;
        height = nextHeight;
        pixelRatio = nextPixelRatio;
        renderer.setDrawingBufferSize(width, height, pixelRatio);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }

      // Fold Preview's bend and cover-display handoff, adapted to the procedural frame.
      // The original MIT notice is provided in public/zeropl/fold-preview-notice.txt.
      const bend = (180 - pose.opening) / 180 * Math.PI;
      if (bend !== lastBend) {
        const profile = foldProfile(bend);
        const hingeCorner = THREE.MathUtils.lerp(mm(0.65), mm(1.65),
          THREE.MathUtils.smoothstep(bend, Math.PI * 0.52, Math.PI * 0.96));
        leftShell.update(hingeCorner);
        rightShell.update(hingeCorner);
        leaf.rotation.y = bend;
        leaf.position.set(profile.leafX, 0, profile.leafZ);
        const leftEdge = Math.min(profile.leafX - halfWidth * Math.max(0, profile.cos),
          (halfWidth - enclosure.foldedWidth) * Math.sin(bend / 2));
        hinge.position.x = -(halfWidth + leftEdge) / 2;
        innerBezel.update(profile);
        innerScreen.update(profile);
        spineMesh.visible = bend > 0.01;
        if (spineMesh.visible) spine.update(profile, hingeCorner);
        lastBend = bend;
      }
      orientation.rotation.z = THREE.MathUtils.degToRad(pose.roll);
      stand.rotation.x = THREE.MathUtils.degToRad(pose.tilt);

      const coverLight = updateProjection
        ? Number(pose.opening < 180)
        : 1 - THREE.MathUtils.smoothstep(pose.opening, 25, 150);
      blendDisplay(outer, textures[Math.min(pose.previous, lastCoverPose)], textures[Math.min(pose.next, lastCoverPose)], pose.dissolve, coverLight);
      blendDisplay(inner, textures[Math.max(pose.previous, firstInnerPose)], textures[Math.max(pose.next, firstInnerPose)], pose.dissolve, 1);

      const yaw = THREE.MathUtils.degToRad(pose.yaw);
      const elevation = THREE.MathUtils.degToRad(pose.elevation);
      const plane = Math.cos(elevation);
      target.set(0, pose.targetY, 0);
      cameraDirection.set(Math.sin(yaw) * plane, Math.sin(elevation), Math.cos(yaw) * plane);
      cameraRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
      cameraUp.crossVectors(cameraDirection, cameraRight);

      // Preserve the initial framing, but pull back when a rotating corner approaches the edge.
      let distance = pose.distance * Math.max(1, 1.1 / camera.aspect);
      const horizontalSlope = verticalSlope * camera.aspect;
      stand.updateMatrixWorld(true);
      updateProjection?.(hinge.matrixWorld, bend);
      for (const { panel, corners } of panelBounds) {
        for (const corner of corners) {
          cornerInView.copy(corner).applyMatrix4(panel.matrixWorld).sub(target);
          const required = Math.max(
            Math.abs(cornerInView.dot(cameraRight)) / horizontalSlope,
            Math.abs(cornerInView.dot(cameraUp)) / verticalSlope,
          );
          distance = Math.max(distance, cornerInView.dot(cameraDirection) + required);
        }
      }
      camera.position.copy(target).addScaledVector(cameraDirection, distance);
      camera.lookAt(target);
      renderer.render(scene, camera);
    },
  };
}
