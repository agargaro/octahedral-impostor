import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, MeshLambertMaterial, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OctahedralImpostor } from '../src/core/octahedralImpostor.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'cliff.gltf').then((gltf) => {
  const mesh = gltf.scene;

  const directionalLight = new DirectionalLight('white', 4.0);
  // const ambientLight = new AmbientLight('white', 2.0);

  const lightPosition = {
    azimuth: 0,
    elevation: 45,
    update: function () {
      const azRad = this.azimuth * Math.PI / 180;
      const elRad = this.elevation * Math.PI / 180;

      const x = Math.cos(elRad) * Math.sin(azRad);
      const y = Math.sin(elRad);
      const z = Math.cos(elRad) * Math.cos(azRad);

      directionalLight.position.set(x, y, z);
      directionalLight.lookAt(0, 0, 0);
    }
  };

  scene.add(mesh, directionalLight);

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    blendSprites: true,
    useHemiOctahedron: true,
    transparent: true,
    spritesPerSide: 16,
    textureSize: 2048,
    parallaxScale: 0,
    baseType: MeshLambertMaterial
  });
  scene.add(impostor);

  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const config = { showImpostor: true };
  const gui = new GUI();
  gui.add(impostor.material.ezImpostorUniforms.parallaxScale, 'value', 0, 0.3, 0.01).name('Parallax Scale');
  gui.add(impostor.material.ezImpostorUniforms.alphaClamp, 'value', 0, 0.5, 0.01).name('Alpha Clamp');
  gui.add(impostor.material, 'transparent');
  gui.add(config, 'showImpostor').onChange((value) => {
    mesh.visible = !value;
    impostor.visible = value;
  });
  const lightFolder = gui.addFolder('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 10, 0.01).name('Intensity');
  lightFolder.add(lightPosition, 'azimuth', -180, 180, 1).name('Azimuth').onChange(() => lightPosition.update());
  lightFolder.add(lightPosition, 'elevation', -90, 90, 1).name('Elevation').onChange(() => lightPosition.update());
});
