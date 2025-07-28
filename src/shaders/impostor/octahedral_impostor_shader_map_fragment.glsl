//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;

vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize, vSpritesWeight.x);
vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize, vSpritesWeight.y);
vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize, vSpritesWeight.z);

vec4 blendedColor = blendImpostorSamples(uv1, uv2, uv3);

if(blendedColor.a <= alphaClamp) discard;

#ifndef EZ_TRANSPARENT
blendedColor = vec4(vec3(blendedColor.rgb) / blendedColor.a, 1.0);
#endif

diffuseColor *= blendedColor;
