import { createRadixSort, InstancedMesh2 } from '@three.ez/instanced-mesh';
import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { simplifyGeometriesByError } from '@three.ez/simplify-geometry';
import { ACESFilmicToneMapping, AmbientLight, Color, DirectionalLight, FogExp2, Material, Mesh, MeshLambertMaterial, MeshStandardMaterial, RepeatWrapping, Scene, Texture, TextureLoader } from 'three';
import 'three-hex-tiling';
import { GLTF, GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../../src/core/octahedralImpostor.js';
import { Terrain, TerrainParams } from './terrain.js';

// TODO: render terrain first to avoid impostor overdraw
// TODO: LOD before impostor
// TODO: BVH chunk

const camera = new PerspectiveCameraAuto(50, 0.1, 1500).translateY(50);
const scene = new Scene();
const main = new Main({ showStats: true }); // init renderer and other stuff

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(500, 0, 0);
controls.update();

main.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio)); // TODO mmm...

main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.6;

Asset.load<GLTF>(GLTFLoader, 'tree.glb').then(async (gltf) => {
  const mesh = gltf.scene;

  // const loader = new UltraHDRLoader();
  // loader.type = FloatType;
  // loader.load(`skybox.jpg`, function (texture) {
  //   texture.mapping = EquirectangularReflectionMapping;
  //   scene.background = texture;
  // });

  scene.background = new Color('cyan');

  const directionalLight = new DirectionalLight('white', 2);
  const ambientLight = new AmbientLight('white', 1);

  scene.add(directionalLight, ambientLight);

  scene.fog = new FogExp2('cyan', 0.0012);

  // TERRAIN

  const grassNormalMap = await Asset.load<Texture>(TextureLoader, 'grass_normal.png');
  grassNormalMap.wrapS = grassNormalMap.wrapT = RepeatWrapping;
  grassNormalMap.repeat.set(100, 100);

  const grassMap = await Asset.load<Texture>(TextureLoader, 'grass.jpg');
  grassMap.wrapS = grassMap.wrapT = RepeatWrapping;
  grassMap.repeat.set(100, 100);

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

  const terrain = new Terrain(new MeshStandardMaterial({ color: 0xdddddd, map: grassMap, normalMap: grassNormalMap, hexTiling: {} }), options);
  terrain.receiveShadow = true;

  for (let x = -(options.maxChunksX / 2); x < (options.maxChunksX / 2); x++) {
    for (let z = -(options.maxChunksZ / 2); z < (options.maxChunksZ / 2); z++) {
      await terrain.addChunk(x, z);
    }
  }
  scene.add(terrain);

  // TREES AND IMPOSTORS

  const oldMaterial = mesh.children[0].material as MeshStandardMaterial;
  mesh.children[0].material = new MeshLambertMaterial({ alphaTest: 0.4, map: oldMaterial.map });
  mesh.children[0].material.map.generateMipmaps = false;

  const mergedGeo = mergeGeometries(mesh.children.map((x) => (x as Mesh).geometry), true);
  const materials = mesh.children.map((x) => (x as Mesh).material as Material);

  const pos = await terrain.generateTrees(200000);

  const iMesh = new InstancedMesh2(mergedGeo, materials, { createEntities: true, renderer: main.renderer, capacity: pos.length });

  // iMesh.sortObjects = true;
  iMesh.customSort = createRadixSort(iMesh);

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
    alphaClamp: 0.4,
    spritesPerSide: 12,
    textureSize: 1024,
    baseType: MeshLambertMaterial
  });

  const LODGeo = await simplifyGeometriesByError(mesh.children.map((x) => (x as Mesh).geometry), [0, 0.01]); // improve
  const mergedGeoLOD = mergeGeometries(LODGeo, true);

  iMesh.addLOD(mergedGeoLOD, mesh.children.map((x) => ((x as Mesh).material as Material).clone()), 20);
  iMesh.addLOD(impostor.geometry, impostor.material, 100);
  iMesh.computeBVH();

  scene.add(iMesh);

  main.createView({ scene, camera, enabled: false });

  document.getElementById('loading').remove();
  document.getElementById('info').style.display = 'block';
});
