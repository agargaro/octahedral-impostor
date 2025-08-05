import { Asset, Main, PerspectiveCameraAuto } from '@three.ez/main';
import { DirectionalLight, MeshStandardMaterial, RepeatWrapping, Scene, Texture, TextureLoader, Vector3, WebGLCoordinateSystem } from 'three';
import 'three-hex-tiling';
import { MapControls } from 'three/examples/jsm/Addons.js';
import { Terrain } from './terrain.js';

// 130kb per chunk

const camera = new PerspectiveCameraAuto(50, 0.1, 5000).translateY(3000);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff

const controls = new MapControls(camera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
// controls.target.set(-500, 0, 0);
controls.update();

const grassNormalMap = await Asset.load<Texture>(TextureLoader, 'grass_normal.png');
grassNormalMap.wrapS = grassNormalMap.wrapT = RepeatWrapping;
grassNormalMap.repeat.set(100, 100);

const grassMap = await Asset.load<Texture>(TextureLoader, 'grass.jpg');
grassMap.wrapS = grassMap.wrapT = RepeatWrapping;
grassMap.repeat.set(100, 100);

const terrain = new Terrain(new MeshStandardMaterial({ color: 0xdddddd, map: grassMap, normalMap: grassNormalMap, hexTiling: {} }), {
  coordinateSystem: WebGLCoordinateSystem,
  scriptPath: './terrain-generator.js'
});

const position = new Vector3(0, 0, 0);

terrain.on('animate', (e) => {
  terrain.update(e.delta, position);
});

scene.add(terrain, new DirectionalLight().translateY(100));

main.createView({ scene, camera, backgroundColor: 'cyan', enabled: false });

document.getElementById('loading').remove();
document.getElementById('info').style.display = 'block';
