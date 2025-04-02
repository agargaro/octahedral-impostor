import { Asset, Main } from '@three.ez/main';
import { AmbientLight, BufferGeometry, BufferGeometryLoader, Mesh, MeshNormalMaterial } from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../src/utils/exportTexture.js';

const main = new Main();
// const treeGLTF = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
// treeGLTF.scene.add(new AmbientLight('white', 5)); // TODO remove ambient light
// const target = treeGLTF.scene;

const geometry = await Asset.load<BufferGeometry>(BufferGeometryLoader, 'https://threejs.org/examples/models/json/suzanne_buffergeometry.json');
geometry.computeVertexNormals();
const target = new Mesh(geometry, new MeshNormalMaterial());

target.updateMatrixWorld(true);

const renderTarget = createAlbedo({ renderer: main.renderer, target, useHemiOctahedron: true, usePerspectiveCamera: false, countPerSide: 16 });

exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo');
