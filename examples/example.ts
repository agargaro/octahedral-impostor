import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { createAlbedo } from '../src/utils/createTextureAtlas.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = 0.2; // TODO improve if this is 0
controls.update();

// const geometry = await Asset.load<BufferGeometry>(BufferGeometryLoader, 'https://threejs.org/examples/models/json/suzanne_buffergeometry.json');
// geometry.computeVertexNormals();
// const mesh = new Mesh(geometry, new MeshLambertMaterial());

const gltf = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
const mesh = gltf.scene;

scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

const countPerSide = 8;

const albedoRenderTarget = createAlbedo({
  renderer: main.renderer,
  target: scene,
  useHemiOctahedron: true,
  usePerspectiveCamera: false,
  countPerSide,
  size: 2048
});

const albedo = albedoRenderTarget.texture;

const planeSprite = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: albedo })).translateX(2).translateY(0.9);
planeSprite.scale.multiplyScalar(2);
scene.add(planeSprite);

mesh.scale.divideScalar(4);
mesh.on('animate', (e) => mesh.rotation.y += e.delta * 0.5);
planeSprite.on('animate', (e) => planeSprite.rotation.y += e.delta * 0.5);

// use this to download albedo: exportTextureFromRenderTarget(main.renderer, albedoRenderTarget, 'albedo');

main.createView({ scene, camera: mainCamera, backgroundColor: 'black' });

planeSprite.material.onBeforeCompile = (p, renderer) => {
  p.uniforms.countPerSide = { value: countPerSide }; // TODO put in the shader without using uniform

  p.vertexShader = p.vertexShader.replace('void main() {', `
      uniform float countPerSide;
      varying vec4 framesWeight;
      flat varying vec2 frame1;
      flat varying vec2 frame2;
      flat varying vec2 frame3;  
    
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

      mat3 lookAt(vec3 eye) {
          vec3 z = normalize(eye);
          vec3 up = vec3(0, 1, 0);
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

      void main() {
          vec2 framesMinusOne = vec2(countPerSide - 1.);
          float tileSize = 1. / countPerSide;

          vec3 cameraDir = normalize((inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz);

          vec2 grid = hemiOctaDirToGrid(cameraDir);
          grid = clamp((grid - (1. / countPerSide / 2.)) * countPerSide, vec2(0), framesMinusOne);
          vec2 gridFloor = floor(grid);
          vec2 gridFract = fract(grid);

          framesWeight = computeFramesWeight(gridFract);

          frame1 = floor(gridFloor);
          frame2 = clamp(frame1 + mix(vec2(0, 1), vec2(1, 0), framesWeight.w), vec2(0), framesMinusOne);
          frame3 = clamp(frame1 + vec2(1), vec2(0,0), framesMinusOne);

          vec3 spriteNormal1 = hemiOctaGridToDir(frame1 * tileSize);
          vec3 spriteNormal2 = hemiOctaGridToDir(frame2 * tileSize);
          vec3 spriteNormal3 = hemiOctaGridToDir(frame3 * tileSize);
          vec3 spriteNormal = normalize(spriteNormal1 * framesWeight.x + spriteNormal2 * framesWeight.y + spriteNormal3 * framesWeight.z);
    `);

  p.vertexShader = p.vertexShader.replace('#include <project_vertex>', `
      mat3 axisLockMatrix = inverse(lookAt(spriteNormal));
      transformed *= axisLockMatrix; 
      #include <project_vertex>
    `);

  p.fragmentShader = p.fragmentShader.replace('void main() {', `
      uniform float countPerSide;
      varying vec4 framesWeight;
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
      
      vec4 blendedColor = quad_a * framesWeight.x + quad_b * framesWeight.y + quad_c * framesWeight.z;

      if (blendedColor.r == 0. && blendedColor.g == 0. && blendedColor.b == 0.) discard;
      diffuseColor *= blendedColor;
    `);
};
