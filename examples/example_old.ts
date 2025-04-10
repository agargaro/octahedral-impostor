import { Asset, Main, OrthographicCameraAuto } from '@three.ez/main';
import { AmbientLight, HemisphereLight, Mesh, MeshBasicMaterial, PlaneGeometry, Scene } from 'three';
import { GLTF, GLTFLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import { createAlbedo, createDepthMap } from '../src/utils/createTextureAtlas.js';

const mainCamera = new OrthographicCameraAuto(20).translateZ(100);
const scene = new Scene();
const main = new Main(); // init renderer and other stuff
const controls = new OrbitControls(mainCamera, main.renderer.domElement);
controls.maxPolarAngle = Math.PI / 2;
controls.minPolarAngle = 0.2; // TODO improve if this is 0
controls.update();

const gltf = await Asset.load<GLTF>(GLTFLoader, 'tree.gltf');
const mesh = gltf.scene;

scene.add(mesh, new HemisphereLight('white', 'green'), new AmbientLight());

const countPerSide = 8;

const albedoRenderTarget = createAlbedo({
  target: scene,
  useHemiOctahedron: true,
  usePerspectiveCamera: false,
  spritesPerSide: countPerSide,
  textureSize: 2048
});

const albedo = albedoRenderTarget.texture;

const testRT = createDepthMap({
  target: scene,
  useHemiOctahedron: true,
  usePerspectiveCamera: false,
  spritesPerSide: countPerSide,
  textureSize: 4096
}).texture;

// exportTextureFromRenderTarget(main.renderer, testRT, 'normal');

const planeSprite = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ map: albedo, transparent: true })).translateX(2).translateY(0.9);
planeSprite.scale.multiplyScalar(2);
scene.add(planeSprite);

planeSprite.geometry.computeTangents();

mesh.scale.divideScalar(4);
mesh.on('animate', (e) => mesh.rotation.y += e.delta * 0.5);
planeSprite.on('animate', (e) => planeSprite.rotation.y += e.delta * 0.5);

// use this to download albedo: exportTextureFromRenderTarget(main.renderer, albedoRenderTarget, 'albedo');

main.createView({ scene, camera: mainCamera, backgroundColor: 'cyan' });

planeSprite.material.onBeforeCompile = (p, renderer) => {
  p.uniforms.countPerSide = { value: countPerSide }; // TODO put in the shader without using uniform
  p.uniforms.depthMap = { value: testRT };

  p.vertexShader = p.vertexShader.replace('void main() {', `
      attribute vec3 tangent;
      uniform float countPerSide;
      varying vec4 framesWeight;
      flat varying vec2 frame1;
      flat varying vec2 frame2;
      flat varying vec2 frame3;  
      varying vec3 TangentFragPos;
      varying vec3 TangentViewPos;

      vec2 VecToHemiSphereOct(vec3 pivotToCamera)
      {
        pivotToCamera.y = max(pivotToCamera.y, 0.001);
        pivotToCamera = normalize(pivotToCamera);
        vec3 octant = sign(pivotToCamera);

        float sum = dot(pivotToCamera, octant);
        vec3 octahedron = pivotToCamera / sum;

        return vec2(
        octahedron.x + octahedron.z,
        octahedron.z - octahedron.x);
      }
      
      vec3 OctaHemiSphereEnc(vec2 coord)
      {
        vec3 position = vec3(coord.x - coord.y, 0.0, -1.0 + coord.x + coord.y);
        vec2 absolute = abs(position.xz);
        position.y = 1.0 - absolute.x - absolute.y;
        return position;
      }

      vec3 FrameXYToRay(vec2 frame, vec2 frameCountMinusOne)
      {
        vec2 f = (frame.xy / frameCountMinusOne);
        vec3 vec = OctaHemiSphereEnc(f);
        vec = normalize(vec);
        return vec;
      }

      vec4 computeFramesWeight(vec2 coords) {
          float a = min(1. - coords.x, 1. - coords.y);
          float b = abs(coords.x - coords.y);
          float c = min(coords.x, coords.y);
          float d = ceil(coords.x - coords.y);
          return vec4(a, b, c, d);
      }

      vec3 orientPlaneToDirection(vec3 spriteNormal) {
        vec3 z = normalize(spriteNormal);

        vec3 up = vec3(0, 1, 0);
        if (abs(z.y) > 0.99) {
            up = vec3(1, 0, 0);
        }

        vec3 x = normalize(cross(up, z));
        vec3 y = normalize(cross(z, x));

        return x * position.x + y * position.y;
      }

      mat3 getTBN(vec3 normal) {
          vec3 T_orig = normalize(mat3(modelMatrix) * tangent);
          vec3 N = normalize(mat3(modelMatrix) * normal); // TODO
          vec3 T = normalize(T_orig - dot(T_orig, N) * N); // Ortogonalizza la tangente originale rispetto alla NUOVA normale
          vec3 B = cross(T, N); // Non serve normalize se N e T lo sono e sono ortogonali
          return transpose(mat3(T, B, N));
      }

      void main() {
          vec2 framesMinusOne = vec2(countPerSide - 1.);
          float tileSize = 1. / countPerSide;

          vec3 cameraDir = normalize((inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz);
          // mat3 invRot = transpose(mat3(modelMatrix));
          // vec3 cameraDir = normalize(invRot * (cameraPosition - modelMatrix[3].xyz));

          vec2 grid = VecToHemiSphereOct(cameraDir);
          grid = clamp((grid - (1. / countPerSide / 2.)) * countPerSide, vec2(0), framesMinusOne); // TODO check
          vec2 gridFloor = floor(grid);
          vec2 gridFract = fract(grid);

          framesWeight = computeFramesWeight(gridFract);

          frame1 = floor(gridFloor);
          frame2 = clamp(frame1 + mix(vec2(0, 1), vec2(1, 0), framesWeight.w), vec2(0), framesMinusOne);
          frame3 = clamp(frame1 + vec2(1), vec2(0,0), framesMinusOne);

          vec3 spriteNormal1 = FrameXYToRay(frame1, framesMinusOne);
    `);

  p.vertexShader = p.vertexShader.replace('#include <project_vertex>', `
      transformed = orientPlaneToDirection(spriteNormal1);

      mat3 TBN1 = getTBN(spriteNormal1);
      TangentViewPos  = TBN1 * cameraPosition;
      TangentFragPos  = TBN1 * transformed;

      #include <project_vertex>
    `);

  p.fragmentShader = p.fragmentShader.replace('void main() {', `
      uniform float countPerSide;
      varying vec4 framesWeight;
      flat varying vec2 frame1;
      flat varying vec2 frame2;
      flat varying vec2 frame3;
      varying vec3 TangentFragPos;
      varying vec3 TangentViewPos;

      uniform sampler2D depthMap;

      vec2 parallaxMapping(vec2 uv, vec2 frame, vec3 tangentViewPos, vec3 tangentFragPos) {
        float tileSize = 1. / countPerSide; // TODO param
        float heightScale = 0.0; // TODO

        vec3 viewDir = normalize(tangentViewPos - tangentFragPos);

        float height = 1.0 - texture2D(depthMap, (uv + frame) * tileSize).r; // TOGLI 1 e inverti
        vec2 offset = viewDir.xy / viewDir.z * (height * heightScale);
        return uv - offset;
      }

      void main() {
    `);

  p.fragmentShader = p.fragmentShader.replace('#include <map_fragment>', `
      float tileSize = 1. / countPerSide;

      //vec2 uv = parallaxMapping(vMapUv, frame1, TangentViewPos, TangentFragPos);

      //if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;
      //vec4 quad_a = texture2D(map, (uv + frame1) * tileSize);

      vec4 quad_a = texture2D(map, (vMapUv + frame1) * tileSize);
      vec4 quad_b = texture2D(map, (vMapUv + frame2) * tileSize);
      vec4 quad_c = texture2D(map, (vMapUv + frame3) * tileSize);
      
      vec4 blendedColor = quad_a * framesWeight.x + quad_b * framesWeight.y + quad_c * framesWeight.z;
      // vec4 blendedColor = quad_a;

      if (blendedColor.a == 0.0) discard;
      diffuseColor *= blendedColor;
    `);
};
