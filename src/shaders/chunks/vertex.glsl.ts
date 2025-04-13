export default /* glsl */`

vUv = uv;
vec2 framesMinusOne = spritesPerSide - vec2(1);
vec3 cameraPos_OS = inverse(mat3(modelMatrix)) * cameraPosition; // TODO check transpose

vec3 pivotToCameraRay = (cameraPos_OS) * 10.0;
vec3 pivotToCameraDir = normalize(cameraPos_OS);

vec2 grid = encodeDirection(pivotToCameraDir) * framesMinusOne; 
grid = clamp(grid, vec2(0), vec2(framesMinusOne));
vec2 gridFloor = min(floor(grid), framesMinusOne);
vec2 gridFract = fract(grid);

vec3 projected = projectVertex(pivotToCameraDir);
vec3 vertexToCameraRay = pivotToCameraRay + projected;
vec3 vertexToCameraDir = normalize(vertexToCameraRay);

computeSpritesWeight(gridFract);

vFrame1 = gridFloor;
vFrame2 = clamp(vFrame1 + mix(vec2(0, 1), vec2(1, 0), vSpritesWeight.w), vec2(0, 0), framesMinusOne);
vFrame3 = clamp(vFrame1 + vec2(1), vec2(0, 0), framesMinusOne);

vec3 projectedQuadADir = decodeDirection(vFrame1, framesMinusOne);
vec3 projectedQuadBDir = decodeDirection(vFrame2, framesMinusOne);
vec3 projectedQuadCDir = decodeDirection(vFrame3, framesMinusOne);

// vFrameNormal1 = (normalMatrix * vec4(projectedQuadADir, 0)).xyz;
// vFrameNormal2 = (normalMatrix * vec4(projectedQuadBDir, 0)).xyz; 
// vFrameNormal3 = (normalMatrix * vec4(projectedQuadCDir, 0)).xyz;

vec3 plane_x1, plane_y1, plane_x2, plane_y2, plane_x3, plane_y3;

calcuateXYbasis(projectedQuadADir, plane_x1, plane_y1);
calcuateXYbasis(projectedQuadBDir, plane_x2, plane_y2);
calcuateXYbasis(projectedQuadCDir, plane_x3, plane_y3);

vFrameUv1 = projectToPlaneUV(projectedQuadADir, plane_x1, plane_y1, pivotToCameraRay, vertexToCameraRay); 
vFrameUv2 = projectToPlaneUV(projectedQuadBDir, plane_x2, plane_y2, pivotToCameraRay, vertexToCameraRay); 
vFrameUv3 = projectToPlaneUV(projectedQuadCDir, plane_x3, plane_y3, pivotToCameraRay, vertexToCameraRay); 

vFrameXY1 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadADir, plane_x1, plane_y1).xy;
vFrameXY2 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadBDir, plane_x2, plane_y2).xy;
vFrameXY3 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadCDir, plane_x3, plane_y3).xy;
`;
