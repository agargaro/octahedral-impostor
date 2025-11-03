import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { load, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { simplifyGeometriesByError } from '@three.ez/simplify-geometry';
import { ACESFilmicToneMapping, AmbientLight, BoxGeometry, Color, DirectionalLight, FogExp2, Material, Mesh, MeshStandardMaterial, PCFSoftShadowMap, RepeatWrapping, Scene, TextureLoader, Vector3 } from 'three';
import { GLTFLoader, MapControls } from 'three/examples/jsm/Addons.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OctahedralImpostor } from '../../src/core/octahedralImpostor.js';
import { Terrain, TerrainParams } from './terrain.js';

const camera = new PerspectiveCameraAuto(50, 0.1, 1200).translateY(50);
const scene = new Scene();
const main = new Main({ showStats: true, rendererParameters: { antialias: false } }); // init renderer and other stuff

main.renderer.toneMapping = ACESFilmicToneMapping;
main.renderer.toneMappingExposure = 0.7;
main.renderer.shadowMap.enabled = true;
main.renderer.shadowMap.type = PCFSoftShadowMap;

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.target.set(100, 0, 0);
controls.update();

main.renderer.setPixelRatio(Math.min(1.25, window.devicePixelRatio));

load(GLTFLoader, 'Pine_5.gltf').then(async (gltf) => {
  const treeGroup = gltf.scene.children[0];
  treeGroup.children[0].renderOrder = 2; // mmm why we need this to fix normal baking?
  treeGroup.children[1].renderOrder = 1;

  scene.background = new Color('cyan');

  const directionalLight = new DirectionalLight('white', 1.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048, 2048);
  directionalLight.shadow.camera.left = -450;
  directionalLight.shadow.camera.right = 450;
  directionalLight.shadow.camera.top = 450;
  directionalLight.shadow.camera.bottom = -450;
  directionalLight.shadow.camera.far = 5000;
  directionalLight.shadow.camera.updateProjectionMatrix();

  scene.add(directionalLight, directionalLight.target);

  const sunOffset = new Vector3(1, 1, 0).normalize().multiplyScalar(1000);
  directionalLight.on('animate', (e) => {
    directionalLight.position.copy(camera.position).add(sunOffset);
    directionalLight.target.position.copy(camera.position).sub(sunOffset);
  });

  const ambientLight = new AmbientLight('white', 2);
  scene.add(ambientLight);

  scene.fog = new FogExp2('cyan', 0.0015);

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

  const terrain = new Terrain(new MeshStandardMaterial({ color: 0x888888, map: grassMap }), options);
  terrain.renderOrder = -1; // this can be based on camera rotation
  terrain.receiveShadow = true;
  terrain.castShadow = true;

  for (let x = -(options.maxChunksX / 2); x < (options.maxChunksX / 2); x++) {
    for (let z = -(options.maxChunksZ / 2); z < (options.maxChunksZ / 2); z++) {
      await terrain.addChunk(x, z);
    }
  }
  scene.add(terrain);

  // TREES AND IMPOSTORS

  const mergedGeo = mergeGeometries(treeGroup.children.map((x) => (x as Mesh).geometry), true);
  const materials = treeGroup.children.map((x) => (x as Mesh).material as Material);

  const pos = await terrain.generateTrees(200_000);

  const iMesh = new InstancedMesh2(mergedGeo, materials, { createEntities: true, renderer: main.renderer, capacity: pos.length });

  iMesh.addInstances(pos.length, (obj, index) => {
    obj.position.copy(pos[index]);
    obj.rotateY(Math.random() * Math.PI * 2).rotateX(Math.random() * 0.5 - 0.25);
    obj.scale.setScalar(Math.random() * 0.5 + 0.75);
  });

  const impostor = new OctahedralImpostor({
    renderer: main.renderer,
    target: treeGroup,
    useHemiOctahedron: true,
    transparent: false,
    alphaClamp: 0.5,
    spritesPerSide: 24,
    textureSize: 4096,
    baseType: MeshStandardMaterial
  });

  const LODGeo = await simplifyGeometriesByError(treeGroup.children.map((x) => (x as Mesh).geometry), 0.05); // improve
  const mergedGeoLOD = mergeGeometries(LODGeo, true);

  iMesh.addLOD(mergedGeoLOD, treeGroup.children.map((x) => ((x as Mesh).material as Material).clone()), 10);
  iMesh.addLOD(impostor.geometry, impostor.material, 50);
  iMesh.addShadowLOD(new BoxGeometry(3, 10, 3));
  iMesh.computeBVH();

  scene.add(iMesh);

  main.createView({ scene, camera, enabled: false });

  document.getElementById('loading').remove();
  document.getElementById('info').style.display = 'block';
});
