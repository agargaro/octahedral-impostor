#define NORMAL
uniform vec3 diffuse;
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
// #include <packing>
#include <normal_pars_fragment>
// #include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <common>
// #include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
// #include <aomap_pars_fragment>
// #include <lightmap_pars_fragment>
// // #include <envmap_common_pars_fragment>
// // #include <envmap_pars_fragment>
// // #include <fog_pars_fragment>
// // #include <specularmap_pars_fragment>
// // #include <logdepthbuf_pars_fragment>
// #include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;

layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormalDepth;

void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	// #include <clipping_planes_fragment>
	// #include <logdepthbuf_fragment>
    #include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	// // #include <specularmap_fragment>
	// ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	// #ifdef USE_LIGHTMAP
	// 	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	// 	reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	// #else
	// 	reflectedLight.indirectDiffuse += vec3( 1.0 );
	// #endif
	// #include <aomap_fragment>
	// reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	// vec3 outgoingLight = reflectedLight.indirectDiffuse;
	// // #include <envmap_fragment>

	// // #include <opaque_fragment>
    #ifdef OPAQUE
	diffuseColor.a = 1.0;
	#endif
	#ifdef USE_TRANSMISSION
	diffuseColor.a *= material.transmissionAlpha;
	#endif
	gAlbedo = diffuseColor;
	// gAlbedo = vec4( outgoingLight, diffuseColor.a );

	// // #include <tonemapping_fragment>
    #if defined( TONE_MAPPING )
		gAlbedo.rgb = toneMapping( gl_FragColor.rgb );
	#endif

	// // #include <colorspace_fragment>
	gAlbedo = linearToOutputTexel( gAlbedo );

	// // #include <fog_fragment>
	// // #include <premultiplied_alpha_fragment>
    #ifdef PREMULTIPLIED_ALPHA
		gAlbedo.rgb *= gAlbedo.a;
	#endif

	// // #include <dithering_fragment>
    #ifdef DITHERING
		gAlbedo.rgb = dithering( gAlbedo.rgb );
	#endif

    // // #ifdef USE_REVERSED_DEPTH_BUFFER
	// // 	float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	// // #else
	float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	// // #endif

    gNormalDepth = vec4( normal, 1.0 - fragCoordZ );
    // // gNormalDepth = vec4( packNormalToRGB( normal ), 1.0 - fragCoordZ );
}