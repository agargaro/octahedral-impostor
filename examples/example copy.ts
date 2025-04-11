import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, ConeGeometry, HemisphereLight, Mesh, MeshNormalMaterial, Scene, Sphere, SphereGeometry, Vector2, Vector3 } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { computeBoundingSphereFromObject, hemiOctaGridToDir } from '../src/index.js';

const camera = new OrthographicCameraAuto(20).translateZ(100).translateX(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.target.copy(new Vector3(100, 0, 0));
controls.update();

const gltf = await Asset.load<GLTF>(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb');
const mesh = gltf.scene;

mesh.position.x = 100;

scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

const spritesPerSide = 4;

main.createView({ scene, camera, backgroundColor: 'cyan' });

mesh.updateMatrixWorld(true);
const bSphere = computeBoundingSphereFromObject(mesh, new Sphere(), true); // TODO optiona flag for the last 'true';
console.log(bSphere);

const geometry = new SphereGeometry(0.3);
const cylinder = new Mesh(geometry, new MeshNormalMaterial());
cylinder.position.copy(bSphere.center);
scene.add(cylinder);

const coords = new Vector2();
for (let row = 0; row < spritesPerSide; row++) {
  for (let col = 0; col < spritesPerSide; col++) {
    coords.set(col / (spritesPerSide - 1), row / (spritesPerSide - 1));

    const geo = new ConeGeometry(0.1, 0.25);
    const cylinder = new Mesh(geo, new MeshNormalMaterial());
    scene.add(cylinder);

    hemiOctaGridToDir(coords, cylinder.position);
    console.log(cylinder.position);

    cylinder.position.setLength(bSphere.radius).add(bSphere.center);

    cylinder.up.set(0, 0, 1).normalize();
    cylinder.lookAt(bSphere.center);
  }
}
