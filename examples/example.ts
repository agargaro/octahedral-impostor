import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, MeshBasicMaterial, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { OctahedronImpostor, OctahedronImpostorMaterialGenerator } from '../src/index.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'tree.gltf').then((gltf) => {
  const mesh = gltf.scene;

  scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

  // TODO improve this
  const materialRT = new OctahedronImpostorMaterialGenerator(MeshBasicMaterial);

  const material = materialRT.create(main.renderer, {
    target: scene,
    useHemiOctahedron: true,
    usePerspectiveCamera: false,
    spritesPerSide: 16,
    textureSize: 4096
  });

  // exportTextureFromRenderTarget(main.renderer, materialRT._albedoRT, 'normal');

  const impostor = new OctahedronImpostor(material).translateX(2).translateY(0.9);
  impostor.scale.multiplyScalar(2);
  scene.add(impostor);

  mesh.scale.divideScalar(4);

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const gui = new GUI();
  gui.add(materialRT.parallaxScale, 'value', 0, 1, 0.01).name('parallaxScale');
  gui.add(materialRT.alphaClamp, 'value', 0, 1, 0.01).name('alphaClamp');
});
