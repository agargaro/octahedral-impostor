export default /* glsl */`

vec2 spritesMinusOne = vec2(spritesPerSide - 1.0);
vec3 cameraPos_OS = inverse(mat3(modelMatrix)) * cameraPosition; // TODO check transpose

vec3 pivotToCamera = cameraPos_OS * 10.0;
vec3 pivotToCameraDir = normalize(cameraPos_OS);

vec2 grid = encodeDirection(pivotToCameraDir) * spritesMinusOne; 
vec2 gridFloor = min(floor(grid), spritesMinusOne);
vec2 gridFract = fract(grid);

vec3 projectedVertex = projectVertex(pivotToCameraDir);
vec3 vertexToCamera = pivotToCamera + projectedVertex;
vec3 vertexToCameraDir = normalize(vertexToCamera);

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

vSpriteUV1 = projectToPlaneUV(spriteNormal1, planeX1, planeY1, pivotToCamera, vertexToCamera); 
vSpriteUV2 = projectToPlaneUV(spriteNormal2, planeX2, planeY2, pivotToCamera, vertexToCamera); 
vSpriteUV3 = projectToPlaneUV(spriteNormal3, planeX3, planeY3, pivotToCamera, vertexToCamera); 

vSpriteViewDir1 = projectDirectionToBasis(-vertexToCameraDir, spriteNormal1, planeX1, planeY1).xy;
vSpriteViewDir2 = projectDirectionToBasis(-vertexToCameraDir, spriteNormal2, planeX2, planeY2).xy;
vSpriteViewDir3 = projectDirectionToBasis(-vertexToCameraDir, spriteNormal3, planeX3, planeY3).xy;
`;
