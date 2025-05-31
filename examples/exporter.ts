import { Asset, Main } from '@three.ez/main';
import { BufferGeometry, BufferGeometryLoader, Mesh, MeshNormalMaterial } from 'three';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../src/utils/exportTextureFromRenderTarget.js';

const main = new Main();
// const treeGLTF = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
// treeGLTF.scene.add(new AmbientLight('white', 5)); // TODO remove ambient light
// const target = treeGLTF.scene;

const geometry = await Asset.load<BufferGeometry>(BufferGeometryLoader, 'https://threejs.org/examples/models/json/suzanne_buffergeometry.json');
geometry.computeVertexNormals();
const target = new Mesh(geometry, new MeshNormalMaterial());

target.updateMatrixWorld(true);

const renderTarget = createAlbedo(main.renderer, { target, useHemiOctahedron: true, spritesPerSide: 16 });
// const renderTarget = createAlbedo(main.renderer, target, { useHemiOctahedron: true, spritesPerSide: 16 });

exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo');
