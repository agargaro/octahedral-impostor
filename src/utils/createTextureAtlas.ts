import { Camera, NoColorSpace, Object3D, OrthographicCamera, PerspectiveCamera, Sphere, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { computeBoundingSphereFromObject } from './boundingSphere.js';
import { hemiOctaGridToDir, octaGridToDir } from './octahedron.js';

// TODO: convert to MeshBasicMaterial
// TODO: fix empty pixel? (example 2048 / 6 = 341.33 pixel)

type OldRendererData = { oldPixelRatio: number; oldScissorTest: boolean; renderTarget: WebGLRenderTarget };

export interface CreateTextureAtlasParams {
  renderer: WebGLRenderer;
  useHemiOctahedron: boolean;
  usePerspectiveCamera: boolean;
  target: Object3D;
  size?: number;
  countPerSide?: number;
  cameraFactor?: number;
}

const perspectiveCamera = new PerspectiveCamera();
const orthographicCamera = new OrthographicCamera();
const bSphere = new Sphere();
const oldScissor = new Vector4();
const oldViewport = new Vector4();
const coords = new Vector2();

export function createAlbedo(params: CreateTextureAtlasParams): WebGLRenderTarget {
  const { renderer, target, useHemiOctahedron, usePerspectiveCamera } = params;

  if (!renderer) throw new Error('"renderer" is mandatory.');
  if (!target) throw new Error('"target" is mandatory.');
  if (useHemiOctahedron == null) throw new Error('"useHemiOctahedron" is mandatory.');
  if (perspectiveCamera == null) throw new Error('"usePerspectiveCamera" is mandatory.');

  const atlasSize = params.size ?? 2048;
  const countPerSide = params.countPerSide ?? 16;
  const spriteSize = atlasSize / countPerSide;

  computeBoundingSphereFromObject(target, bSphere, true); // TODO optiona flag for the last 'true'

  const cameraFactor = params.cameraFactor ?? 1;
  const camera = getCamera();

  const { oldPixelRatio, oldScissorTest, renderTarget } = setupRenderer();

  for (let row = 0; row < countPerSide; row++) {
    for (let col = 0; col < countPerSide; col++) {
      renderView(col / countPerSide, row / countPerSide);
    }
  }

  restoreRenderer();

  return renderTarget;

  function renderView(gridX: number, gridY: number): void {
    coords.set(gridX, gridY);

    if (useHemiOctahedron) hemiOctaGridToDir(coords, camera.position);
    else octaGridToDir(coords, camera.position);

    camera.position.setLength(bSphere.radius * cameraFactor).add(bSphere.center);
    camera.lookAt(bSphere.center);

    const xOffset = gridX * atlasSize;
    const yOffset = gridY * atlasSize;
    renderer.setViewport(xOffset, yOffset, spriteSize, spriteSize);
    renderer.setScissor(xOffset, yOffset, spriteSize, spriteSize);
    // TOOD alpha or custom color? renderer.setClearColor(Math.random() * 0xffffff);
    renderer.render(target, camera);
  }

  function getCamera(): Camera {
    if (usePerspectiveCamera) {
      // TODO
      return perspectiveCamera;
    }

    orthographicCamera.left = -bSphere.radius;
    orthographicCamera.right = bSphere.radius;
    orthographicCamera.top = bSphere.radius;
    orthographicCamera.bottom = -bSphere.radius;

    orthographicCamera.zoom = cameraFactor;
    orthographicCamera.near = 0.001;
    orthographicCamera.far = bSphere.radius * 2 + 0.001;

    orthographicCamera.updateProjectionMatrix();

    return orthographicCamera;
  }

  function setupRenderer(): OldRendererData {
    const oldPixelRatio = renderer.getPixelRatio();
    const oldScissorTest = renderer.getScissorTest();
    renderer.getScissor(oldScissor);
    renderer.getViewport(oldViewport);

    const renderTarget = new WebGLRenderTarget(atlasSize, atlasSize, { colorSpace: NoColorSpace }); // TODO confirm these parameters and reuse same renderTarget
    renderer.setRenderTarget(renderTarget);
    renderer.setScissorTest(true);
    renderer.setPixelRatio(1);

    return { oldPixelRatio, oldScissorTest, renderTarget };
  }

  function restoreRenderer(): void {
    renderer.setRenderTarget(null);
    renderer.setScissorTest(oldScissorTest);
    renderer.setViewport(oldViewport.x, oldViewport.y, oldViewport.z, oldViewport.w);
    renderer.setScissor(oldScissor.x, oldScissor.y, oldScissor.z, oldScissor.w);
    renderer.setPixelRatio(oldPixelRatio);
  }
}
