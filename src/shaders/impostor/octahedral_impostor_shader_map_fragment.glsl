//#include <map_fragment>
float spriteSize = 1.0 / spritesPerSide;
vec2 spriteUv = spriteSize * (vSprite1 + vUv);
diffuseColor *= texture2D(map, spriteUv);
