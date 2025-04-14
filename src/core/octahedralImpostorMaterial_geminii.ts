import { ShaderMaterial, Texture, Uniform } from 'three';

export interface OctahedralImpostorMaterialParameters {
  albedo?: Texture;
  depthMap?: Texture;
  spritesPerSide?: number;
  parallaxScale?: number;
  alphaClamp?: number;
  worldToUvScale?: number; // Nuovo parametro per la scala UV
}

export class OctahedralImpostorMaterial extends ShaderMaterial {
  public override type = 'OctahedralImpostorMaterial';
  public isOctahedralImpostorMaterial = true;

  public override vertexShader = /* glsl */`
    uniform float spritesPerSide;
    uniform float worldToUvScale; // Scala da unità del mondo a unità UV [0,1]

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
      vec3 octant = sign(direction);
      float sum = dot(direction, octant);
      vec3 octahedron = direction / sum;
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
      tangent = normalize(cross(up, normal)); // TODO this should be already normalized?
      bitangent = cross(normal, tangent));
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

    vec2 projectToPlaneUV_old(vec3 normal, vec3 tangent, vec3 bitangent, vec3 pivotToCamera, vec3 vertexToCamera) {
      float pivotDot = dot(normal, pivotToCamera);
      float vertexDot = dot(normal, vertexToCamera);
      vec3 offset = vertexToCamera * (pivotDot / vertexDot) - pivotToCamera;
      vec2 uv = vec2(dot(tangent, offset), dot(bitangent, offset));
      return uv + 0.5;
    }

    // --- NUOVA Funzione Proiezione UV (Ray-Plane Intersection) ---
    // Calcola l'UV proiettando il raggio visivo sul piano dello sprite
    vec2 projectToPlaneUV_RayPlane(vec3 normal, vec3 tangent, vec3 bitangent, vec3 cameraPosLocal, vec3 vertexPosLocal) {
        // vertexPosLocal è la posizione finale del vertice usata in gl_Position (nel tuo caso 'projectedVertex')
        vec3 viewDir = normalize(vertexPosLocal - cameraPosLocal); // Direzione: camera -> vertice

        // Intersezione Ray-Plane (Piano: dot(P, normal)=0, Ray: P = cameraPosLocal + viewDir*t)
        float viewDotNormal = dot(viewDir, normal);

        if (abs(viewDotNormal) < 0.0001) { // Vista parallela al piano
            return vec2(0.5); // Restituisce UV centrale
        }

        // Distanza 't' dalla camera all'intersezione
        float t = -dot(cameraPosLocal, normal) / viewDotNormal;

        // Punto di intersezione nello spazio locale (relativo all'origine/pivot)
        vec3 intersectionPoint = cameraPosLocal + viewDir * t;

        // Proietta il punto di intersezione sulla base T/B per ottenere l'offset UV
        // Usa la scala fornita per mappare le unità del mondo agli UV [0,1]
        vec2 uvOffset = vec2(dot(intersectionPoint, tangent), dot(intersectionPoint, bitangent)) * worldToUvScale;

        return uvOffset + 0.5; // Assume centro a 0.5, risultato in [0,1] (circa)
    }

    vec2 projectDirectionToBasis(vec3 dir, vec3 tangent, vec3 bitangent)
    {
      return vec2(dot(dir, tangent), dot(dir, bitangent));
    }

    void main() {
      vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);

      // Calcoli camera e direzione (INVARIATI)
      vec3 cameraPosLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
      vec3 cameraDir = normalize(cameraPosLocal); // Dir da origine a camera

      // Calcolo vertice proiettato (INVARIATO - ANCORA SOSPETTO)
      vec3 projectedVertex = projectVertex(cameraDir);

      // *** CORREZIONE CALCOLO vertexToCamera e viewDirLocal ***
      vec3 vertexToCameraCorrected = cameraPosLocal - projectedVertex; // Vettore: vertice proiettato -> camera
      vec3 viewDirLocal = normalize(vertexToCameraCorrected); // Direzione normalizzata: vertice proiettato -> camera

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

      vec3 planeX1, planeY1, planeX2, planeY2, planeX3, planeY3;
      computePlaneBasis(spriteNormal1, planeX1, planeY1);
      computePlaneBasis(spriteNormal2, planeX2, planeY2);
      computePlaneBasis(spriteNormal3, planeX3, planeY3);

      // *** NUOVO CALCOLO UV usando projectToPlaneUV_RayPlane ***
      vSpriteUV1 = projectToPlaneUV_RayPlane(spriteNormal1, planeX1, planeY1, cameraPosLocal, projectedVertex);
      vSpriteUV2 = projectToPlaneUV_RayPlane(spriteNormal2, planeX2, planeY2, cameraPosLocal, projectedVertex);
      vSpriteUV3 = projectToPlaneUV_RayPlane(spriteNormal3, planeX3, planeY3, cameraPosLocal, projectedVertex);

      // Calcolo vSpriteViewDir (INVARIATO, usa -viewDirLocal = camera->vertice)
      vSpriteViewDir1 = projectDirectionToBasis(-viewDirLocal, planeX1, planeY1).xy;
      vSpriteViewDir2 = projectDirectionToBasis(-viewDirLocal, planeX2, planeY2).xy;
      vSpriteViewDir3 = projectDirectionToBasis(-viewDirLocal, planeX3, planeY3).xy;

      // Output posizione (INVARIATO, usa projectedVertex)
      gl_Position = projectionMatrix * modelViewMatrix * vec4(projectedVertex, 1.0);
    }
  `;

  public override fragmentShader = /* glsl */`
    precision highp float;

    uniform sampler2D albedo;
    uniform sampler2D depthMap;
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

    vec4 blendImpostorSamples(vec2 uv1, vec2 uv2, vec2 uv3)
    {
      vec4 sprite1 = texture(albedo, uv1); // Corrisponde a vSprite1 (indice base)
      vec4 sprite2 = texture(albedo, uv2); // Corrisponde a vSprite2 (indice adiacente)
      vec4 sprite3 = texture(albedo, uv3); // Corrisponde a vSprite3 (indice diagonale)
      return sprite1 * vSpritesWeight.z + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.x;
    }

    vec2 parallaxUV(vec2 uv, vec2 gridIndex, vec2 viewDir, float spriteSize)
    {
        vec2 uvInCell = uv; // Usiamo l'UV [0,1] calcolato da RayPlane come base

        vec2 depthSampleUV = spriteSize * (gridIndex + uvInCell); // Campiona profondità all'UV base
        float depth = 1.0 - texture(depthMap, depthSampleUV).x; // Adatta se necessario
        float height = (depth - 0.5); // Mappa a [-0.5, 0.5], adatta se necessario

        vec2 parallaxOffset = viewDir * height * parallaxScale; // Calcola offset

        vec2 finalUVInCell = clamp(uvInCell + parallaxOffset, vec2(0.0), vec2(1.0));

        return spriteSize * (gridIndex + finalUVInCell);
    }


    void main() {
      float spriteSize = 1.0 / spritesPerSide;

      vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize);
      vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize);
      vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize);

      vec4 blendedColor = blendImpostorSamples(uv1, uv2, uv3);

      if (blendedColor.a <= alphaClamp) discard;

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

  public get worldToUvScale(): number { return this.uniforms.worldToUvScale.value; }
  public set worldToUvScale(value) { this.uniforms.worldToUvScale.value = value; }

  constructor(parameters: OctahedralImpostorMaterialParameters = {}) {
    super();

    this.transparent = true;
    this.depthWrite = false;

    this.uniforms = {
      albedo: new Uniform(parameters.albedo ?? null),
      depthMap: new Uniform(parameters.depthMap ?? null),
      spritesPerSide: new Uniform(parameters.spritesPerSide ?? 16),
      parallaxScale: new Uniform(parameters.parallaxScale ?? 0.05),
      alphaClamp: new Uniform(parameters.alphaClamp ?? 0.1),
      worldToUvScale: new Uniform(parameters.worldToUvScale ?? 1.0) // Nuovo uniform, default a 1.0
    };
  }
}
