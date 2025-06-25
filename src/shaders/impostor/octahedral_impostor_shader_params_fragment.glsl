#include <clipping_planes_pars_fragment>

uniform float spritesPerSide;
uniform float parallaxScale;
uniform float alphaClamp;

#ifdef EZ_USE_ORM
uniform sampler2D ormMap;
#endif

flat varying vec2 vSprite1;
varying vec2 vSpriteUV1;
varying vec2 vSpriteViewDir1;

#ifdef EZ_BLEND_SPRITES
flat varying vec4 vSpritesWeight;
flat varying vec2 vSprite2;
flat varying vec2 vSprite3;
varying vec2 vSpriteUV2;
varying vec2 vSpriteUV3;
varying vec2 vSpriteViewDir2;
varying vec2 vSpriteViewDir3;
#endif

#ifdef EZ_USE_NORMAL
varying mat3 vNormalMatrix;
#ifdef EZ_BLEND_SPRITES
flat varying vec3 vSpriteNormal1;
flat varying vec3 vSpriteNormal2;
flat varying vec3 vSpriteNormal3;
#endif
#endif

#ifdef EZ_BLEND_SPRITES

vec4 blendImpostorSamples(vec2 uv1, vec2 uv2, vec2 uv3) {
  vec4 sprite1 = texture(map, uv1);
  vec4 sprite2 = texture(map, uv2);
  vec4 sprite3 = texture(map, uv3);

  return sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;
}

vec2 parallaxUV(vec2 uv, vec2 gridIndex, vec2 viewDir, float spriteSize, float weight) {
  vec2 spriteUv = spriteSize * (gridIndex + uv);

  float depth = 1.0 - texture(normalMap, spriteUv).a; // TODO

  vec2 parallaxOffset = viewDir * depth * parallaxScale * weight;
  uv = clamp(uv + parallaxOffset, vec2(0.0), vec2(1.0));

  return spriteSize * (gridIndex + uv);
}

#else

vec2 parallaxUV(vec2 uv, vec2 gridIndex, vec2 viewDir, float spriteSize) {
  vec2 spriteUv = spriteSize * (gridIndex + uv);

  float depth = 1.0 - texture(normalMap, spriteUv).a; // TODO

  vec2 parallaxOffset = viewDir * depth * parallaxScale;
  uv = clamp(uv + parallaxOffset, vec2(0.0), vec2(1.0));

  return spriteSize * (gridIndex + uv);
}

#endif
