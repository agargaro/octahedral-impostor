export default /* glsl */`

vUv = uv;
vec2 framesMinusOne = spritesPerSide - vec2(1);
vec3 cameraPos_OS = transpose(mat3(modelMatrix)) * cameraPosition;

vec3 pivotToCameraRay = (cameraPos_OS) * 10.0;
vec3 pivotToCameraDir = normalize(cameraPos_OS);

vec2 grid = dirToGrid(pivotToCameraDir); // bias and scale to 0 to 1
grid = clamp((grid + 1.0) * 0.5, vec2(0, 0), vec2(1, 1));
grid *= framesMinusOne;
grid = clamp(grid, vec2(0), vec2(framesMinusOne));
vec2 gridFloor = min(floor(grid), framesMinusOne);
vec2 gridFract = fract(grid);

vec3 projected = projectVertex(pivotToCameraDir); // TODO cambia qui
vec3 vertexToCameraRay = (pivotToCameraRay - (projected));
vec3 vertexToCameraDir = normalize(vertexToCameraRay);

vFrame1 = gridFloor;
computeSpritesWeight(gridFract);
vec3 projectedQuadADir = gridToDir(vFrame1, framesMinusOne); //convert frame coordinate to octahedron direction

vec3 projected2 = projectVertex(projectedQuadADir); // TODO cambia qui


vFrame2 = clamp(vFrame1 + mix(vec2(0, 1), vec2(1, 0), vSpritesWeight.w), vec2(0,0), framesMinusOne);
vec3 projectedQuadBDir = gridToDir(vFrame2, framesMinusOne);

vFrame3 = clamp(vFrame1 + vec2(1), vec2(0,0), framesMinusOne);
vec3 projectedQuadCDir = gridToDir(vFrame3, framesMinusOne);

// vFrameNormal1 = (normalMatrix * vec4(projectedQuadADir, 0)).xyz;
// vFrameNormal2 = (normalMatrix * vec4(projectedQuadBDir, 0)).xyz; // or modelViewMatrix?
// vFrameNormal3 = (normalMatrix * vec4(projectedQuadCDir, 0)).xyz;

vec3 plane_x1, plane_y1, plane_x2, plane_y2, plane_x3, plane_y3;

calcuateXYbasis(projectedQuadADir, plane_x1, plane_y1);
vFrameUv1 = virtualPlaneUV(projectedQuadADir, plane_x1, plane_y1, pivotToCameraRay, vertexToCameraRay, 1.0); // TODO remove last param
vFrameXY1 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadADir, plane_x1, plane_y1).xy;

calcuateXYbasis(projectedQuadBDir, plane_x2, plane_y2);
vFrameUv2 = virtualPlaneUV(projectedQuadBDir, plane_x2, plane_y2, pivotToCameraRay, vertexToCameraRay, 1.0); // TODO remove last param
vFrameXY2 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadBDir, plane_x2, plane_y2).xy;

calcuateXYbasis(projectedQuadCDir, plane_x3, plane_y3);
vFrameUv3 = virtualPlaneUV(projectedQuadCDir, plane_x3, plane_y3, pivotToCameraRay, vertexToCameraRay, 1.0); // TODO remove last param
vFrameXY3 = projectOnPlaneBasis(-vertexToCameraDir, projectedQuadCDir, plane_x3, plane_y3).xy;
`;
