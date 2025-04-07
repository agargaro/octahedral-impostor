export default /* glsl */`

transformed = projected + pivotToCameraDir; // + positionOffset;

// NORMAL = normalize(pivotToCameraDir);
// TANGENT= normalize(cross(NORMAL,vec3(0.0, 1.0, 0.0)));
// BINORMAL = normalize(cross(TANGENT,NORMAL));
`;
