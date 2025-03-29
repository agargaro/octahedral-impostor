import { Box3, NoColorSpace, Object3D, OrthographicCamera, PerspectiveCamera, Sphere, Texture, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { UVtoHemiOctahedron } from './mathUtils.js';

type OldRendererData = { oldPixelRatio: number; oldScissorTest: boolean; renderTarget: WebGLRenderTarget };

export interface CreateTextureAtlasParams {
  renderer: WebGLRenderer;
  target: Object3D;
  isPerspective?: boolean;
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

const uv = new Vector2();

export function createAlbedo(params: CreateTextureAtlasParams): WebGLRenderTarget {
  const { renderer, target, isPerspective } = params;

  if (!renderer) throw new Error('"renderer" is mandatory.');
  if (!target) throw new Error('"target" is mandatory.');

  const size = params.size ?? 2048;
  const countPerSide = params.countPerSide ?? 12;
  const cameraDistanceFactor = params.cameraDistanceFactor ?? 2;
  const camera = isPerspective ? perspectiveCamera : orthographicCamera;

  const count = countPerSide ** 2;
  const sideLength = 1 / countPerSide;
  const halfSideLenght = sideLength / 2;

  bBox.setFromObject(target);
  bBox.getBoundingSphere(bSphere);

  const { oldPixelRatio, oldScissorTest, renderTarget } = setupRenderer();

  for (let i = 0; i < count; i++) {
    renderView(i);
  }

  restoreRenderer();

  return renderTarget;

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

  function renderView(i: number): void {
    uv.set((i % countPerSide) / countPerSide + halfSideLenght, Math.floor(i / countPerSide) / countPerSide + halfSideLenght);
    camera.position.copy(UVtoHemiOctahedron(uv).setLength(bSphere.radius * cameraDistanceFactor)).add(bSphere.center);
    camera.lookAt(bSphere.center);

    const x = (i % countPerSide) / countPerSide * size;
    const y = Math.floor(i / countPerSide) / countPerSide * size;
    renderer.setViewport(x, y, sideLength * size, sideLength * size);
    renderer.setScissor(x, y, sideLength * size, sideLength * size);
    // TOOD alpha or custom color? renderer.setClearColor(Math.random() * 0xffffff);
    renderer.render(target, camera);
  }
}
