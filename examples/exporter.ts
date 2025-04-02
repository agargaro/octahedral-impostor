import { Asset, Main } from '@three.ez/main';
import { AmbientLight } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../src/utils/exportTexture.js';

const main = new Main();
const treeGLTF = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
treeGLTF.scene.add(new AmbientLight('white', 5)); // TODO remove ambient light

treeGLTF.scene.updateMatrixWorld(true);

const renderTarget = createAlbedo({ renderer: main.renderer, target: treeGLTF.scene, useHemiOctahedron: true, usePerspectiveCamera: false });

exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo');
