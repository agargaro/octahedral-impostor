import { load, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, LinearSRGBColorSpace, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Scene } from 'three';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OctahedralImpostor } from '../src/core/octahedralImpostor.js';
import { CreateOctahedralImpostor } from '../src/core/octahedralImpostorMaterial.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

main.renderer.outputColorSpace = LinearSRGBColorSpace;

load(GLTFLoader, 'Pine_5.gltf').then((gltf) => {
  const mesh = gltf.scene;

  const directionalLight = new DirectionalLight('white', 10);
  const ambientLight = new AmbientLight('white', 1);

  const lightPosition = {
    azimuth: 55,
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

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    spritesPerSide: 12,
    textureSize: 8192,
    baseType: MeshStandardMaterial
  } as CreateOctahedralImpostor<MeshStandardMaterial>);
  scene.add(impostor);

  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  // const plane = new Mesh(new PlaneGeometry(15, 15), new MeshBasicMaterial({ map: impostor.material.normalMap, transparent: true }));
  // scene.add(plane.translateX(-10));

  // const plane2 = new Mesh(new PlaneGeometry(15, 15), new MeshBasicMaterial({ map: impostor.material.map, transparent: true }));
  // scene.add(plane2.translateX(10));

  const config = { showImpostor: true };
  const gui = new GUI();
  // gui.add(impostor.material.ezImpostorUniforms.parallaxScale, 'value', 0, 0.3, 0.01).name('Parallax Scale');
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

  lightPosition.update();

  // mesh.traverse((mesh) => {
  //   if ((mesh as Mesh).material) {
  //     const material = (mesh as Mesh).material as MeshStandardMaterial;
  //     (mesh as Mesh).material = new MeshNormalMaterial(
  //       {
  //         side: material.side,
  //         transparent: material.transparent,
  //         alphaTest: material.alphaTest,
  //         normalMap: material.normalMap,
  //         normalMapType: material.normalMapType,
  //         normalScale: material.normalScale
  //       });
  //   }
  // });

  // mesh.traverse((mesh) => {
  //   if ((mesh as Mesh).material) {
  //     const material = (mesh as Mesh).material as MeshStandardMaterial;
  //     console.log(material.toJSON());
  //     (mesh as Mesh).material = new MeshBasicMaterial(
  //       {
  //         map: material.map,
  //         side: material.side,
  //         transparent: material.transparent,
  //         alphaTest: material.alphaTest,
  //         vertexColors: material.vertexColors,
  //         depthWrite: material.depthWrite,
  //         depthTest: material.depthTest,
  //         depthFunc: material.depthFunc,
  //         precision: material.precision,
  //         color: material.color,
  //         blendColor: material.blendColor
  //       });
  //   }
  // });
});
