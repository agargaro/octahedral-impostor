import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { exportTextureFromRenderTarget, OctahedronImpostor, OctahedronImpostorMaterialGenerator } from '../src/index.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100).translateY(100).translateX(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'cliff.gltf').then((gltf) => {
  const mesh = gltf.scene;

  scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

  // TODO improve this
  const materialRT = new OctahedronImpostorMaterialGenerator();

  const material = materialRT.create(main.renderer, {
    target: scene,
    useHemiOctahedron: true,
    usePerspectiveCamera: false,
    spritesPerSide: 16,
    textureSize: 4096
  });

  // exportTextureFromRenderTarget(main.renderer, materialRT._albedoRT, 'normal');
  // exportTextureFromRenderTarget(main.renderer, materialRT._depthMapRT, 'depth');

  const impostor = new OctahedronImpostor(material).translateX(2).translateY(0.5);
  impostor.scale.multiplyScalar(2);
  scene.add(impostor);

  mesh.scale.divideScalar(5);

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const gui = new GUI();
  gui.add(material, 'parallaxScale', 0, 1, 0.01).name('parallaxScale');
  gui.add(material, 'alphaClamp', 0, 1, 0.01).name('alphaClamp');
});
