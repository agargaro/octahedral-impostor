#include <clipping_planes_pars_fragment>

uniform float spritesPerSide;
uniform float parallaxScale;
uniform float alphaClamp;

#ifdef EZ_USE_NORMAL
uniform mat3 normalMatrix; // this can be already used with same shader
#endif

#ifdef EZ_USE_ORM
uniform sampler2D ormMap;
#endif

flat varying vec4 vSpritesWeight;
flat varying vec2 vSprite1;
flat varying vec2 vSprite2;
flat varying vec2 vSprite3;
varying vec2 vSpriteUV1;
varying vec2 vSpriteUV2;
varying vec2 vSpriteUV3;
varying vec2 vSpriteViewDir1;
varying vec2 vSpriteViewDir2;
varying vec2 vSpriteViewDir3;

#ifdef EZ_USE_NORMAL
flat varying vec3 vSpriteNormal1;
flat varying vec3 vSpriteNormal2;
flat varying vec3 vSpriteNormal3;
#endif

vec4 blendImpostorSamples(vec2 uv1, vec2 uv2, vec2 uv3) {
  vec4 sprite1 = texture(map, uv1);
  vec4 sprite2 = texture(map, uv2);
  vec4 sprite3 = texture(map, uv3);

  return sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;
}

vec3 blendNormals(vec2 uv1, vec2 uv2, vec2 uv3) {
  vec4 normalDepth1 = texture2D(normalMap, uv1); // lo stiamo leggendo due volte, migliorare perchè lo leggiamo per il depth anche
  vec4 normalDepth2 = texture2D(normalMap, uv2);
  vec4 normalDepth3 = texture2D(normalMap, uv3);

  return normalize(normalDepth1.xyz * vSpritesWeight.x + normalDepth2.xyz * vSpritesWeight.y + normalDepth3.xyz * vSpritesWeight.z);
}

vec2 parallaxUV(vec2 uv_f, vec2 frame, vec2 xy_f, float frame_size, float weight) {
  // vec2 spriteUv = frame_size * (frame + uv_f);
  // float depth = texture(normalMap, spriteUv).a;
  // vec2 parallaxOffset = xy_f * depth * parallaxScale; // * weight;
  // uv_f = clamp(uv_f + parallaxOffset, vec2(0.0), vec2(1.0));
  // return frame_size * (frame + uv_f);

  uv_f = clamp(uv_f, vec2(0), vec2(1));
	vec2 uv_quad = frame_size * (frame + uv_f);
  float n_depth = max(0.0, 0.5 - texture(normalMap, uv_quad).a);

  uv_f = xy_f * n_depth * parallaxScale * (1.0 - weight) + uv_f;
	uv_f = clamp(uv_f, vec2(0), vec2(1));
	uv_f =  frame_size * (frame + uv_f);
	return clamp(uv_f, vec2(0), vec2(1));
}
