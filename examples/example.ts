import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OctahedralImpostor } from '../src/index.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb').then((gltf) => {
  const mesh = gltf.scene;

  scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

  const impostor = new OctahedralImpostor({ renderer: main.renderer, target: scene, useHemiOctahedron: true, spritesPerSide: 20, textureSize: 4096 });
  scene.add(impostor);

  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const config = { showImpostor: true };
  const gui = new GUI();
  gui.add(impostor.material, 'parallaxScale', 0, 0.5, 0.01);
  gui.add(impostor.material, 'alphaClamp', 0, 0.8, 0.01);
  gui.add(impostor.material, 'transparent');
  gui.add(config, 'showImpostor').onChange((value) => {
    mesh.visible = !value;
    impostor.visible = value;
  });
});

// exportTextureFromRenderTarget(main.renderer, materialRT._albedoRT, 'normal');
// exportTextureFromRenderTarget(main.renderer, materialRT._depthMapRT, 'depth');
