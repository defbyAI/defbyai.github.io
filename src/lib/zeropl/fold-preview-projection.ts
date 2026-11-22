import * as THREE from "three";
import { displays, enclosure, foldProfile, mm } from "./fold-preview-geometry";

// The fixed front-view projection and edge treatment follow the MIT-licensed
// Fold Preview credited in public/zeropl/fold-preview-notice.txt.
export function createPageTurnProjection(
  cover: readonly THREE.MeshBasicMaterial[],
  inner: readonly THREE.MeshBasicMaterial[],
) {
  const hingeFromWorld = { value: new THREE.Matrix4() };
  const bend = { value: 0 };
  const eyeDistance = enclosure.width * 2.5;
  const coverPlane = foldProfile(Math.PI).leafZ + enclosure.thickness + mm(0.23);

  function configure(material: THREE.MeshBasicMaterial, isCover: boolean) {
    const display = isCover ? displays.cover : displays.inner;
    material.customProgramCacheKey = () => isCover ? "fold-projection-cover" : "fold-projection-inner";
    material.onBeforeCompile = (shader) => {
      shader.uniforms.hingeFromWorld = hingeFromWorld;
      shader.uniforms.foldBend = bend;
      shader.uniforms.displaySize = { value: new THREE.Vector2(display.width, display.height) };
      shader.uniforms.frontEye = { value: eyeDistance };
      shader.uniforms.displayPlane = { value: isCover ? coverPlane : mm(0.23) };

      shader.vertexShader = `
        uniform mat4 hingeFromWorld;
        uniform vec2 displaySize;
        uniform float frontEye, displayPlane;
        varying vec3 foldProjection;
      ` + shader.vertexShader.replace("#include <project_vertex>", `
        #include <project_vertex>
        mat4 hingeFromMesh = hingeFromWorld * modelMatrix;
        vec3 p = (hingeFromMesh * vec4(transformed, 1.0)).xyz;
        float depth = frontEye - p.z;
        vec2 numerator = p.xy * (frontEye - displayPlane) / displaySize;
        ${isCover ? `
          // Pin u=0 to the moving hinge-side edge of the cover.
          vec3 edge = (hingeFromMesh * vec4(-0.5 * displaySize.x, 0.0, 0.0, 1.0)).xyz;
          float anchor = edge.x * (frontEye - displayPlane) / (frontEye - edge.z);
          numerator.x -= depth * anchor / displaySize.x;
          numerator.y += 0.5 * depth;
        ` : "numerator += 0.5 * depth;"}
        foldProjection = vec3(numerator, depth);
      `);

      shader.fragmentShader = shader.fragmentShader.replace("#include <map_pars_fragment>", `
        #include <map_pars_fragment>
        #ifdef USE_MAP
          uniform float foldBend;
          uniform mat3 mapTransform;
          varying vec3 foldProjection;

          vec3 sampleScreen(vec2 uv, vec2 footprint, float level) {
            vec2 mask = smoothstep(-footprint, footprint, uv)
                      * smoothstep(-footprint, footprint, 1.0 - uv);
            return textureLod(map, clamp(uv, 0.0, 1.0), level).rgb * mask.x * mask.y;
          }
        #endif
      `).replace("#include <map_fragment>", `
        #ifdef USE_MAP
          float motion = smoothstep(0.0, 0.5 * PI, ${isCover ? "PI - foldBend" : "foldBend"});
          if (motion == 0.0) {
            #include <map_fragment>
          } else {
            vec2 faceUV = foldProjection.xy / foldProjection.z;
            vec2 uv = (mapTransform * vec3(faceUV, 1.0)).xy;
            float edge = clamp(${isCover ? "faceUV.x" : "1.0 - 2.0 * faceUV.x"}, 0.0, 1.0);
            vec2 size = vec2(textureSize(map, 0));
            vec2 pixel = 1.0 / size;
            float radius = 0.038 * size.y * motion * pow(edge, 1.35);
            float texels = max(length(dFdx(uv) * size), length(dFdy(uv) * size));
            float level = log2(max(max(texels, radius), 1.0));
            vec2 footprint = max(fwidth(uv), pixel * max(0.5, radius));
            vec3 color = sampleScreen(uv, footprint, level);
            if (radius > 0.0) {
              vec2 stepUV = pixel * radius;
              vec2 diagonal = vec2(stepUV.x, -stepUV.y);
              color = 0.5 * color + 0.125 * (
                sampleScreen(uv + stepUV, footprint, level) + sampleScreen(uv - stepUV, footprint, level) +
                sampleScreen(uv + diagonal, footprint, level) + sampleScreen(uv - diagonal, footprint, level)
              );
            }
            float shade = min(1.0, 2.0 * motion * pow(max(0.0, (edge - 0.2) / 0.8), 1.35));
            diffuseColor.rgb *= color * (1.0 - shade);
          }
        #endif
      `);
    };
  }

  cover.forEach(material => configure(material, true));
  inner.forEach(material => configure(material, false));
  return (hingeMatrixWorld: THREE.Matrix4, angle: number) => {
    hingeFromWorld.value.copy(hingeMatrixWorld).invert();
    bend.value = angle;
  };
}
