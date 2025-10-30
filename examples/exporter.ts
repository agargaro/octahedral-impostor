import { load, Main } from '@three.ez/main';
import { BufferGeometry, BufferGeometryLoader, Mesh, MeshLambertMaterial, MeshNormalMaterial } from 'three';
import { exportTextureFromRenderTarget } from '../src/utils/exportTextureFromRenderTarget.js';
import { createTextureAtlas, OctahedralImpostor } from '../src/index.js';
import { GLTF, GLTFLoader } from 'three/examples/jsm/Addons.js';

const main = new Main();

load(GLTFLoader, 'tree.glb').then(async (gltf) => {
  const mesh = gltf.scene;
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

  const { renderTarget } = createTextureAtlas({
    renderer: main.renderer,
    target: mesh,
    useHemiOctahedron: true,
    spritesPerSide: 12,
    textureSize: 1024
  });

  exportTextureFromRenderTarget(main.renderer, renderTarget, 'albedo', 0);
});
