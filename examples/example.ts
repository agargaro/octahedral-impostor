// const direction = new Vector3(0, 0, 1).normalize();
// const octant = new Vector3(Math.sign(direction.x), Math.sign(direction.y), Math.sign(direction.z));
// const sum = direction.dot(octant);
// const octahedron = new Vector3().copy(direction).divideScalar(sum);
// console.log({ x: (1 + octahedron.x + octahedron.z) * 0.5, y: (1 + octahedron.z - octahedron.x) * 0.5 });

import { Vector3 } from 'three';
import { hemiOctaDirToGrid } from '../src/utils/octahedron.js';

const test = hemiOctaDirToGrid(new Vector3(0, 0, 1));
console.log(test);

const test2 = hemiOctaDirToGrid(new Vector3(0, 0, -1));
console.log(test2);

const test3 = hemiOctaDirToGrid(new Vector3(1, 0, 0));
console.log(test3);

const test4 = hemiOctaDirToGrid(new Vector3(-1, 0, 0));
console.log(test4);

const test5 = hemiOctaDirToGrid(new Vector3(0, 1, 0));
console.log(test5);

const test6 = hemiOctaDirToGrid(new Vector3(-1, -1, 0));
console.log(test6);
