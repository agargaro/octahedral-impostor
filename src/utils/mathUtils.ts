import { Vector2, Vector3 } from 'three';

const absolute = new Vector3();

export function hemiOctahedronGridToDir(coords: Vector2, target = new Vector3()): Vector3 {
  target.set(coords.x - coords.y, 0, -1 + coords.x + coords.y);
  target.y = 1 - Math.abs(target.x) - Math.abs(target.z);
  return target;
}

export function octahedronGridToDir(coords: Vector2, target = new Vector3()): Vector3 {
  target.set(2 * (coords.x - 0.5), 0, 2 * (coords.y - 0.5));
  absolute.set(Math.abs(target.x), 0, Math.abs(target.z));
  target.y = 1 - absolute.x - absolute.z;

  if (target.y < 0) {
    target.x = Math.sign(target.x) * (1 - absolute.z);
    target.z = Math.sign(target.z) * (1 - absolute.x);
  }

  return target;
}
