uniform sampler2D albedo;
uniform sampler2D normalDepthMap;
uniform float spritesPerSide;
uniform float parallaxScale;
uniform float alphaClamp;

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
  vec4 sprite1 = texture(albedo, uv1);
  vec4 sprite2 = texture(albedo, uv2);
  vec4 sprite3 = texture(albedo, uv3);

  return sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;
}

vec2 parallaxUV(vec2 uv, vec2 gridIndex, vec2 viewDir, float spriteSize, float weight) {
  vec2 spriteUv = spriteSize * (gridIndex + uv);
  float depth = 1.0 - texture(normalDepthMap, spriteUv).y;

  vec2 parallaxOffset = viewDir * depth * parallaxScale * weight;
  uv = clamp(uv + parallaxOffset, vec2(0.0), vec2(1.0));

  return spriteSize * (gridIndex + uv);
}

void main() {
  float spriteSize = 1.0 / spritesPerSide;

  vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize, vSpritesWeight.x);
  vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize, vSpritesWeight.y);
  vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize, vSpritesWeight.z);

  vec4 blendedColor = blendImpostorSamples(uv1, uv2, uv3);

  if(blendedColor.a <= alphaClamp)
    discard;

      // remove transparency
  blendedColor = vec4(vec3(blendedColor.rgb) / (blendedColor.a), 1.0);

  gl_FragColor = blendedColor;

  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
