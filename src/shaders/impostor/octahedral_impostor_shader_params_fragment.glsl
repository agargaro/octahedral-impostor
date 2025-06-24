#include <clipping_planes_pars_fragment>

uniform float spritesPerSide;

flat varying vec2 vSprite1;
varying vec2 vSpriteUV1; // TODO remove

#ifdef EZ_USE_NORMAL
varying mat3 vNormalMatrix;
#endif
