// #include <normal_fragment_begin>
vec3 normal = normalize( vNormal );
#ifdef USE_NORMALMAP
	vec4 normalDepth = texture2D(normalMap, spriteUv);
	normal = normalize(vNormalMatrix * normalDepth.xyz);
#endif
vec3 nonPerturbedNormal = normal;