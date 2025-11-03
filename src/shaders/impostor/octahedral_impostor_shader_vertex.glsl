// #include <project_vertex>

vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);

#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT
mat4 transformedInstanceMatrix = instanceMatrix * impostorTransform;
vec3 cameraPosLocal = (inverse(transformedInstanceMatrix * modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
#else
vec3 cameraPosLocal = (inverse(impostorTransform * modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
#endif

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

// #ifdef EZ_USE_NORMAL
// vSpriteNormal1 = spriteNormal1;
// vSpriteNormal2 = spriteNormal2;
// vSpriteNormal3 = spriteNormal3;
// #endif

vec3 planeX1, planeY1, planeX2, planeY2, planeX3, planeY3;
computePlaneBasis(spriteNormal1, planeX1, planeY1);
computePlaneBasis(spriteNormal2, planeX2, planeY2);
computePlaneBasis(spriteNormal3, planeX3, planeY3);

vSpriteUV1 = projectToPlaneUV(spriteNormal1, planeX1, planeY1, cameraPosLocal, viewDirLocal);
vSpriteUV2 = projectToPlaneUV(spriteNormal2, planeX2, planeY2, cameraPosLocal, viewDirLocal);
vSpriteUV3 = projectToPlaneUV(spriteNormal3, planeX3, planeY3, cameraPosLocal, viewDirLocal);

// vSpriteViewDir1 = projectDirectionToBasis(-viewDirLocal, spriteNormal1, planeX1, planeY1).xy;
// vSpriteViewDir2 = projectDirectionToBasis(-viewDirLocal, spriteNormal2, planeX2, planeY2).xy;
// vSpriteViewDir3 = projectDirectionToBasis(-viewDirLocal, spriteNormal3, planeX3, planeY3).xy;

vec4 mvPosition = vec4(projectedVertex, 1.0);

#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT
    mvPosition = transformedInstanceMatrix * mvPosition;
# else
    mvPosition = impostorTransform * mvPosition;
#endif

mvPosition = modelViewMatrix * mvPosition;

gl_Position = projectionMatrix * mvPosition;
