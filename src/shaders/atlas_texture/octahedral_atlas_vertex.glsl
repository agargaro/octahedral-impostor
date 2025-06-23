precision highp float;
precision highp int;

out vec2 vUv;
out vec3 vNormal;
varying float vViewZ;

void main() {
    vec4 mvPosition = viewMatrix * modelMatrix * vec4(position,1.0);
    vUv = uv;
    vNormal = normalize( mat3(modelMatrix) * vec3(normal) );
    vViewZ = -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
}
