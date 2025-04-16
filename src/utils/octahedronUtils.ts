import { Vector2, Vector3 } from 'three';

const absolute = new Vector3();
const octant = new Vector3();
const octahedron = new Vector3();

export function hemiOctaGridToDir(grid: Vector2, target = new Vector3()): Vector3 {
  target.set(grid.x - grid.y, 0, -1 + grid.x + grid.y);
  target.y = 1 - Math.abs(target.x) - Math.abs(target.z);
  return target;
}

export function octaGridToDir(grid: Vector2, target = new Vector3()): Vector3 {
  target.set(2 * (grid.x - 0.5), 0, 2 * (grid.y - 0.5));
  absolute.set(Math.abs(target.x), 0, Math.abs(target.z));
  target.y = 1 - absolute.x - absolute.z;

  if (target.y < 0) {
    target.x = Math.sign(target.x) * (1 - absolute.z);
    target.z = Math.sign(target.z) * (1 - absolute.x);
  }

  return target;
}

// TODO remove it
export function hemiOctaDirToGrid(dir: Vector3, target = new Vector2()): Vector2 {
  octant.set(Math.sign(dir.x), Math.sign(dir.y), Math.sign(dir.z));
  const sum = dir.dot(octant); // TODO dir should be normalized?
  octahedron.copy(dir).divideScalar(sum);

  return target.set(
    (1 + octahedron.x + octahedron.z) * 0.5,
    (1 + octahedron.z - octahedron.x) * 0.5
  );
}
