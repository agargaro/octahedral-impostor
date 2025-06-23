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

#ifdef EZ_USE_NORMAL
flat varying vec3 vSpriteNormal1;
flat varying vec3 vSpriteNormal2;
flat varying vec3 vSpriteNormal3;
#endif

vec2 encodeDirection(vec3 direction) {
  #ifdef EZ_USE_HEMI_OCTAHEDRON

  vec3 octahedron = direction / dot(direction, sign(direction));
  return vec2(1.0 + octahedron.x + octahedron.z, 1.0 + octahedron.z - octahedron.x) * vec2(0.5);

  #else

  //

  #endif
}

vec3 decodeDirection(vec2 gridIndex, vec2 spriteCountMinusOne) {
  vec2 gridUV = gridIndex / spriteCountMinusOne;

  #ifdef EZ_USE_HEMI_OCTAHEDRON

  vec3 position = vec3(gridUV.x - gridUV.y, 0.0, -1.0 + gridUV.x + gridUV.y);
  position.y = 1.0 - abs(position.x) - abs(position.z);

  #else

    //

  #endif

  return normalize(position);
}

void computePlaneBasis(vec3 normal, out vec3 tangent, out vec3 bitangent) {
  vec3 up = vec3(0.0, 1.0, 0.0);

  if(normal.y > 0.999)
    up = vec3(-1.0, 0.0, 0.0);

  #ifndef EZ_USE_HEMI_OCTAHEDRON
  if(normal.y < -0.999)
    up = vec3(1.0, 0.0, 0.0);
  #endif

  tangent = normalize(cross(up, normal));
  bitangent = cross(normal, tangent);
}

vec3 projectVertex(vec3 normal) {
  vec3 x, y;
  computePlaneBasis(normal, x, y);
  return x * position.x + y * position.y;
}

void computeSpritesWeight(vec2 gridFract) {
  vSpritesWeight = vec4(min(1.0 - gridFract.x, 1.0 - gridFract.y), abs(gridFract.x - gridFract.y), min(gridFract.x, gridFract.y), ceil(gridFract.x - gridFract.y));
}

vec2 projectToPlaneUV(vec3 normal, vec3 tangent, vec3 bitangent, vec3 cameraPosition, vec3 viewDir) {
  float denom = dot(viewDir, normal);
  float t = -dot(cameraPosition, normal) / denom;

  vec3 hit = cameraPosition + viewDir * t;
  vec2 uv = vec2(dot(tangent, hit), dot(bitangent, hit));
  return uv + 0.5;
}

vec2 projectDirectionToBasis(vec3 dir, vec3 tangent, vec3 bitangent) {
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

  #ifdef EZ_USE_NORMAL
  vSpriteNormal1 = normalMatrix * spriteNormal1;
  vSpriteNormal2 = normalMatrix * spriteNormal2;
  vSpriteNormal3 = normalMatrix * spriteNormal3;
  #endif

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
