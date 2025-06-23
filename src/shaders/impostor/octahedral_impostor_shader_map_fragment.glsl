//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;
vec2 spriteUv = spriteSize * (vSprite + vUv);
diffuseColor *= texture2D(map, spriteUv);