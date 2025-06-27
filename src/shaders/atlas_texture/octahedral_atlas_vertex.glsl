precision highp float; // do we need this?
precision highp int;

varying vec2 vUv;
varying vec3 vNormal;
varying vec2 vHighPrecisionZW;

void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * vec3(normal));

    vec4 mvPosition = vec4(position, 1.0);
    mvPosition = modelViewMatrix * mvPosition;
    gl_Position = projectionMatrix * mvPosition;

    vHighPrecisionZW = gl_Position.zw;
}
