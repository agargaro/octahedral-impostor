import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, MeshBasicMaterial, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { OctahedronImpostor, OctahedronImpostorMaterialGenerator } from '../src/index.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = 0.2; // TODO improve if this is 0
controls.update();

const gltf = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const mesh = gltf.scene;

scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

const spritesPerSide = 16;

// TODO improve this
const material = new OctahedronImpostorMaterialGenerator(MeshBasicMaterial).create(main.renderer, {
  target: scene,
  useHemiOctahedron: true,
  usePerspectiveCamera: false,
  spritesPerSide,
  textureSize: 2048
});

const impostor = new OctahedronImpostor(material).translateX(2).translateY(0.9);
impostor.scale.multiplyScalar(2);
scene.add(impostor);

mesh.scale.divideScalar(4);

// mesh.on('animate', (e) => mesh.rotation.y += e.delta * 0.5);
// impostor.on('animate', (e) => impostor.rotation.y += e.delta * 0.5);

main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });
