import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, Box3, Mesh, MeshStandardMaterial, NoColorSpace, OrthographicCamera, PlaneGeometry, PolyhedronGeometry, Scene, Sphere, Texture, Vector2, Vector3, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';

function PyramidUV(direction) {
  const octant = new Vector3(Math.sign(direction.x), Math.sign(direction.y), Math.sign(direction.z));
  const sum = direction.dot(octant);
  const octahedron = new Vector3().copy(direction).divideScalar(sum);

  return new Vector2(
    (1 + octahedron.x + octahedron.z) * 0.5,
    (1 + octahedron.z - octahedron.x) * 0.5
  );
}

function UVtoOctahedron(uv) {
  const position = new Vector3(2 * (uv.x - 0.5), 0, 2 * (uv.y - 0.5));
  const absolute = new Vector3(Math.abs(position.x), 0, Math.abs(position.z));
  position.y = 1 - absolute.x - absolute.z;
  if (position.y < 0) {
    position.x = Math.sign(position.x) * (1 - absolute.z);
    position.z = Math.sign(position.z) * (1 - absolute.x);
  }

  return position.normalize();
}

function UVtoHemiOctahedron(uv) {
  const position = new Vector3(uv.x - uv.y, 0, -1 + uv.x + uv.y);
  position.y = 1 - Math.abs(position.x) - Math.abs(position.z);
  return position.normalize();
}

class HemiOctahedronGeometry extends PolyhedronGeometry {
  constructor(radius = 0.5, detail = 0) {
    const vertices = [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, -1];
    const indices = [0, 2, 4, 0, 5, 2, 1, 2, 5, 1, 4, 2];
    super(vertices, indices, radius, detail);
  }
}

const mainCamera = new OrthographicCameraAuto(6).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.1;
controls.update();

Asset.load(GLTFLoader, 'https://threejs.org/examples/models/gltf/Soldier.glb').then(model => {

  scene.add(model.scene, new AmbientLight('white', 5));
  const map = createTextureAtlas(main.renderer, 4096, 16);
  const planeSprite = new Mesh(new PlaneGeometry(), new MeshStandardMaterial({ map })).translateX(2).translateY(0.9);
  planeSprite.scale.multiplyScalar(2);
  scene.add(planeSprite);

  main.createView({ scene, camera: mainCamera, backgroundColor: 'white' });

  planeSprite.material.onBeforeCompile = (p, renderer) => {
    p.uniforms.tileSize = { value: 1 / 16 }; // TODO put in the shader without using uniform

    p.vertexShader = p.vertexShader.replace('void main() {', `
      vec2 pyramidUV(vec3 direction) { // TODO use in?
        vec3 octant = sign(direction);
        float sum = dot(direction, octant);
        vec3 octahedron = direction / sum;    
        return 0.5 * vec2(1. + octahedron.x + octahedron.z, 1. + octahedron.z - octahedron.x);
      }

      vec3 pyramidPos(vec2 uv) {
        vec3 position = vec3(uv.x - uv.y, 0, -1. + uv.x + uv.y);
        position.y = 1. - abs(position.x) - abs(position.z);
        return normalize(position);
      }

      mat3 lookAtRotation(vec3 eye, vec3 center, vec3 up) {
          vec3 z = normalize(eye - center);
          vec3 x = normalize(cross(up, z));
          vec3 y = cross(z, x);
          return mat3(x, y, z);
      }

      flat varying vec2 vOffset;
      uniform float tileSize;

      void main() {
          vec4 uvNormal = vec4(0, 0, 1, 0) * viewMatrix;
          vec2 atlasUv = pyramidUV(uvNormal.xyz);
          vOffset = floor(atlasUv / tileSize);
          vec3 spriteNormal = pyramidPos(vOffset * tileSize + tileSize / 2.);
    `);

    p.vertexShader = p.vertexShader.replace('#include <project_vertex>', `
      mat3 axisLockMatrix = inverse(lookAtRotation(spriteNormal, vec3(0, 0, 0), vec3(0, 1, 0)));
      transformed *= axisLockMatrix; 
      #include <project_vertex>
    `);

    p.fragmentShader = p.fragmentShader.replace('void main() {', `
      uniform float tileSize;
      flat varying vec2 vOffset;

      void main() {
    `);

    p.fragmentShader = p.fragmentShader.replace('#include <map_fragment>', `
      vec4 testColor = texture2D(map, vMapUv * tileSize + vOffset * tileSize);
      if (testColor.r == 0. && testColor.g == 0. && testColor.b == 0.) discard;
      diffuseColor *= testColor;
    `);
  };

  function createTextureAtlas(renderer, size, side, distanceFactor = 2) {
    const camera = new OrthographicCamera();
    const uv = new Vector2();
    const count = side ** 2;
    const sideLength = 1 / side;
    const centerfix = sideLength / 2;
    const bBox = new Box3().setFromObject(model.scene);
    const bSphere = bBox.getBoundingSphere(new Sphere());
    const oldScissorTest = renderer.getScissorTest();
    const oldScissor = renderer.getScissor(new Vector4());
    const oldViewport = renderer.getViewport(new Vector4());
    const oldPixelRatio = renderer.getPixelRatio();

    const renderTarget = new WebGLRenderTarget(size, size, { colorSpace: NoColorSpace });
    renderer.setRenderTarget(renderTarget);
    renderer.setScissorTest(true);
    renderer.setPixelRatio(1);

    for (let i = 0; i < count; i++) {
      uv.set((i % side) / side + centerfix, Math.floor(i / side) / side + centerfix);
      camera.position.copy(UVtoHemiOctahedron(uv).setLength(bSphere.radius * distanceFactor)).add(bSphere.center);
      camera.lookAt(bSphere.center);

      const x = (i % side) / side * size;
      const y = Math.floor(i / side) / side * size;
      renderer.setViewport(x, y, sideLength * size, sideLength * size);
      renderer.setScissor(x, y, sideLength * size, sideLength * size);
      // renderer.setClearColor(Math.random() * 0xffffff);
      renderer.render(scene, camera);
    }

    renderer.setRenderTarget(null);
    renderer.setScissorTest(oldScissorTest);
    renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
    renderer.setScissor(oldScissor.x, oldScissor.y, oldScissor.z, oldScissor.w);
    renderer.setPixelRatio(oldPixelRatio);

    return renderTarget.texture;
  }

});
