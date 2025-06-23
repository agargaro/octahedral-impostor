#include <shadowmap_vertex>

vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);

vec3 cameraPosLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
vec3 cameraDir = normalize(cameraPosLocal);

vec3 projectedVertex = projectVertex(cameraDir);
vec3 viewDirLocal = normalize(projectedVertex - cameraPosLocal);

vec2 grid = encodeDirection(cameraDir) * spritesMinusOne;
vec2 gridFloor = min(floor(grid), spritesMinusOne);

vSprite = gridFloor;

vec3 spriteNormal = decodeDirection(vSprite, spritesMinusOne);

vec3 planeX1, planeY1;
computePlaneBasis(spriteNormal, planeX1, planeY1);

vec3 projectedVertex2 = projectVertex(spriteNormal);
mvPosition = modelViewMatrix * vec4(projectedVertex2, 1.0);
vUv = uv;
vNormalMatrix = normalMatrix;

gl_Position = projectionMatrix * mvPosition;
