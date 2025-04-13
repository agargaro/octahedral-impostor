export default /* glsl */`

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

vec3 decodeDirection(vec2 gridIndex, float spriteCountMinusOne) {
  vec2 gridUV = gridIndex / spriteCountMinusOne;
  return normalize(decodeHemiOctaGrid(gridUV));
}
`;
