import { ShaderMaterial, Texture } from 'three';

export interface OctahedralImpostorMaterialParameters {
  albedo?: Texture;
  depthMap?: Texture;
  spritesPerSide?: number;
  parallaxScale?: number;
  alphaClamp?: number;
}

export class OctahedralImpostorMaterial extends ShaderMaterial {
  public override type = 'OctahedralImpostorMaterial';
  public isOctahedralImpostorMaterial = true;

  public override vertexShader = /* glsl */`
    // uniform bool isFullSphere;
    uniform float spritesPerSide;

    flat varying vec4 vSpritesWeight;
    flat varying vec2 vSprite1;
    flat varying vec2 vSprite2;
    flat varying vec2 vSprite3;
    varying vec2 vSpriteUV1;
    varying vec2 vSpriteUV2;
    varying vec2 vSpriteUV3;
    varying vec2 vSpriteViewDir1;
    varying vec2 vSpriteViewDir2;
    varying vec2 vSpriteViewDir3;
    flat varying vec3 vSpriteNormal1;
    flat varying vec3 vSpriteNormal2;
    flat varying vec3 vSpriteNormal3;

    vec2 encodeHemiOctaDirection(vec3 direction) {
      vec3 octahedron = direction / dot(direction, sign(direction));    
      return vec2(1.0 + octahedron.x + octahedron.z, 1.0 + octahedron.z - octahedron.x) * vec2(0.5);
    }

    vec2 encodeDirection(vec3 direction) {
      return encodeHemiOctaDirection(direction);
    }

    vec3 decodeHemiOctaGrid(vec2 gridUV) {
      vec3 position = vec3(gridUV.x - gridUV.y, 0.0, -1.0 + gridUV.x + gridUV.y);
      position.y = 1.0 - abs(position.x) - abs(position.z);
      return position;
    }

    vec3 decodeDirection(vec2 gridIndex, vec2 spriteCountMinusOne) {
      vec2 gridUV = gridIndex / spriteCountMinusOne;
      return normalize(decodeHemiOctaGrid(gridUV));
    }

    void computePlaneBasis(vec3 normal, out vec3 tangent, out vec3 bitangent)
    {
      vec3 up = vec3(0.0, 1.0, 0.0);

      if (normal.y > 0.999) up = vec3(-1.0, 0.0, 0.0);
      // // only if no hemiOcta
      // if (normal.y < -0.999) up = vec3(1.0, 0.0, 0.0);

      tangent = normalize(cross(up, normal));
      bitangent = cross(normal, tangent);
    }

    vec3 projectVertex(vec3 normal) {
      vec3 x, y;
      computePlaneBasis(normal, x, y);
      return x * position.x + y * position.y;
    }

    void computeSpritesWeight(vec2 gridFract) {
      vSpritesWeight = vec4(
        min(1.0 - gridFract.x, 1.0 - gridFract.y),
        abs(gridFract.x - gridFract.y),
        min(gridFract.x, gridFract.y),
        ceil(gridFract.x - gridFract.y)
      );
    }

    vec2 projectToPlaneUV(vec3 normal, vec3 tangent, vec3 bitangent, vec3 cameraPosition, vec3 viewDir) {
      float denom = dot(viewDir, normal);
      float t = -dot(cameraPosition, normal) / denom;
      
      vec3 hit = cameraPosition + viewDir * t;
      vec2 uv = vec2(dot(tangent, hit), dot(bitangent, hit));
      return uv + 0.5;
    }

    vec2 projectDirectionToBasis(vec3 dir, vec3 tangent, vec3 bitangent)
    {
      return vec2(dot(dir, tangent), dot(dir, bitangent));
    }

    void main() {
      vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);

      vec3 cameraPosLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec3 cameraDir = normalize(cameraPosLocal);

      vec3 projectedVertex = projectVertex(cameraDir);
      vec3 viewDirLocal = normalize(projectedVertex - cameraPosLocal);

      vec2 grid = encodeDirection(cameraDir) * spritesMinusOne; 
      vec2 gridFloor = min(floor(grid), spritesMinusOne);
      vec2 gridFract = fract(grid);

      computeSpritesWeight(gridFract);

      vSprite1 = gridFloor;
      vSprite2 = min(vSprite1 + mix(vec2(0.0, 1.0), vec2(1.0, 0.0), vSpritesWeight.w), spritesMinusOne);
      vSprite3 = min(vSprite1 + vec2(1.0), spritesMinusOne);

      vec3 spriteNormal1 = decodeDirection(vSprite1, spritesMinusOne);
      vec3 spriteNormal2 = decodeDirection(vSprite2, spritesMinusOne);
      vec3 spriteNormal3 = decodeDirection(vSprite3, spritesMinusOne);

      vSpriteNormal1 = normalMatrix * spriteNormal1;
      vSpriteNormal2 = normalMatrix * spriteNormal2; 
      vSpriteNormal3 = normalMatrix * spriteNormal3;

      vec3 planeX1, planeY1, planeX2, planeY2, planeX3, planeY3;

      computePlaneBasis(spriteNormal1, planeX1, planeY1);
      computePlaneBasis(spriteNormal2, planeX2, planeY2);
      computePlaneBasis(spriteNormal3, planeX3, planeY3);

      vSpriteUV1 = projectToPlaneUV(spriteNormal1, planeX1, planeY1, cameraPosLocal, viewDirLocal);
      vSpriteUV2 = projectToPlaneUV(spriteNormal2, planeX2, planeY2, cameraPosLocal, viewDirLocal); 
      vSpriteUV3 = projectToPlaneUV(spriteNormal3, planeX3, planeY3, cameraPosLocal, viewDirLocal); 

      vSpriteViewDir1 = projectDirectionToBasis(viewDirLocal, planeX1, planeY1).xy;
      vSpriteViewDir2 = projectDirectionToBasis(viewDirLocal, planeX2, planeY2).xy;
      vSpriteViewDir3 = projectDirectionToBasis(viewDirLocal, planeX3, planeY3).xy;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(projectedVertex, 1.0);
    }
  `;

  public override fragmentShader = /* glsl */`
    // precision highp float;

    uniform sampler2D albedo;
    uniform sampler2D depthMap;
    // uniform sampler2D normalMap;
    // uniform sampler2D ormMap;
    uniform float spritesPerSide;
    uniform float parallaxScale;
    uniform float alphaClamp;

    flat varying vec4 vSpritesWeight;
    flat varying vec2 vSprite1;
    flat varying vec2 vSprite2;
    flat varying vec2 vSprite3;
    varying vec2 vSpriteUV1;
    varying vec2 vSpriteUV2;
    varying vec2 vSpriteUV3;
    varying vec2 vSpriteViewDir1;
    varying vec2 vSpriteViewDir2;
    varying vec2 vSpriteViewDir3;
    flat varying vec3 vSpriteNormal1;
    flat varying vec3 vSpriteNormal2;
    flat varying vec3 vSpriteNormal3;

    vec4 blendImpostorSamples(vec2 uv1, vec2 uv2, vec2 uv3)
    {
      vec4 sprite1 = texture(albedo, uv1);
      vec4 sprite2 = texture(albedo, uv2);
      vec4 sprite3 = texture(albedo, uv3);

      return sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;
    }

    vec2 parallaxUV(vec2 uv, vec2 gridIndex, vec2 viewDir, float spriteSize, float weight) 
    {
      vec2 spriteUv = spriteSize * (gridIndex + uv);
      float depth = 1.0 - texture(depthMap, spriteUv).x;

      vec2 parallaxOffset = viewDir * depth * parallaxScale * weight;
      uv = clamp(uv + parallaxOffset, vec2(0.0), vec2(1.0));
      
      return spriteSize * (gridIndex + uv);
    }

    void main() {
      float spriteSize = 1.0 / spritesPerSide;

      vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize, vSpritesWeight.x);
      vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize, vSpritesWeight.y);
      vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize, vSpritesWeight.z);

      vec4 blendedColor = blendImpostorSamples(uv1, uv2, uv3);

      if (blendedColor.a <= alphaClamp) discard;

      // remove transparency
      blendedColor = vec4(vec3(blendedColor.rgb) / (blendedColor.a), 1.0);

      gl_FragColor = blendedColor;
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `;

  public get albedo(): Texture { return this.uniforms.albedo.value; }
  public set albedo(texture) { this.uniforms.albedo.value = texture; }

  public get depthMap(): Texture { return this.uniforms.depthMap.value; }
  public set depthMap(texture) { this.uniforms.depthMap.value = texture; }

  public get spritesPerSide(): number { return this.uniforms.spritesPerSide.value; }
  public set spritesPerSide(value) { this.uniforms.spritesPerSide.value = value; }

  public get parallaxScale(): number { return this.uniforms.parallaxScale.value; }
  public set parallaxScale(value) { this.uniforms.parallaxScale.value = value; }

  public get alphaClamp(): number { return this.uniforms.alphaClamp.value; }
  public set alphaClamp(value) { this.uniforms.alphaClamp.value = value; }

  constructor(parameters: OctahedralImpostorMaterialParameters = {}) {
    super();

    // this.transparent = true;
    // this.depthWrite = false;

    this.uniforms = {
      albedo: { value: parameters.albedo },
      depthMap: { value: parameters.depthMap },
      spritesPerSide: { value: parameters.spritesPerSide },
      parallaxScale: { value: parameters.parallaxScale },
      alphaClamp: { value: parameters.alphaClamp }
    };
  }
}
