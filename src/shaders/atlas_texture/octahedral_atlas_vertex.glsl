// got by merging basic, normal, depth material 
#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex> 
#include <normal_pars_vertex> 
#include <color_pars_vertex>
// #include <morphtarget_pars_vertex>
// #include <skinning_pars_vertex>
varying vec2 vHighPrecisionZW;

void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
// 	#include <morphinstance_vertex>
// 	#include <morphcolor_vertex>
// 	#include <morphnormal_vertex>
// 	#include <skinbase_vertex>
// 	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
    #include <normal_vertex>
	#include <begin_vertex>
// 	#include <morphtarget_vertex>
// 	#include <skinning_vertex>
    #include <displacementmap_vertex>
	#include <project_vertex>
	
    vHighPrecisionZW = gl_Position.zw;

#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}