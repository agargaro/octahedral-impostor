import { Material, Mesh, PlaneGeometry, Sphere } from 'three';
import { computeObjectBoundingSphere } from '../utils/computeObjectBoundingSphere.js';
import { CreateOctahedralImpostor, createOctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';

const planeGeometry = new PlaneGeometry();

export class OctahedralImpostor<M extends Material = Material> extends Mesh<PlaneGeometry, M> {
  constructor(materialOrParams: M | CreateOctahedralImpostor<M>) {
    super(planeGeometry, null);

    if (!(materialOrParams as M).isOctahedralImpostorMaterial) {
      const mesh = (materialOrParams as CreateOctahedralImpostor<M>).target;
      const sphere = computeObjectBoundingSphere(mesh, new Sphere(), true); // TODO compute it once

      this.scale.multiplyScalar(sphere.radius * 2);
      this.position.copy(sphere.center);

      materialOrParams = createOctahedralImpostorMaterial(materialOrParams as CreateOctahedralImpostor<M>);
    }

    this.material = materialOrParams as M;
  }

  public override clone(): this {
    const impostor = new OctahedralImpostor(this.material);
    impostor.scale.copy(this.scale);
    impostor.position.copy(this.position);
    return impostor as this;
  }
}
