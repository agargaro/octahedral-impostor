import { Texture, WebGLRenderer, WebGLRenderTarget } from 'three';
import { createAlbedo, createDepthMap, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../utils/exportTexture.js';
import { OctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';

// TODO remove this class and make a utils method instead
export class OctahedronImpostorMaterialGenerator {
  public material: OctahedralImpostorMaterial = null;
  public albedo: Texture = null;
  public depthMap: Texture = null;
  public _albedoRT: WebGLRenderTarget = null; // TODO
  public _depthMapRT: WebGLRenderTarget = null;
  protected _spritesPerSide: number = null;

  public load(albedo: Texture, depthMap: Texture, spritesPerSide: number): OctahedralImpostorMaterial {
    this.albedo = albedo;
    this.depthMap = depthMap;
    this._spritesPerSide = spritesPerSide;
    return this.material;
  }

  public create(renderer: WebGLRenderer, options: CreateTextureAtlasParams): OctahedralImpostorMaterial {
    this._albedoRT = createAlbedo(renderer, options);
    this._depthMapRT = createDepthMap(renderer, options);
    this._spritesPerSide = options.spritesPerSide;
    this.albedo = this._albedoRT.texture;
    this.depthMap = this._depthMapRT.texture;

    this.material = new OctahedralImpostorMaterial({
      albedo: this.albedo,
      normalDepthMap: this.depthMap,
      parallaxScale: 0.1,
      alphaClamp: 0.5,
      spritesPerSide: this._spritesPerSide
    });

    // TODO add it to create too

    return this.material;
  }

  public exportAlbedo(renderer: WebGLRenderer, fileName: string): void {
    if (!this._albedoRT) throw new Error('Cannot export a texture passed as parameter.');
    exportTextureFromRenderTarget(renderer, this._albedoRT, fileName);
  }

  // public exportDepthMap(fileName: string): void {
  //   if (!this._depthMapRT) throw new Error('Cannot export a texture passed as parameter.');
  //   exportTextureFromRenderTarget(this._depthMapRT, fileName);
  // }
}
