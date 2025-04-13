export default /* glsl */`

void calcuateXYbasis(vec3 planeNormal, out vec3 planeX, out vec3 planeY)
{
  vec3 up = vec3(0, 1, 0);

  if (planeNormal.y > 0.999) up = vec3(-1, 0, 0);
  // // only if no hemiOcta
  // if (planeNormal.y < -0.999) up = vec3(1, 0, 0);

  planeX = normalize(cross(up, planeNormal));
  planeY = normalize(cross(planeNormal, planeX));
}

vec3 projectVertex(vec3 spriteNormal) {
  vec3 x, y;
  calcuateXYbasis(spriteNormal, x, y);
  return x * position.x + y * position.y;
}

void computeSpritesWeight(vec2 grid) {
  vSpritesWeight = vec4(
    min(1.0 - grid.x, 1.0 - grid.y),
    abs(grid.x - grid.y),
    min(grid.x, grid.y),
    ceil(grid.x - grid.y)
  );
}

vec2 projectToPlaneUV(vec3 planeNormal, vec3 planeTangent, vec3 planeBitangent, vec3 pivotToCamera, vec3 vertexToCamera) {
    // Project both rays onto the plane's normal
    float pivotDot = dot(planeNormal, pivotToCamera);
    float vertexDot = dot(planeNormal, vertexToCamera);

    // Scale the vertex ray to match the depth of the pivot
    vec3 offset = (vertexToCamera * (pivotDot / vertexDot)) - pivotToCamera;

    // Project the offset onto the tangent plane axes to get UV coordinates
    vec2 uv = vec2(dot(planeTangent, offset), dot(planeBitangent, offset));

    // Convert from [-1, 1] range to [0, 1] UV space
    return uv + 0.5;
}

vec3 projectOnPlaneBasis(vec3 ray, vec3 plane_normal, vec3 plane_x, vec3 plane_y)
{
  return normalize(vec3(dot(plane_x, ray), dot(plane_y, ray), dot(plane_normal, ray)));
}
`;
