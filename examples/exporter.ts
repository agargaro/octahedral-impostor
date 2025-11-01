import { load, Main } from '@three.ez/main';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { createTextureAtlas } from '../src/index.js';
import { exportTextureFromRenderTarget } from '../src/utils/exportTextureFromRenderTarget.js';

const main = new Main();

const gltf = await load(GLTFLoader, 'tree.glb');
const mesh = gltf.scene;

const { renderTarget } = createTextureAtlas({
  renderer: main.renderer,
  target: mesh,
  useHemiOctahedron: true,
  spritesPerSide: 12,
  textureSize: 2048
});

exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo', 0);
exportTextureFromRenderTarget(main.renderer, renderTarget, 'normalDepth', 1);
