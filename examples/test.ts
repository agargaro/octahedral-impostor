import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { createTextureAtlas } from '../src/utils/createTextureAtlas.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

const gltf = await Asset.load<GLTF>(GLTFLoader, 'cliff.gltf');

const mesh = gltf.scene;
scene.add(mesh);

main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

const result = createTextureAtlas({ renderer: main.renderer, target: mesh, useHemiOctahedron: true });
mesh.visible = false;

const plane = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({ transparent: true, map: result.albedo }));
const plane2 = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({ transparent: true, map: result.normalDepth })).translateY(11);

scene.add(plane, plane2);
