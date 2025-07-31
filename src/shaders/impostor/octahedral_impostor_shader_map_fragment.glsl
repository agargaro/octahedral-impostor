//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;

// disable it for now
// vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize, vSpritesWeight.x);
// vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize, vSpritesWeight.y);
// vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize, vSpritesWeight.z);

// todo remove if we want parallax
vec2 uv1 = getUV(vSpriteUV1, vSprite1, spriteSize);
vec2 uv2 = getUV(vSpriteUV2, vSprite2, spriteSize);
vec2 uv3 = getUV(vSpriteUV3, vSprite3, spriteSize);

vec4 sprite1, sprite2, sprite3;
float test = 1.0 - alphaClamp;

if (vSpritesWeight.x >=  test) {

  sprite1 = texture(map, uv1);
  if (sprite1.a <= alphaClamp) discard;

  sprite2 = texture(map, uv2);
  sprite3 = texture(map, uv3);

} else if (vSpritesWeight.y >=  test) {

  sprite2 = texture(map, uv2);
  if (sprite2.a <= alphaClamp) discard;

  sprite1 = texture(map, uv1);
  sprite3 = texture(map, uv3);

} else if (vSpritesWeight.z >=  test) {

  sprite3 = texture(map, uv3);
  if (sprite3.a <= alphaClamp) discard;

  sprite1 = texture(map, uv1);
  sprite2 = texture(map, uv2);

} else {

  sprite1 = texture(map, uv1);
  sprite2 = texture(map, uv2);
  sprite3 = texture(map, uv3);

}

vec4 blendedColor = sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;

if (blendedColor.a <= alphaClamp) discard;

#ifndef EZ_TRANSPARENT
blendedColor = vec4(vec3(blendedColor.rgb) / blendedColor.a, 1.0);
#endif

// diffuseColor *= blendedColor;
