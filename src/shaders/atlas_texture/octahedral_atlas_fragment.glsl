precision highp float;
precision highp int;

in vec2 vUv;
in vec3 vNormal;

layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormalDepth;

// uniform mat4 modelMatrix;

uniform sampler2D u_albedo_tex;
varying float vViewZ;

void main() {

    vec4 albedo = texture(u_albedo_tex, vUv);

    // Switch normal direction based on front-facing
    float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
    vec3 normal = vNormal * faceDirection;

    // float depth = gl_FragCoord.z;

    // TODO: Handle alphaTest with a define
    if (albedo.a < 0.5) {
        discard;
    }

    gAlbedo = linearToOutputTexel( albedo );
    gNormalDepth = vec4(normal, vViewZ);
}