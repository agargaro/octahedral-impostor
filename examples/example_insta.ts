import { createRadixSort, InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, FogExp2, Material, Mesh, MeshLambertMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../src/core/octahedralImpostor.js';

const camera = new PerspectiveCameraAuto(50, 0.1, 800).translateZ(20).translateY(5);
const scene = new Scene().activeSmartRendering();
const main = new Main(); // init renderer and other stuff
const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.update();

main.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); // TODO mmm...

Asset.load<GLTF>(GLTFLoader, 'tree.glb').then(async (gltf) => {
  const mesh = gltf.scene;

  mesh.children[0].material.transparent = false;
  mesh.children[0].material.alphaTest = 0.4;
  mesh.children[0].material.depthWrite = true;

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

  scene.add(directionalLight, ambientLight);

  scene.fog = new FogExp2('cyan', 0.003);

  main.createView({ scene, camera: camera, backgroundColor: 'cyan', enabled: false });

  const mergedGeo = mergeGeometries(mesh.children.map((x) => (x as Mesh).geometry), true);

  const iMesh = new InstancedMesh2(mergedGeo, mesh.children.map((x) => (x as Mesh).material as Material), { createEntities: true, renderer: main.renderer });

  iMesh.sortObjects = true;
  iMesh.customSort = createRadixSort(iMesh);

  iMesh.addInstances(300000, (obj) => {
    obj.position.x = Math.random() * 4000 - 2000;
    obj.position.z = Math.random() * 4000 - 2000;
    obj.rotateY(Math.random() * Math.PI * 2);
    obj.scale.setScalar(Math.random() * 0.5 + 0.75);
    // add color
  });

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    alphaClamp: 0.2, // TODO call it alphaTest
    spritesPerSide: 16,
    textureSize: 1024,
    baseType: MeshLambertMaterial
  });

  // const LODGeo = await simplifyGeometries(mesh.children.map((x) => (x as Mesh).geometry), { ratio: 0.5 });
  // const mergedGeoLOD = mergeGeometries(LODGeo, true);
  // iMesh.addLOD(mergedGeoLOD, mesh.children.map((x) => ((x as Mesh).material as Material).clone()), 15);

  iMesh.addLOD(impostor.geometry, impostor.material, 100);
  iMesh.computeBVH();

  const LODLevel = iMesh.LODinfo.render.levels[1];

  scene.add(iMesh);

  controls.addEventListener('change', () => scene.needsRender = true);
  iMesh.on('viewportresize', () => scene.needsRender = true);

  const ground = new Mesh(new PlaneGeometry(2000, 2000, 10, 10), new MeshLambertMaterial({ color: 'sandybrown' }));
  ground.rotateX(-Math.PI / 2);
  scene.add(ground);

  const gui = new GUI();
  gui.add(LODLevel, 'distance', 0, 1000 ** 2, 1).name('Impostor distance (pow 2)').onChange(() => scene.needsRender = true);
  const lightFolder = gui.addFolder('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 10, 0.01).name('Intensity');
  lightFolder.add(lightPosition, 'azimuth', -180, 180, 1).name('Azimuth').onChange(() => lightPosition.update());
  lightFolder.add(lightPosition, 'elevation', -90, 90, 1).name('Elevation').onChange(() => lightPosition.update());
});
