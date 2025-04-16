import { Mesh, Object3D, Sphere } from 'three';

const sphere = new Sphere();

// Remember to call updateMatrixWorld before if necessary.
export function computeObjectBoundingSphere(obj: Object3D, target = new Sphere(), forceComputeBoundingSphere = false): Sphere {
  target.makeEmpty();
  traverse(obj);

  return target;

  function traverse(obj: Object3D): void {
    if ((obj as Mesh).isMesh) {
      const geometry = (obj as Mesh).geometry;
      if (forceComputeBoundingSphere || !geometry.boundingSphere) geometry.computeBoundingSphere();

      sphere.copy(geometry.boundingSphere).applyMatrix4(obj.matrixWorld);
      target.union(sphere);
    }

    for (const child of obj.children) {
      traverse(child);
    }
  }
}
