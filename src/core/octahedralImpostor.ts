import { Mesh, PlaneGeometry, RenderTarget } from 'three';
import { CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';
import { OctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';
import { generateOctahedronImpostorMaterial } from '../utils/generateMaterial.js';

const planeGeometry = new PlaneGeometry();

export class OctahedronImpostor extends Mesh<PlaneGeometry, OctahedralImpostorMaterial> {
  public albedoRenderTarget: RenderTarget = null;
  public depthNormalMapRenderTarget: RenderTarget = null;
  public ormMapRenderTarget: RenderTarget = null;

  constructor(materialOrParams: OctahedralImpostorMaterial | CreateTextureAtlasParams) {
    super(planeGeometry, null);

    if (!(materialOrParams as OctahedralImpostorMaterial).isOctahedralImpostorMaterial) {
      materialOrParams = generateOctahedronImpostorMaterial(materialOrParams as CreateTextureAtlasParams);
    }

    this.material = materialOrParams as OctahedralImpostorMaterial;
  }
}
