precision highp float;
precision highp int;

uniform mat3 normalMatrix;
uniform sampler2D u_albedo_tex;

varying vec2 vUv;
varying vec3 vNormal;
varying vec2 vHighPrecisionZW;

layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormalDepth;

void main() {
    vec4 albedo = texture(u_albedo_tex, vUv);

    vec3 normal = normalize( vNormal );
    #ifdef DOUBLE_SIDED
        float faceDirection = gl_FrontFacing ? 1.0 : -1.0;
        normal *= faceDirection;
    #endif

    normal = normalize(normalMatrix * normal);

    float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

    // TODO: Handle alphaTest with a define
    if(albedo.a < 0.5)
        discard;

    gAlbedo = linearToOutputTexel(albedo);
    gNormalDepth = vec4(normal, 1.0 - fragCoordZ);
}