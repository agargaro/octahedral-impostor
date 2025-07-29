//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;

// disable it for now
// vec2 uv1 = parallaxUV(vSpriteUV1, vSprite1, vSpriteViewDir1, spriteSize, vSpritesWeight.x);
// vec2 uv2 = parallaxUV(vSpriteUV2, vSprite2, vSpriteViewDir2, spriteSize, vSpritesWeight.y);
// vec2 uv3 = parallaxUV(vSpriteUV3, vSprite3, vSpriteViewDir3, spriteSize, vSpritesWeight.z);

// todo remove
vec2 uv1 = spriteSize * (vSprite1 + vSpriteUV1);
vec2 uv2 = spriteSize * (vSprite2 + vSpriteUV2);
vec2 uv3 = spriteSize * (vSprite3 + vSpriteUV3);


vec4 blendedColor = blendImpostorSamples(uv1, uv2, uv3);

if(blendedColor.a <= alphaClamp) discard;

#ifndef EZ_TRANSPARENT
blendedColor = vec4(vec3(blendedColor.rgb) / blendedColor.a, 1.0);
#endif

diffuseColor *= blendedColor;
