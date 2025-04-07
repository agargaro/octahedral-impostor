export default /* glsl */`

vec2 hemiOctaDirToGrid(vec3 dir) {
  vec3 octant = sign(dir);
  float sum = dot(dir, octant);
  vec3 octahedron = dir / sum;    
  return vec2(octahedron.x + octahedron.z, octahedron.z - octahedron.x);
  // return vec2(1.0 + octahedron.x + octahedron.z, 1.0 + octahedron.z - octahedron.x) * vec2(0.5);
}

vec2 dirToGrid(vec3 dir) {
  return hemiOctaDirToGrid(dir);
}

vec3 hemiOctaGridToDir(vec2 grid) {
  vec3 position = vec3(grid.x - grid.y, 0.0, -1.0 + grid.x + grid.y);
  position.y = 1.0 - abs(position.x) - abs(position.z);
  return position;
}

vec3 gridToDir(vec2 grid, vec2 frameCountMinusOne) {
  grid = grid / frameCountMinusOne;
  return normalize(hemiOctaGridToDir(grid)); // TODO check if already normalized
}
`;
