import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OctahedronImpostor, OctahedronImpostorMaterialGenerator } from '../src/index.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'palm.gltf').then((gltf) => {
  const mesh = gltf.scene;

  scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

  // TODO improve this
  const materialRT = new OctahedronImpostorMaterialGenerator();

  const material = materialRT.create(main.renderer, {
    target: scene,
    useHemiOctahedron: true,
    usePerspectiveCamera: false,
    spritesPerSide: 20,
    textureSize: 4096
  });

  // exportTextureFromRenderTarget(main.renderer, materialRT._albedoRT, 'normal');
  // exportTextureFromRenderTarget(main.renderer, materialRT._depthMapRT, 'depth');

  const impostor = new OctahedronImpostor(material).translateX(0.19).translateY(0.35);
  scene.add(impostor);

  mesh.scale.divideScalar(3.85);
  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const config = { showImpostor: true };
  const gui = new GUI();
  gui.add(material, 'parallaxScale', 0, 0.5, 0.01);
  gui.add(material, 'alphaClamp', 0, 0.8, 0.01);
  gui.add(config, 'showImpostor').onChange((value) => {
    mesh.visible = !value;
    impostor.visible = value;
  });
});
