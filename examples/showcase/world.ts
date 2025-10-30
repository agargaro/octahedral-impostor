import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { load, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { simplifyGeometriesByError } from '@three.ez/simplify-geometry';
import { AmbientLight, Color, DirectionalLight, FogExp2, Material, Mesh, MeshLambertMaterial, RepeatWrapping, Scene, TextureLoader } from 'three';
import { GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../../src/core/octahedralImpostor.js';
import { Terrain, TerrainParams } from './terrain.js';

const camera = new PerspectiveCameraAuto(50, 0.1, 1500).translateY(50);
const scene = new Scene();
const main = new Main({ showStats: true, rendererParameters: { antialias: false } }); // init renderer and other stuff

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(500, 0, 0);
controls.update();

main.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));

load(GLTFLoader, 'tree.glb').then(async (gltf) => {
  const mesh = gltf.scene;

  scene.background = new Color('cyan');

  const directionalLight = new DirectionalLight('white', 2);
  const ambientLight = new AmbientLight('white', 1);

  scene.add(directionalLight, ambientLight);

  scene.fog = new FogExp2('cyan', 0.0012);

  // TERRAIN

  const grassMap = await load(TextureLoader, 'grass.jpg');
  grassMap.wrapS = grassMap.wrapT = RepeatWrapping;
  grassMap.repeat.set(50, 50);

  const options: TerrainParams = {
    maxChunksX: 24,
    maxChunksZ: 24,
    chunkSize: 128,
    segments: 56,
    frequency: 0.001,
    amplitude: 150,
    octaves: 4,
    lacunarity: 3,
    gain: 0.2
  };

  const terrain = new Terrain(new MeshLambertMaterial({ color: 0xaaaaaa, map: grassMap }), options);
  // terrain.renderOrder = 1;
  terrain.renderOrder = -1; // this can be based on camera rotation

  for (let x = -(options.maxChunksX / 2); x < (options.maxChunksX / 2); x++) {
    for (let z = -(options.maxChunksZ / 2); z < (options.maxChunksZ / 2); z++) {
      await terrain.addChunk(x, z);
    }
  }
  scene.add(terrain);

  // TREES AND IMPOSTORS

  const mergedGeo = mergeGeometries(mesh.children.map((x) => (x as Mesh).geometry), true);
  const materials = mesh.children.map((x) => (x as Mesh).material as Material);

  const pos = await terrain.generateTrees(500000);

  const iMesh = new InstancedMesh2(mergedGeo, materials, { createEntities: true, renderer: main.renderer, capacity: pos.length });

  // iMesh.sortObjects = true;
  // iMesh.customSort = createRadixSort(iMesh);

  iMesh.addInstances(pos.length, (obj, index) => {
    obj.position.copy(pos[index]);
    obj.rotateY(Math.random() * Math.PI * 2).rotateX(Math.random() * 0.5 - 0.25);
    obj.scale.setScalar(Math.random() * 0.5 + 0.75);
  });

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    transparent: false,
    alphaClamp: 0.3,
    spritesPerSide: 12,
    textureSize: 2048,
    baseType: MeshLambertMaterial
  });

  // impostor.material.normalScale.set(-0.5, 0.5);
  // impostor.material.alphaToCoverage = true;

  const LODGeo = await simplifyGeometriesByError(mesh.children.map((x) => (x as Mesh).geometry), [0, 0.01]); // improve
  const mergedGeoLOD = mergeGeometries(LODGeo, true);

  iMesh.addLOD(mergedGeoLOD, mesh.children.map((x) => ((x as Mesh).material as Material).clone()), 10);
  iMesh.addLOD(impostor.geometry, impostor.material, 70);
  iMesh.computeBVH();

  scene.add(iMesh);

  main.createView({ scene, camera, enabled: false });

  document.getElementById('loading').remove();
  document.getElementById('info').style.display = 'block';
});
