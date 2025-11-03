import { Material, Matrix4, Mesh, Plane, PlaneGeometry, Sphere } from 'three';
import { computeObjectBoundingSphere } from '../utils/computeObjectBoundingSphere.js';
import { CreateOctahedralImpostor, createOctahedralImpostorMaterial } from './octahedralImpostorMaterial.js';

export class OctahedralImpostor<M extends Material = Material> extends Mesh<PlaneGeometry, M> {
  constructor(materialOrParams: M | CreateOctahedralImpostor<M>) {
    super(new PlaneGeometry(), null);

    if (!(materialOrParams as M).isOctahedralImpostorMaterial) {
      const mesh = (materialOrParams as CreateOctahedralImpostor<M>).target;
      const sphere = computeObjectBoundingSphere(mesh, new Sphere(), true); // TODO compute it once

      const scale = sphere.radius * 2;
      const translation = sphere.center.clone();
      materialOrParams.transform = new Matrix4().makeScale(scale, scale, scale).setPosition(translation);

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
