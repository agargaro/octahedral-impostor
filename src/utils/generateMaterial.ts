import { OctahedralImpostorMaterial } from '../core/octahedralImpostorMaterial.js';
import { createAlbedo, createDepthMap, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';

export interface OctahedralImpostorParams extends CreateTextureAtlasParams {
  transparent?: boolean;
  parallaxScale?: number;
  alphaClamp?: number;
  // opaqueBlending?: boolean; TODO
  // borderClamp?: boolean; TODO
}

export function generateOctahedralImpostorMaterial(options: OctahedralImpostorParams): OctahedralImpostorMaterial {
  const albedoRT = createAlbedo(options);
  const depthMapRT = createDepthMap(options);
  const albedo = albedoRT.texture;
  const normalDepthMap = depthMapRT.texture;
  const ormMap = null; // TODO

  const material = new OctahedralImpostorMaterial({
    albedo,
    normalDepthMap,
    ormMap,
    parallaxScale: options.parallaxScale ?? 0.1,
    alphaClamp: options.alphaClamp ?? 0.5,
    transparent: options.transparent ?? false,
    spritesPerSide: options.spritesPerSide,
    useHemiOctahedron: options.useHemiOctahedron
  });

  return material;
}

//   public exportAlbedo(renderer: WebGLRenderer, fileName: string): void {
//     if (!this._albedoRT) throw new Error('Cannot export a texture passed as parameter.');
//     exportTextureFromRenderTarget(renderer, this._albedoRT, fileName);
//   }
