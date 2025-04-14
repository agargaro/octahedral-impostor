import { Texture, WebGLRenderer, WebGLRenderTarget } from 'three';
import { createAlbedo, createDepthMap, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../utils/exportTexture.js';
import { OctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';

export class OctahedronImpostorMaterialGenerator {
  public readonly material: OctahedralImpostorMaterial;
  public albedo: Texture = null;
  public depthMap: Texture = null;
  protected _albedoRT: WebGLRenderTarget = null;
  protected _depthMapRT: WebGLRenderTarget = null;
  protected _spritesPerSide: number = null;

  constructor() {
    this.material = new OctahedralImpostorMaterial();
  }

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

    // TODO add it to create too
    const material = this.material;
    material.albedo = this.albedo;
    material.depthMap = this.depthMap;
    material.parallaxScale = 0.2;
    material.alphaClamp = 0.5;
    material.spritesPerSide = this._spritesPerSide;

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
