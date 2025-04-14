export default /* glsl */`

vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);

vec3 cameraPosLocal = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
vec3 cameraDir = normalize(cameraPosLocal);

vec3 projectedVertex = projectVertex(cameraDir);
vec3 vertexToCamera = cameraPosLocal + projectedVertex;
vec3 viewDirLocal = normalize(vertexToCamera);
// vec3 viewDirLocal = normalize(cameraPosLocal - position); // TODO use this

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

vSpriteUV1 = projectToPlaneUV(spriteNormal1, planeX1, planeY1, cameraPosLocal, vertexToCamera); 
vSpriteUV2 = projectToPlaneUV(spriteNormal2, planeX2, planeY2, cameraPosLocal, vertexToCamera); 
vSpriteUV3 = projectToPlaneUV(spriteNormal3, planeX3, planeY3, cameraPosLocal, vertexToCamera); 

vSpriteViewDir1 = projectDirectionToBasis(-viewDirLocal, spriteNormal1, planeX1, planeY1).xy;
vSpriteViewDir2 = projectDirectionToBasis(-viewDirLocal, spriteNormal2, planeX2, planeY2).xy;
vSpriteViewDir3 = projectDirectionToBasis(-viewDirLocal, spriteNormal3, planeX3, planeY3).xy;

// vSpriteViewDir1 = projectDirectionToBasis(-viewDirLocal, planeX1, planeY1).xy;
// vSpriteViewDir2 = projectDirectionToBasis(-viewDirLocal, planeX2, planeY2).xy;
// vSpriteViewDir3 = projectDirectionToBasis(-viewDirLocal, planeX3, planeY3).xy;
`;
