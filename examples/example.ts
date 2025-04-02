import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { HemisphereLight, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';

const mainCamera = new OrthographicCameraAuto(6).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2.1;
controls.update();

// const geometry = await Asset.load<BufferGeometry>(BufferGeometryLoader, 'https://threejs.org/examples/models/json/suzanne_buffergeometry.json');
// geometry.computeVertexNormals();
// const mesh = new Mesh(geometry, new MeshLambertMaterial());

const gltf = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
const mesh = gltf.scene;

scene.add(mesh, new HemisphereLight('white', 'gray'));

const countPerSide = 16;

const albedo = createAlbedo({
  renderer: main.renderer,
  target: scene,
  useHemiOctahedron: true,
  usePerspectiveCamera: false,
  countPerSide,
  size: 4096
}).texture;

mesh.scale.divideScalar(5);

const planeSprite = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: albedo })).translateX(2).translateY(0.9);
planeSprite.scale.multiplyScalar(2);
scene.add(planeSprite);

main.createView({ scene, camera: mainCamera, backgroundColor: 'black' });

planeSprite.material.onBeforeCompile = (p, renderer) => {
  p.uniforms.countPerSide = { value: countPerSide }; // TODO put in the shader without using uniform

  p.vertexShader = p.vertexShader.replace('void main() {', `
      vec2 hemiOctaDirToGrid(vec3 dir) {
        vec3 octant = sign(dir);
        float sum = dot(dir, octant);
        vec3 octahedron = dir / sum;    
        return vec2(1. + octahedron.x + octahedron.z, 1. + octahedron.z - octahedron.x) * vec2(0.5);
      }

      vec3 hemiOctaGridToDir(vec2 grid) {
        vec3 position = vec3(grid.x - grid.y, 0, -1. + grid.x + grid.y);
        position.y = 1. - abs(position.x) - abs(position.z);
        return position;
      }

      mat3 lookAtOrigin(vec3 eye) {
          vec3 z = normalize(eye);
          vec3 up = vec3(0, 1, 0);
          // if (abs(dot(up, z)) > 0.999) up = vec3(1, 0, 0); // TODO fix
          vec3 x = normalize(cross(up, z));
          vec3 y = cross(z, x);
          return mat3(x, y, z);
      }
      
      vec4 computeFramesWeight(vec2 coords) {
          float a = min(1. - coords.x, 1. - coords.y);
          float b = abs(coords.x - coords.y);
          float c = min(coords.x, coords.y);
          float d = ceil(coords.x - coords.y);
          return vec4(a, b, c, d);
      }

      uniform float countPerSide;
      varying vec4 frames_weight;
      flat varying vec2 frame1;
      flat varying vec2 frame2;
      flat varying vec2 frame3;

      void main() {
          vec2 framesMinusOne = vec2(countPerSide - 1.);
          float tileSize = 1. / countPerSide;

          vec4 uvNormal = vec4(0, 0, 1, 0) * viewMatrix;
          vec2 grid = hemiOctaDirToGrid(uvNormal.xyz);

          grid *= framesMinusOne;
          grid = clamp(grid, vec2(0), framesMinusOne);

          // grid = clamp((grid - (1. / countPerSide / 2.)) * countPerSide, vec2(0), framesMinusOne);

          vec2 gridFloor = min(floor(grid), framesMinusOne);
          vec2 gridFract = fract(grid);

          frames_weight = computeFramesWeight(gridFract);

          frame1 = floor(gridFloor);
          frame2 = clamp(frame1 + mix(vec2(0, 1), vec2(1, 0), frames_weight.w), vec2(0), framesMinusOne);
          frame3 = clamp(frame1 + vec2(1), vec2(0,0), framesMinusOne);

          vec3 spriteNormal1 = hemiOctaGridToDir(frame1 * tileSize);
          vec3 spriteNormal2 = hemiOctaGridToDir(frame2 * tileSize);
          vec3 spriteNormal3 = hemiOctaGridToDir(frame3 * tileSize);

          vec3 spriteNormal = normalize(spriteNormal1 * frames_weight.x + spriteNormal2 * frames_weight.y + spriteNormal3 * frames_weight.z);
    `);

  p.vertexShader = p.vertexShader.replace('#include <project_vertex>', `
      mat3 axisLockMatrix = inverse(lookAtOrigin(spriteNormal));
      transformed *= axisLockMatrix; 
      #include <project_vertex>
    `);

  p.fragmentShader = p.fragmentShader.replace('void main() {', `
      uniform float countPerSide;
      varying vec4 frames_weight;
      flat varying vec2 frame1;
      flat varying vec2 frame2;
      flat varying vec2 frame3;
      
      void main() {
    `);

  p.fragmentShader = p.fragmentShader.replace('#include <map_fragment>', `
      float tileSize = 1. / countPerSide;
      
      vec4 quad_a = texture2D(map, (vMapUv + frame1) * tileSize);
      vec4 quad_b = texture2D(map, (vMapUv + frame2) * tileSize);
      vec4 quad_c = texture2D(map, (vMapUv + frame3) * tileSize);
      
      vec4 blendedColor = quad_a * frames_weight.x + quad_b * frames_weight.y + quad_c * frames_weight.z;
      // vec4 blendedColor = quad_a;

      if (blendedColor.r == 0. && blendedColor.g == 0. && blendedColor.b == 0.) discard;
      diffuseColor *= blendedColor;
    `);
};
