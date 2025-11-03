#define NORMAL
uniform vec3 diffuse;
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
varying vec2 vHighPrecisionZW;

layout(location = 0) out vec4 gAlbedo;
layout(location = 1) out vec4 gNormalDepth;

void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>

	if (diffuseColor.a <= 0.2) { // TODO custom code
		discard;
	}

	// #include <opaque_fragment>
    #ifdef OPAQUE
		diffuseColor.a = 1.0;
	#endif
	#ifdef USE_TRANSMISSION
		diffuseColor.a *= material.transmissionAlpha;
	#endif
	gAlbedo = diffuseColor;

	// // #include <colorspace_fragment>
	gAlbedo = linearToOutputTexel( gAlbedo );

	// // #include <premultiplied_alpha_fragment>
    #ifdef PREMULTIPLIED_ALPHA
		gAlbedo.rgb *= gAlbedo.a;
	#endif

	#include <normal_fragment_begin>
	#include <normal_fragment_maps>

	float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	gNormalDepth = vec4( packNormalToRGB( normal ), 1.0 - fragCoordZ );
}