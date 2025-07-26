// #include <normal_fragment_begin>
vec4 normalDepth = texture2D(normalMap, uv1);
vec3 normal = normalize(normalMatrix * normalDepth.xyz);
vec3 nonPerturbedNormal = normal;
