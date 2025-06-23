// #include <normal_fragment_begin>
vec4 normalDepth = texture2D(normalMap, spriteUv);
vec3 normal = normalize(vNormalMatrix * normalDepth.xyz);
vec3 nonPerturbedNormal = normal; // TODO this is not always necessary
