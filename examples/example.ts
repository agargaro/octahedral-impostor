import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';
import { Asset, Main } from '@three.ez/main';
import { AmbientLight } from 'three';
import { exportTextureFromRenderTarget } from '../src/utils/exportTexture.js';

const main = new Main();
const soldierGLTF = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
soldierGLTF.scene.add(new AmbientLight('white', 5));

const renderTarget = createAlbedo({ renderer: main.renderer, target: soldierGLTF.scene, useHemiOctahedron: true, usePerspectiveCamera: false });
exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo');

// const direction = new Vector3(0, 0, 1).normalize();
// const octant = new Vector3(Math.sign(direction.x), Math.sign(direction.y), Math.sign(direction.z));
// const sum = direction.dot(octant);
// const octahedron = new Vector3().copy(direction).divideScalar(sum);
// console.log({ x: (1 + octahedron.x + octahedron.z) * 0.5, y: (1 + octahedron.z - octahedron.x) * 0.5 });
