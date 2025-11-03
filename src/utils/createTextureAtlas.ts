import { GLSL3, IUniform, LinearFilter, LinearMipmapLinearFilter, LinearSRGBColorSpace, Mesh, MeshStandardMaterial, NearestFilter, NearestMipMapNearestFilter, Object3D, ObjectSpaceNormalMap, OrthographicCamera, ShaderMaterial, Sphere, TangentSpaceNormalMap, Texture, UnsignedByteType, Vector2, Vector4, WebGLRenderer, WebGLRenderTarget } from 'three';
import { computeObjectBoundingSphere } from './computeObjectBoundingSphere.js';
import { hemiOctaGridToDir, octaGridToDir } from './octahedronUtils.js';

import fragmentShader from '../shaders/atlas_texture/octahedral_atlas_fragment.glsl';
import vertexShader from '../shaders/atlas_texture/octahedral_atlas_vertex.glsl';

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

export interface TextureAtlas {
  /**
   * The WebGL render target used to render the object from multiple directions.
   */
  renderTarget: WebGLRenderTarget;
  /**
   * The albedo texture containing the rendered views of the object.
   * Each sprite cell contains a unique view from a different direction.
   */
  albedo: Texture;
  /**
   * The normal and depth map texture.
   * Contains normals and depth information for each sprite cell.
   * This can be used for lighting and depth effects.
   */
  normalDepth: Texture;
}

const camera = new OrthographicCamera();
const bSphere = new Sphere();
const oldScissor = new Vector4();
const oldViewport = new Vector4();
const coords = new Vector2();
const userDataMaterialKey = 'ez_originalMaterial';

export function createTextureAtlas(params: CreateTextureAtlasParams): TextureAtlas {
  const { renderer, target, useHemiOctahedron } = params;

  if (!renderer) throw new Error('"renderer" is mandatory.');
  if (!target) throw new Error('"target" is mandatory.');
  if (useHemiOctahedron == null) throw new Error('"useHemiOctahedron" is mandatory.');

  const atlasSize = params.textureSize ?? 2048;
  const countPerSide = params.spritesPerSide ?? 16;
  const countPerSideMinusOne = countPerSide - 1;
  const spriteSize = atlasSize / countPerSide;

  // with some models, the bounding sphere was not accurate so we rercompute it
  computeObjectBoundingSphere(target, bSphere, true);

  const cameraFactor = params.cameraFactor ?? 1;
  updateCamera();

  const { renderTarget, oldPixelRatio, oldScissorTest, oldClearAlpha } = setupRenderer();
  overrideTargetMaterial(target);

  for (let row = 0; row < countPerSide; row++) {
    for (let col = 0; col < countPerSide; col++) {
      renderView(col, row);
    }
  }

  restoreRenderer();
  restoreTargetMaterial(target);

  return {
    renderTarget,
    albedo: renderTarget.textures[0],
    normalDepth: renderTarget.textures[1]
  };

  function overrideTargetMaterial(target: Object3D): void {
    target.traverse((mesh) => {
      if ((mesh as Mesh).material) {
        const material = (mesh as Mesh).material as MeshStandardMaterial | MeshStandardMaterial[];
        mesh.userData[userDataMaterialKey] = material; // TODO use map instead
        const overrideMaterial = Array.isArray(material) ? material.map((mat) => createMaterial(mat)) : createMaterial(material);
        (mesh as Mesh).material = overrideMaterial;
      }
    });
  }

  function createMaterial(material: MeshStandardMaterial): ShaderMaterial {
    const hasMap = !!material.map;
    const hasAlphaMap = !!material.alphaMap;
    const hasNormalMap = !!material.normalMap;
    const hasBumpMap = !!material.bumpMap;
    const hasDisplacementMap = !!material.displacementMap;
    const hasAlphaTest = material.alphaTest > 0;

    const uniforms: { [uniform: string]: IUniform } = {
      diffuse: { value: material.color },
      opacity: { value: material.opacity }
    };

    // From MeshBasicMaterial

    if (hasAlphaTest) {
      uniforms['alphaTest'] = { value: material.alphaTest };
    }

    if (hasMap) {
      uniforms['map'] = { value: material.map };
      uniforms['mapTransform'] = { value: material.map.matrix };
    }

    if (hasAlphaMap) {
      uniforms['alphaMap'] = { value: material.alphaMap };
      uniforms['alphaMapTransform'] = { value: material.alphaMap.matrix };
    }

    // From MeshNormalMaterial and MeshDepthMaterial

    if (hasNormalMap) {
      uniforms['normalMap'] = { value: material.normalMap };
      uniforms['normalScale'] = { value: material.normalScale };
      uniforms['normalMapTransform'] = { value: material.normalMap.matrix };
    }

    if (hasBumpMap) {
      uniforms['bumpMap'] = { value: material.bumpMap };
      uniforms['bumpScale'] = { value: material.bumpScale };
      uniforms['bumpMapTransform'] = { value: material.bumpMap.matrix };
    }

    if (hasDisplacementMap) {
      uniforms['displacementMap'] = { value: material.displacementMap };
      uniforms['displacementScale'] = { value: material.displacementScale };
      uniforms['displacementBias'] = { value: material.displacementBias };
      uniforms['displacementMapTransform'] = { value: material.displacementMap.matrix };
    }

    const defines = {};

    if (hasMap || hasAlphaMap || hasNormalMap || hasBumpMap || hasDisplacementMap) {
      defines['USE_UV'] = '';
    }

    const shaderMaterial = new ShaderMaterial({
      uniforms,
      defines,
      vertexShader,
      fragmentShader,
      glslVersion: GLSL3,
      transparent: material.transparent,
      side: material.side,
      alphaHash: material.alphaHash,
      depthFunc: material.depthFunc,
      depthWrite: material.depthWrite,
      depthTest: material.depthTest,
      blending: material.blending,
      blendSrc: material.blendSrc,
      blendDst: material.blendDst,
      blendEquation: material.blendEquation,
      blendSrcAlpha: material.blendSrcAlpha,
      blendDstAlpha: material.blendDstAlpha,
      blendEquationAlpha: material.blendEquationAlpha,
      premultipliedAlpha: material.premultipliedAlpha,
      alphaToCoverage: material.alphaToCoverage,
      blendAlpha: material.blendAlpha,
      blendColor: material.blendColor,
      colorWrite: material.colorWrite,
      forceSinglePass: material.forceSinglePass,
      vertexColors: material.vertexColors,
      precision: material.precision,
      visible: material.visible
    });

    shaderMaterial.onBeforeCompile = (shader) => {
      if (hasMap) {
        shader.map = true;
        shader.mapUv = 'uv';
      }

      if (hasAlphaMap) {
        shader.alphaMap = true;
        shader.alphaMapUv = 'uv';
      }

      if (hasNormalMap) {
        shader.normalMap = true;
        shader.normalMapUv = 'uv';
        shader.normalMapTangentSpace = material.normalMapType === TangentSpaceNormalMap;
        shader.normalMapObjectSpace = material.normalMapType === ObjectSpaceNormalMap;
      }

      if (hasBumpMap) {
        shader.bumpMap = true;
        shader.bumpMapUv = 'uv';
      }

      if (hasDisplacementMap) {
        shader.displacementMap = true;
        shader.displacementMapUv = 'uv';
      }

      shader.flatShading = material.flatShading;
      shader.alphaTest = hasAlphaTest;
    };

    return shaderMaterial;
  }

  function restoreTargetMaterial(target: Object3D): void {
    target.traverse((mesh) => {
      if (mesh.userData[userDataMaterialKey]) {
        (mesh as Mesh).material = mesh.userData[userDataMaterialKey];
        delete mesh.userData[userDataMaterialKey];
      }
    });
  }

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

  function setupRenderer(): OldRendererData {
    const oldPixelRatio = renderer.getPixelRatio();
    const oldScissorTest = renderer.getScissorTest();
    const oldClearAlpha = renderer.getClearAlpha();
    renderer.getScissor(oldScissor);
    renderer.getViewport(oldViewport);

    const renderTarget = new WebGLRenderTarget(atlasSize, atlasSize, { count: 2, generateMipmaps: true });

    const albedo = 0;
    const normalDepth = 1;

    renderTarget.textures[albedo].minFilter = LinearMipmapLinearFilter;
    renderTarget.textures[albedo].magFilter = LinearFilter;
    renderTarget.textures[albedo].type = UnsignedByteType;
    renderTarget.textures[albedo].colorSpace = LinearSRGBColorSpace;
    // renderTarget.textures[albedo].colorSpace = renderer.outputColorSpace;

    renderTarget.textures[normalDepth].minFilter = NearestMipMapNearestFilter;
    renderTarget.textures[normalDepth].magFilter = NearestFilter;
    renderTarget.textures[normalDepth].type = UnsignedByteType; // because is packed
    // renderTarget.textures[normalDepth].type = HalfFloatType; // TODO parametric
    renderTarget.textures[normalDepth].colorSpace = LinearSRGBColorSpace;

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
