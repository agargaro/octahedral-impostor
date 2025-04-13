export default /* glsl */`

void computePlaneBasis(vec3 normal, out vec3 tangent, out vec3 bitangent)
{
  vec3 up = vec3(0.0, 1.0, 0.0);

  if (normal.y > 0.999) up = vec3(-1.0, 0.0, 0.0);
  // // only if no hemiOcta
  // if (normal.y < -0.999) up = vec3(1.0, 0.0, 0.0);

  tangent = normalize(cross(up, normal));
  bitangent = normalize(cross(normal, tangent));
}

vec3 projectVertex(vec3 normal) {
  vec3 x, y;
  computePlaneBasis(normal, x, y);
  return x * position.x + y * position.y;
}

void computeSpritesWeight(vec2 gridFract) {
  vSpritesWeight = vec4(
    min(1.0 - gridFract.x, 1.0 - gridFract.y),
    abs(gridFract.x - gridFract.y),
    min(gridFract.x, gridFract.y),
    ceil(gridFract.x - gridFract.y)
  );
}

vec2 projectToPlaneUV(vec3 normal, vec3 tangent, vec3 bitangent, vec3 pivotToCamera, vec3 vertexToCamera) {
    float pivotDot = dot(normal, pivotToCamera);
    float vertexDot = dot(normal, vertexToCamera);

    vec3 offset = vertexToCamera * (pivotDot / vertexDot) - pivotToCamera;
    vec2 uv = vec2(dot(tangent, offset), dot(bitangent, offset));

    return uv + 0.5;
}

vec3 projectDirectionToBasis(vec3 dir, vec3 normal, vec3 tangent, vec3 bitangent)
{
  return normalize(vec3(dot(tangent, dir), dot(bitangent, dir), dot(normal, dir)));
}
`;
