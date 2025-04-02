import { Box3, NoColorSpace, Object3D, OrthographicCamera, PerspectiveCamera, Sphere, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { hemiOctahedronGridToDir, octahedronGridToDir } from './mathUtils.js';

type OldRendererData = { oldPixelRatio: number; oldScissorTest: boolean; renderTarget: WebGLRenderTarget };

export interface CreateTextureAtlasParams {
  renderer: WebGLRenderer;
  useHemiOctahedron: boolean;
  usePerspectiveCamera: boolean;
  target: Object3D;
  size?: number;
  countPerSide?: number;
  cameraDistanceFactor?: number;
}

const perspectiveCamera = new PerspectiveCamera();
const orthographicCamera = new OrthographicCamera();
const bBox = new Box3();
const bSphere = new Sphere();
const oldScissor = new Vector4();
const oldViewport = new Vector4();
const coord = new Vector2();

export function createAlbedo(params: CreateTextureAtlasParams): WebGLRenderTarget {
  const { renderer, target, useHemiOctahedron, usePerspectiveCamera } = params;

  if (!renderer) throw new Error('"renderer" is mandatory.');
  if (!target) throw new Error('"target" is mandatory.');
  if (useHemiOctahedron == null) throw new Error('"useHemiOctahedron" is mandatory.');
  if (perspectiveCamera == null) throw new Error('"usePerspectiveCamera" is mandatory.');

  const size = params.size ?? 2048;
  const countPerSide = params.countPerSide ?? 6;
  const side = 1 / countPerSide;
  const cameraDistanceFactor = params.cameraDistanceFactor ?? 2;
  const camera = usePerspectiveCamera ? perspectiveCamera : orthographicCamera;
  const halfSide = side / 2;

  bBox.setFromObject(target);
  bBox.getBoundingSphere(bSphere);

  const { oldPixelRatio, oldScissorTest, renderTarget } = setupRenderer();

  for (let row = 0; row < countPerSide; row++) {
    for (let col = 0; col < countPerSide; col++) {
      renderView(row / countPerSide, col / countPerSide);
    }
  }

  restoreRenderer();

  return renderTarget;

  function renderView(row: number, col: number): void {
    coord.set(col + halfSide, row + halfSide);

    if (useHemiOctahedron) hemiOctahedronGridToDir(coord, camera.position);
    else octahedronGridToDir(coord, camera.position);

    camera.position.setLength(bSphere.radius * cameraDistanceFactor).add(bSphere.center);
    camera.lookAt(bSphere.center);

    const x = col * size;
    const y = row * size;
    renderer.setViewport(x, y, side * size, side * size);
    renderer.setScissor(x, y, side * size, side * size);
    // TOOD alpha or custom color? renderer.setClearColor(Math.random() * 0xffffff);
    renderer.render(target, camera);
  }

  function setupRenderer(): OldRendererData {
    const oldPixelRatio = renderer.getPixelRatio();
    const oldScissorTest = renderer.getScissorTest();
    renderer.getScissor(oldScissor);
    renderer.getViewport(oldViewport);

    const renderTarget = new WebGLRenderTarget(size, size, { colorSpace: NoColorSpace }); // TODO confirm these parameters and reuse same renderTarget
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
