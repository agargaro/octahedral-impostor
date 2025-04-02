// const direction = new Vector3(0, 0, 1).normalize();
// const octant = new Vector3(Math.sign(direction.x), Math.sign(direction.y), Math.sign(direction.z));
// const sum = direction.dot(octant);
// const octahedron = new Vector3().copy(direction).divideScalar(sum);
// console.log({ x: (1 + octahedron.x + octahedron.z) * 0.5, y: (1 + octahedron.z - octahedron.x) * 0.5 });

import { Vector2, Vector3 } from 'three';
import { hemiOctaDirToGrid, hemiOctaGridToDir } from '../src/utils/octahedron.js';

// const dirHalf = hemiOctaGridToDir(new Vector2(0 + 1 / 12, 0 + 1 / 12));
// const dir = hemiOctaGridToDir(new Vector2(0, 0));

// console.log(dir);
// console.log(dirHalf);

// const grid = hemiOctaDirToGrid(dir);
// const mapped = new Vector2(Math.max(0, Math.min(5, (grid.x - (1 / 12)) * 6)), Math.max(0, Math.min(5, (grid.y - (1 / 12)) * 6)));
// console.log(mapped);

// const grid2 = hemiOctaDirToGrid(dirHalf);
// const mapped2 = new Vector2(Math.max(0, Math.min(5, (grid2.x - (1 / 12)) * 6)), Math.max(0, Math.min(5, (grid2.y - (1 / 12)) * 6)));
// console.log(mapped2);

const grid = hemiOctaDirToGrid(new Vector3(0, 0, 1));
console.log(grid);
