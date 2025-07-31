import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, MeshBasicMaterial, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OctahedralImpostor } from '../src/core/octahedralImpostor.js';

const mainCamera = new PerspectiveCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'tree.glb').then((gltf) => {
  const mesh = gltf.scene;

  const directionalLight = new DirectionalLight('white', 3);
  const ambientLight = new AmbientLight('white', 1);

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

  scene.add(mesh, directionalLight, ambientLight);

  // const oldMaterial = mesh.children[0].material as MeshStandardMaterial;
  // mesh.children[0].material = new MeshLambertMaterial({ alphaTest: 0.2, map: oldMaterial.map });

  mesh.querySelectorAll('Mesh').forEach((m) => {
    const base = m.material as MeshBasicMaterial;
    m.material = new MeshBasicMaterial({ map: base.map, alphaTest: 0.5 });
    m.material.map.generateMipmaps = false;
  }); // todo remove

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    spritesPerSide: 8,
    textureSize: 8192,
    parallaxScale: 0,
    baseType: MeshBasicMaterial
  });
  scene.add(impostor);

  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const config = { showImpostor: true };
  const gui = new GUI();
  gui.add(impostor.material.ezImpostorUniforms.parallaxScale, 'value', 0, 0.3, 0.01).name('Parallax Scale');
  gui.add(impostor.material.ezImpostorUniforms.alphaClamp, 'value', 0, 0.5, 0.01).name('Alpha Clamp');
  gui.add(impostor.material, 'transparent').onChange((value) => impostor.material.needsUpdate = true);
  gui.add(config, 'showImpostor').onChange((value) => {
    mesh.visible = !value;
    impostor.visible = value;
  });
  const lightFolder = gui.addFolder('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 10, 0.01).name('Intensity');
  lightFolder.add(lightPosition, 'azimuth', -180, 180, 1).name('Azimuth').onChange(() => lightPosition.update());
  lightFolder.add(lightPosition, 'elevation', -90, 90, 1).name('Elevation').onChange(() => lightPosition.update());

  // mesh.querySelectorAll('Mesh').forEach((m) => {
  //   const base = m.material as MeshBasicMaterial;
  //   m.material = new MeshNormalMaterial({ normalMap: base.map, normalScale: base.normalScale, normalMapType: base.normalMapType });
  // }); // todo remove
});
