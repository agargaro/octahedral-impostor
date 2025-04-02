import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { DoubleSide, Group, Mesh, MeshBasicMaterial, MeshNormalMaterial, MeshStandardMaterial, PlaneGeometry, PolyhedronGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';

Asset.preload(GLTFLoader, 'tree.gltf');
class Tree extends Group {
  constructor() {
    super();
    const tree = Asset.get<GLTF>('tree.gltf');

    this.scale.divideScalar(2);

    for (const mesh of tree.scene.querySelectorAll('Mesh')) {
      const oldMaterial = (mesh as Mesh).material as MeshStandardMaterial;
      (mesh as Mesh).material = new MeshBasicMaterial({
        map: oldMaterial.map,
        alphaTest: oldMaterial.alphaTest
      });
    }

    this.add(...tree.scene.children);
  }
}

class HemiOctahedronGeometry extends PolyhedronGeometry {
  constructor(radius = 1, detail = 1) {
    const vertices = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, -1];
    const indices = [0, 2, 4, 0, 5, 2, 1, 2, 5, 1, 4, 2];
    super(vertices, indices, radius, detail);
  }
}

class HemiOctahedron extends Group {
  constructor() {
    super();
    const geometry = new HemiOctahedronGeometry(0.5, 3);
    const mesh = new Mesh(geometry, new MeshNormalMaterial({ side: DoubleSide }));
    const wireframe = new Mesh(geometry, new MeshBasicMaterial({ wireframe: true }));
    this.add(mesh, wireframe);
  }
}

class Plane extends Group {
  constructor() {
    super();
    const geometry = new PlaneGeometry(1, 1, 8, 8);
    const mesh = new Mesh(geometry, new MeshBasicMaterial({ color: 'blue' }));
    const wireframe = new Mesh(geometry, new MeshBasicMaterial({ wireframe: true }));
    this.add(mesh, wireframe);
  }
}

await Asset.preloadAllPending();
const main = new Main();
const camera = new OrthographicCameraAuto(30).translateY(30).translateZ(100);
const scene = new Scene();
main.createView({ scene, camera });

const controls = new OrbitControls(camera, main.renderer.domElement);
controls.update();

const hemiOctahedron = new HemiOctahedron().translateX(-1);
const plane = new Plane().translateX(1);
scene.add(hemiOctahedron, plane);
