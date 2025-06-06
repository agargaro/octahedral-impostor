import { MeshDepthMaterial, NoColorSpace, Object3D, OrthographicCamera, Sphere, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { computeObjectBoundingSphere } from './computeObjectBoundingSphere.js';
import { hemiOctaGridToDir, octaGridToDir } from './octahedronUtils.js';

// TODO: convert to MeshBasicMaterial or create custoom shader
// TODO: fix empty pixel? (example 2048 / 6 = 341.33 pixel) set clear color
// TODO: rename parameters
// TODO: handle transparency if no clear color?
// TODO: pack depth in the alpha channel?
// TODO: use ColorRapresentation instead of Color

type OldRendererData = { renderTarget: WebGLRenderTarget; oldPixelRatio: number; oldScissorTest: boolean; oldClearAlpha: number };

/**
 * Parameters used to generate a texture atlas from a 3D object.
 * The atlas is created by rendering multiple views of the object arranged in a grid.
 */
export interface CreateTextureAtlasParams {
  /**
   * The WebGL renderer used to render the object from multiple directions.
   */
  renderer: WebGLRenderer;
  /**
   * Whether to use a hemispherical octahedral projection instead of a full octahedral one.
   * Use this to generate views covering only the upper hemisphere of the object.
   */
  useHemiOctahedron: boolean;
  /**
   * The 3D object to render from multiple directions.
   * Typically a `Mesh`, `Group`, or any `Object3D` hierarchy.
   */
  target: Object3D;
  /**
   * The full size (in pixels) of the resulting square texture atlas.
   * For example, 2048 will result in a 2048×2048 texture.
   * @default 2048
   */
  textureSize?: number;
  /**
   * Number of sprite cells per side of the atlas grid.
   * For example, 16 will result in 16×16 = 256 unique views.
   * @default 16
   */
  spritesPerSide?: number;
  /**
   * A multiplier applied to the camera's distance from the object's bounding sphere.
   * Controls how far the camera is placed from the object when rendering each view.
   * @default 1
   */
  cameraFactor?: number;
}

const camera = new OrthographicCamera();
const bSphere = new Sphere();
const oldScissor = new Vector4();
const oldViewport = new Vector4();
const coords = new Vector2();

export function createAlbedo(params: CreateTextureAtlasParams): WebGLRenderTarget {
  return create(params);
}

export function createDepthMap(params: CreateTextureAtlasParams): WebGLRenderTarget {
  const { target } = params;
  // const oldParent = target.parent;
  // const scene = new Scene(); // se è già scena è diiverso.. inoltre cacha questo oggetto

  return create(params, () => {
    // target.parent = scene;
    // target.overrideMaterial = new MeshNormalMaterial(); // custom shader per avere anche depth (deve usare la normalMap se c'è già)
    (target as any).overrideMaterial = new MeshDepthMaterial(); // custom shader per avere anche depth (deve usare la normalMap se c'è già)
  }, () => {
    (target as any).overrideMaterial = null;
    // target.parent = oldParent;
  });
}

function create(params: CreateTextureAtlasParams, onBeforeRender?: () => void, onAfterRender?: () => void): WebGLRenderTarget {
  const { renderer, target, useHemiOctahedron } = params;

  if (!renderer) throw new Error('"renderer" is mandatory.');
  if (!target) throw new Error('"target" is mandatory.');
  if (useHemiOctahedron == null) throw new Error('"useHemiOctahedron" is mandatory.');

  const atlasSize = params.textureSize ?? 2048;
  const countPerSide = params.spritesPerSide ?? 16;
  const countPerSideMinusOne = countPerSide - 1;
  const spriteSize = atlasSize / countPerSide;

  computeObjectBoundingSphere(target, bSphere, true); // TODO optiona flag for the last 'true'

  const cameraFactor = params.cameraFactor ?? 1;
  updateCamera();

  const { renderTarget, oldPixelRatio, oldScissorTest, oldClearAlpha } = setupRenderer();
  if (onBeforeRender) onBeforeRender();

  for (let row = 0; row < countPerSide; row++) {
    for (let col = 0; col < countPerSide; col++) {
      renderView(col, row);
    }
  }

  if (onAfterRender) onAfterRender();
  restoreRenderer();

  return renderTarget;

  function renderView(col: number, row: number): void {
    coords.set(col / (countPerSideMinusOne), row / (countPerSideMinusOne));

    if (useHemiOctahedron) hemiOctaGridToDir(coords, camera.position);
    else octaGridToDir(coords, camera.position);

    camera.position.setLength(bSphere.radius * cameraFactor).add(bSphere.center);
    camera.lookAt(bSphere.center);

    const xOffset = (col / countPerSide) * atlasSize;
    const yOffset = (row / countPerSide) * atlasSize;
    renderer.setViewport(xOffset, yOffset, spriteSize, spriteSize);
    renderer.setScissor(xOffset, yOffset, spriteSize, spriteSize);
    renderer.render(target, camera);
  }

  function updateCamera(): void {
    camera.left = -bSphere.radius;
    camera.right = bSphere.radius;
    camera.top = bSphere.radius;
    camera.bottom = -bSphere.radius;

    camera.zoom = cameraFactor;
    camera.near = 0.001;
    camera.far = bSphere.radius * 2 + 0.001;

    camera.updateProjectionMatrix();
  }

  // TODO questo diventa inutile ora, rivedere
  function setupRenderer(): OldRendererData {
    const oldPixelRatio = renderer.getPixelRatio();
    const oldScissorTest = renderer.getScissorTest();
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.getScissor(oldScissor);
    renderer.getViewport(oldViewport);

    const renderTarget = new WebGLRenderTarget(atlasSize, atlasSize, { colorSpace: NoColorSpace }); // TODO confirm these parameters and reuse same renderTarget
    renderer.setRenderTarget(renderTarget);
    renderer.setScissorTest(true);
    renderer.setPixelRatio(1);
    renderer.setClearAlpha(0);

    return { renderTarget, oldPixelRatio, oldScissorTest, oldClearAlpha };
  }

  function restoreRenderer(): void {
    renderer.setRenderTarget(null);
    renderer.setScissorTest(oldScissorTest);
    renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
    renderer.setScissor(oldScissor.x, oldScissor.y, oldScissor.z, oldScissor.w);
    renderer.setPixelRatio(oldPixelRatio);
    renderer.setClearAlpha(oldClearAlpha);
  }
}
