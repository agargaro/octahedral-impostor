//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;
vec2 spriteUv = spriteSize * (vSprite + vUV);
// #ifdef USE_MAP
vec4 sampledDiffuseColor = texture2D(map, spriteUv);
diffuseColor *= sampledDiffuseColor;
// #endif