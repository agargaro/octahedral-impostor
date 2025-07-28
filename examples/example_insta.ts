import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight, Material, Mesh, MeshLambertMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../src/core/octahedralImpostor.js';

const mainCamera = new PerspectiveCameraAuto(50, 0.1, 5000).translateZ(20).translateY(5);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

Asset.load<GLTF>(GLTFLoader, 'palm.gltf').then((gltf) => {
  const mesh = gltf.scene;

  const directionalLight = new DirectionalLight('white', 3);

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
    useHemiOctahedron: true,
    transparent: false,
    spritesPerSide: 16,
    textureSize: 2048,
    parallaxScale: 0,
    baseType: MeshLambertMaterial
  });

  mesh.visible = false;

  main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

  const gui = new GUI();
  gui.add(impostor.material.ezImpostorUniforms.parallaxScale, 'value', 0, 0.3, 0.01).name('Parallax Scale');
  gui.add(impostor.material.ezImpostorUniforms.alphaClamp, 'value', 0, 0.5, 0.01).name('Alpha Clamp');
  gui.add(impostor.material, 'transparent').onChange((value) => impostor.material.needsUpdate = true);
  const lightFolder = gui.addFolder('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 10, 0.01).name('Intensity');
  lightFolder.add(lightPosition, 'azimuth', -180, 180, 1).name('Azimuth').onChange(() => lightPosition.update());
  lightFolder.add(lightPosition, 'elevation', -90, 90, 1).name('Elevation').onChange(() => lightPosition.update());

  // INSTANCED MESH

  const mergedGeo = mergeGeometries(mesh.children.map((x) => (x as Mesh).geometry), true);

  const iMesh = new InstancedMesh2(mergedGeo, mesh.children.map((x) => (x as Mesh).material as Material), { createEntities: true });

  iMesh.addInstances(50000, (obj) => {
    obj.position.x = Math.random() * 2000 - 1000;
    obj.position.z = Math.random() * 2000 - 1000;
    obj.rotateY(Math.random() * Math.PI * 2);
  });

  iMesh.addLOD(impostor.geometry, impostor.material, 50);
  // iMesh.addLOD(impostor.geometry, new MeshLambertMaterial({ wireframe: true }), 50);

  iMesh.computeBVH();

  scene.add(iMesh);

  const ground = new Mesh(new PlaneGeometry(2000, 2000, 10, 10), new MeshLambertMaterial({ color: 'sandybrown' }));
  ground.rotateX(-Math.PI / 2);
  scene.add(ground);
});
