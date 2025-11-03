import { IUniform, Material, Matrix4 } from 'three';
import shaderChunkMapFragment from '../shaders/impostor/octahedral_impostor_shader_map_fragment.glsl';
import shaderChunkNormalFragmentBegin from '../shaders/impostor/octahedral_impostor_shader_normal_fragment_begin.glsl';
import shaderChunkParamsFragment from '../shaders/impostor/octahedral_impostor_shader_params_fragment.glsl';
import shaderChunkParamsVertex from '../shaders/impostor/octahedral_impostor_shader_params_vertex.glsl';
import shaderChunkVertex from '../shaders/impostor/octahedral_impostor_shader_vertex.glsl';
import { createTextureAtlas, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';

// TODO: fix normal from top
// TODO: use not standard normalMap uniform
// TODO: use define to avoid paralax mapping if useless

export type OctahedralImpostorDefinesKeys = 'EZ_USE_HEMI_OCTAHEDRON' | 'EZ_USE_NORMAL' | 'EZ_USE_ORM' | 'EZ_TRANSPARENT';
export type OctahedralImpostorDefines = { [key in OctahedralImpostorDefinesKeys]?: boolean };

export type UniformValue<T> = T extends IUniform<infer U> ? U : never;
export type MaterialConstructor<T extends Material> = new () => T;

export interface OctahedralImpostorUniforms {
  spritesPerSide: IUniform<number>;
  // ormMap: IUniform<Texture>;
  // parallaxScale: IUniform<number>;
  alphaClamp: IUniform<number>;
  impostorTransform: IUniform<Matrix4>;
}

export interface CreateOctahedralImpostor<T extends Material> extends OctahedralImpostorMaterial, CreateTextureAtlasParams {
  baseType: MaterialConstructor<T>;
}

export interface OctahedralImpostorMaterial {
  transparent?: boolean;
  // parallaxScale?: number;
  alphaClamp?: number;
  transform?: Matrix4;
}

declare module 'three' {
  interface Material extends OctahedralImpostorMaterial {
    isOctahedralImpostorMaterial: boolean;
    ezImpostorUniforms?: OctahedralImpostorUniforms;
    ezImpostorDefines?: OctahedralImpostorDefines;
  }
}

export function createOctahedralImpostorMaterial<T extends Material>(parameters: CreateOctahedralImpostor<T>): T {
  if (!parameters) throw new Error('createOctahedralImpostorMaterial: parameters is required.');
  if (!parameters.baseType) throw new Error('createOctahedralImpostorMaterial: baseType is required.');
  if (!parameters.useHemiOctahedron) throw new Error('createOctahedralImpostorMaterial: useHemiOctahedron is required.');

  const { albedo, normalDepth } = createTextureAtlas(parameters); // TODO normal only if lights

  const material = new parameters.baseType();
  material.isOctahedralImpostorMaterial = true;
  material.transparent = parameters.transparent ?? false;
  (material as any).map = albedo; // TODO remove any
  (material as any).normalMap = normalDepth; // TODO only if lights

  material.ezImpostorDefines = {};

  if (parameters.useHemiOctahedron) material.ezImpostorDefines.EZ_USE_HEMI_OCTAHEDRON = true;
  if (parameters.transparent) material.ezImpostorDefines.EZ_TRANSPARENT = true;
  material.ezImpostorDefines.EZ_USE_NORMAL = true; // TODO only if lights
  // material.ezImpostorDefines.EZ_USE_ORM = true; // TODO only if lights

  const { transform, spritesPerSide, alphaClamp } = parameters;

  material.ezImpostorUniforms = {
    spritesPerSide: { value: spritesPerSide ?? 16 }, // TODO config default value
    // ormMap: { value: null },
    // parallaxScale: { value: parallaxScale ?? 0 },
    alphaClamp: { value: alphaClamp ?? 0.4 },
    impostorTransform: { value: transform }
  };

  overrideMaterialCompilation(material);

  return material;
}

function overrideMaterialCompilation(material: Material): void {
  const onBeforeCompileBase = material.onBeforeCompile;

  material.onBeforeCompile = (shader, renderer) => {
    shader.defines = { ...shader.defines, ...material.ezImpostorDefines };
    shader.uniforms = { ...shader.uniforms, ...material.ezImpostorUniforms };

    shader.vertexShader = shader.vertexShader
      .replace('#include <clipping_planes_pars_vertex>', shaderChunkParamsVertex)
      .replace('#include <project_vertex>', shaderChunkVertex);

    // TODO improve
    shader.fragmentShader = shader.fragmentShader
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', `${shaderChunkMapFragment}\n vec4 diffuseColor = vec4( diffuse, opacity );`)
      .replace('#include <clipping_planes_pars_fragment>', shaderChunkParamsFragment)
      .replace('#include <normal_fragment_begin>', shaderChunkNormalFragmentBegin)
      .replace('#include <normal_fragment_maps>', '// #include <normal_fragment_maps>')
      .replace('#include <map_fragment>', 'diffuseColor *= blendedColor;'); // todo separate file

    onBeforeCompileBase?.call(material, shader, renderer);
  };

  const customProgramCacheKeyBase = material.customProgramCacheKey;

  material.customProgramCacheKey = () => {
    const hemiOcta = !!material.ezImpostorDefines.EZ_USE_HEMI_OCTAHEDRON;
    const useNormal = !!material.ezImpostorDefines.EZ_USE_NORMAL;
    const useOrm = !!material.ezImpostorDefines.EZ_USE_ORM;
    const transparent = !!material.transparent;

    return `ez_${hemiOcta}_${transparent}_${useNormal}_${useOrm}_${customProgramCacheKeyBase.call(material)}`;
  };
}

// export class OctahedralImpostorMaterial extends ShaderMaterial {

//   // @ts-expect-error: It's defined as a property in class, but is overridden here as an accessor.
//   public override get transparent(): boolean { return this._transparent; }
//   public override set transparent(value) {
//     this._transparent = value;
//     this.depthWrite = !value;
//     this.updateDefines(value, 'EZ_TRANSPARENT');
//   }

//   public get parallaxScale(): number { return this.uniforms.parallaxScale.value; }
//   public set parallaxScale(value) { this.setUniform('parallaxScale', value); }

//   public get alphaClamp(): number { return this.uniforms.alphaClamp.value; }
//   public set alphaClamp(value) { this.setUniform('alphaClamp', value); }

//   protected setUniform<T extends keyof OctahedralImpostorUniforms>(key: T, value: UniformValue<OctahedralImpostorUniforms[T]>): void {
//     if (!this.uniforms) return;

//     if (!this.uniforms[key]) {
//       this.uniforms[key] = { value } as IUniform;
//       return;
//     }

//     this.uniforms[key].value = value;
//   }

//   protected updateDefines(value: unknown, key: OctahedralImpostorDefines): void {
//     if (!this.defines) return;

//     this.needsUpdate = true;
//     if (value) this.defines[key] = '';
//     else delete this.defines[key];
//   }

//   // @ts-expect-error Property 'clone' is not assignable to the same property in base type 'ShaderMaterial'.
//   public override clone(): OctahedralImpostorMaterial {
//     return new OctahedralImpostorMaterial({
//       spritesPerSide: this.spritesPerSide,
//       useHemiOctahedron: this.useHemiOctahedron,
//       albedo: this.albedo,
//       normalDepthMap: this.normalDepthMap,
//       ormMap: this.ormMap,
//       transparent: this.transparent,
//       parallaxScale: this.parallaxScale,
//       alphaClamp: this.alphaClamp
//     });
//   }
// }
