import { Mesh, PlaneGeometry, RenderTarget, Sphere } from 'three';
import { computeObjectBoundingSphere } from '../utils/computeObjectBoundingSphere.js';
import { generateOctahedralImpostorMaterial, OctahedralImpostorParams } from '../utils/generateMaterial.js';
import { OctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';

const planeGeometry = new PlaneGeometry();

export class OctahedralImpostor extends Mesh<PlaneGeometry, OctahedralImpostorMaterial> {
  public albedoRenderTarget: RenderTarget = null; // TODO set
  public depthNormalMapRenderTarget: RenderTarget = null;
  public ormMapRenderTarget: RenderTarget = null;

  constructor(materialOrParams: OctahedralImpostorMaterial | OctahedralImpostorParams) {
    super(planeGeometry, null);

    if (!(materialOrParams as OctahedralImpostorMaterial).isOctahedralImpostorMaterial) {
      const mesh = (materialOrParams as OctahedralImpostorParams).target.children[0]; // TODO make it more general
      const sphere = computeObjectBoundingSphere(mesh, new Sphere(), true); // TODO compute it once
      this.scale.multiplyScalar(sphere.radius * 2);
      this.position.copy(sphere.center);

      materialOrParams = generateOctahedralImpostorMaterial(materialOrParams as OctahedralImpostorParams);
    }

    this.material = materialOrParams as OctahedralImpostorMaterial;
  }

  // @ts-expect-error Property 'clone' is not assignable to the same property in base type 'Mesh'.
  public override clone(): OctahedralImpostor {
    const impostor = new OctahedralImpostor(this.material.clone()); // TODO clone?
    impostor.scale.copy(this.scale);
    impostor.position.copy(this.position);
    return impostor;
  }
}
