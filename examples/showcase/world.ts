import { createRadixSort, InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { AmbientLight, DirectionalLight, FogExp2, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, RepeatWrapping, Scene, Texture, TextureLoader } from 'three';
import 'three-hex-tiling';
import { GLTF, GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import GUI from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../../src/core/octahedralImpostor.js';
import { Terrain, TerrainParams } from './terrain.js';

const camera = new PerspectiveCameraAuto(50, 0.1, 2000).translateZ(20).translateY(5);
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

  scene.fog = new FogExp2('cyan', 0.0005);

  main.createView({ scene, camera: camera, backgroundColor: 'cyan', enabled: false });

  // TERRAIN

  const grassNormalMap = await Asset.load<Texture>(TextureLoader, 'grass_normal.png');
  grassNormalMap.wrapS = RepeatWrapping;
  grassNormalMap.wrapT = RepeatWrapping;
  grassNormalMap.repeat.set(100, 100);

  const grassMap = await Asset.load<Texture>(TextureLoader, 'grass.jpg');
  grassMap.wrapS = RepeatWrapping;
  grassMap.wrapT = RepeatWrapping;
  grassMap.repeat.set(100, 100);

  const options: TerrainParams = {
    maxChunksX: 16,
    maxChunksZ: 16,
    chunkSize: 128,
    segments: 56,
    frequency: 0.001,
    amplitude: 150,
    octaves: 4,
    lacunarity: 3,
    gain: 0.2
  };

  const terrain = new Terrain(new MeshStandardMaterial({ color: 0xbbbbbb, map: grassMap, normalMap: grassNormalMap, hexTiling: {} }), options);
  terrain.receiveShadow = true;

  for (let x = -(options.maxChunksX / 2); x < (options.maxChunksX / 2); x++) {
    for (let z = -(options.maxChunksZ / 2); z < (options.maxChunksZ / 2); z++) {
      await terrain.addChunk(x, z);
    }
  }
  scene.add(terrain);

  // TREES AND IMPOSTORS

  const mergedGeo = mergeGeometries(mesh.children.map((x) => (x as Mesh).geometry), true);
  const materials = mesh.children.map((x) => (x as Mesh).material as Material);

  const pos = await terrain.generateTrees(300000); // imporve it

  const iMesh = new InstancedMesh2(mergedGeo, materials, { createEntities: true, renderer: main.renderer, capacity: pos.length });

  // iMesh.sortObjects = true;
  // iMesh.customSort = createRadixSort(iMesh);

  console.log('trees count', pos.length);

  iMesh.addInstances(pos.length, (obj, index) => {
    obj.position.copy(pos[index]);
    obj.rotateY(Math.random() * Math.PI * 2).rotateX(Math.random() - 0.5);
    obj.scale.setScalar(Math.random() * 0.5 + 0.75);
    // add color
  });

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    alphaClamp: 0.1, // TODO call it alphaTest
    spritesPerSide: 12,
    textureSize: 1024,
    baseType: MeshLambertMaterial
  });

  iMesh.addLOD(impostor.geometry, impostor.material, 100);
  iMesh.computeBVH();

  scene.add(iMesh);

  controls.addEventListener('change', () => scene.needsRender = true);
  iMesh.on('viewportresize', () => scene.needsRender = true);

  const gui = new GUI();
  // gui.add(LODLevel, 'distance', 0, 1000 ** 2, 1).name('Impostor distance (pow 2)').onChange(() => scene.needsRender = true);
  const lightFolder = gui.addFolder('Directional Light');
  lightFolder.add(directionalLight, 'intensity', 0, 10, 0.01).name('Intensity');
  lightFolder.add(lightPosition, 'azimuth', -180, 180, 1).name('Azimuth').onChange(() => lightPosition.update());
  lightFolder.add(lightPosition, 'elevation', -90, 90, 1).name('Elevation').onChange(() => lightPosition.update());
});
