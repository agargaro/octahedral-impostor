import { Mesh, PlaneGeometry } from 'three';
import { Material } from 'three/webgpu';

const planeGeometry = new PlaneGeometry();

export class OctahedronImpostor<M extends Material> extends Mesh {
  public override material: M;

  constructor(material: M) {
    super(planeGeometry, material);
  }
}
