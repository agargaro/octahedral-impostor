export default /* glsl */`

vec3 spriteProjection(vec3 spriteNormal, vec2 loc_uv) {
  vec3 z = normalize(spriteNormal); // TODO check if already normalized

  vec3 up = vec3(0, 1, 0);
  if (abs(z.y) > 0.999) {
      up = vec3(0, 0, -1);
  }

  vec3 x = normalize(cross(up, z));
  vec3 y = normalize(cross(z, x));

  loc_uv -= vec2(0.5, 0.5); // TODO we can use position instead
  vec2 uv = (loc_uv) * 2.0; // -1 to 1 
  vec3 newX = x * uv.x * 0.5;
  vec3 newY = y * uv.y * 0.5;  
  return newX + newY;

  //return x * position.x + y * position.y;
}

void computeSpritesWeight(vec2 grid) {
  vSpritesWeight = vec4(
    min(1.0 - grid.x, 1.0 - grid.y),
    abs(grid.x - grid.y),
    min(grid.x, grid.y),
    ceil(grid.x - grid.y)
  );
}

vec2 virtualPlaneUV(vec3 plane_normal, vec3 plane_x, vec3 plane_y, vec3 pivotToCameraRay, vec3 vertexToCameraRay, float size)
{
  plane_normal = normalize(plane_normal);
  plane_x = normalize(plane_x);
  plane_y = normalize(plane_y); 

  float projectedNormalRayLength = dot(plane_normal, pivotToCameraRay);
  float projectedVertexRayLength = dot(plane_normal, vertexToCameraRay);
  float offsetLength = projectedNormalRayLength/projectedVertexRayLength;
  vec3 offsetVector = vertexToCameraRay * offsetLength - pivotToCameraRay;  

  vec2 duv = vec2(
    dot(plane_x , offsetVector),
    dot(plane_y, offsetVector)
  );  

  duv /= 2.0 * size; //we are in space -1 to 1
  duv += 0.5;
  return duv;
}

void calcuateXYbasis(vec3 plane_normal, out vec3 plane_x, out vec3 plane_y)
{
  vec3 up = vec3(0,1,0);
  if (abs(plane_normal.y) > 0.999f)
  {
    up = vec3(0,0,1); //TODO segno diverso
  }
  plane_x = normalize(cross(plane_normal, up));
  plane_y = normalize(cross(plane_x, plane_normal));
}

vec3 projectOnPlaneBasis(vec3 ray, vec3 plane_normal, vec3 plane_x, vec3 plane_y)
{
  return normalize(vec3( 
    dot(plane_x,ray), 
    dot(plane_y,ray), 
    dot(plane_normal,ray) 
  ));
}
`;
