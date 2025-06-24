import { IUniform, Material } from 'three';
import shaderChunkMapFragment from '../shaders/impostor/octahedral_impostor_shader_map_fragment.glsl';
import shaderChunkNormalFragmentBegin from '../shaders/impostor/octahedral_impostor_shader_normal_fragment_begin.glsl';
import shaderChunkParamsFragment from '../shaders/impostor/octahedral_impostor_shader_params_fragment.glsl';
import shaderChunkParamsVertex from '../shaders/impostor/octahedral_impostor_shader_params_vertex.glsl';
import shaderChunkVertex from '../shaders/impostor/octahedral_impostor_shader_vertex.glsl';
import { createTextureAtlas, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';

export type OctahedralImpostorDefinesKeys = 'EZ_USE_HEMI_OCTAHEDRON' | 'EZ_USE_NORMAL' | 'EZ_USE_ORM' | 'EZ_TRANSPARENT' | 'EZ_BLEND_SPRITES';
export type OctahedralImpostorDefines = { [key in OctahedralImpostorDefinesKeys]?: boolean };

export type UniformValue<T> = T extends IUniform<infer U> ? U : never;
export type MaterialConstructor<T extends Material> = new () => T;

export interface OctahedralImpostorUniforms {
  spritesPerSide: IUniform<number>;
  // albedo: IUniform<Texture>;
  // normalDepthMap: IUniform<Texture>;
  // ormMap: IUniform<Texture>;
  parallaxScale: IUniform<number>;
  alphaClamp: IUniform<number>;
}

export interface CreateOctahedralImpostor<T extends Material> extends OctahedralImpostorMaterial, CreateTextureAtlasParams {
  baseType: MaterialConstructor<T>;
}

export interface OctahedralImpostorMaterial {
  transparent?: boolean;
  blendSprites?: boolean;
  parallaxScale?: number;
  alphaClamp?: number;
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
  if (parameters.blendSprites) material.ezImpostorDefines.EZ_BLEND_SPRITES = true;
  material.ezImpostorDefines.EZ_USE_NORMAL = true; // TODO only if lights
  // material.ezImpostorDefines.EZ_USE_ORM = true; // TODO only if lights

  material.ezImpostorUniforms = {
    spritesPerSide: { value: parameters.spritesPerSide ?? 16 }, // TODO config default value
    // albedo: { value: albedo },
    // normalDepthMap: { value: normalDepth }, // TODO only if lights
    // ormMap: { value: null },
    parallaxScale: { value: parameters.parallaxScale ?? 0.1 },
    alphaClamp: { value: parameters.alphaClamp ?? 0.5 }
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

    shader.fragmentShader = shader.fragmentShader
      .replace('#include <clipping_planes_pars_fragment>', shaderChunkParamsFragment)
      .replace('#include <normal_fragment_begin>', shaderChunkNormalFragmentBegin)
      .replace('#include <normal_fragment_maps>', '// #include <normal_fragment_maps>')
      .replace('#include <map_fragment>', shaderChunkMapFragment);

    onBeforeCompileBase?.call(material, shader, renderer);
  };

  const customProgramCacheKeyBase = material.customProgramCacheKey;

  material.customProgramCacheKey = () => {
    const hemiOcta = material.ezImpostorDefines.EZ_USE_HEMI_OCTAHEDRON;
    const useNormal = material.ezImpostorDefines.EZ_USE_NORMAL;
    const useOrm = material.ezImpostorDefines.EZ_USE_ORM;
    const blendSprites = material.ezImpostorDefines.EZ_BLEND_SPRITES;

    return `ez_${hemiOcta}_${material.transparent}_${useNormal}_${useOrm}_${blendSprites}_${customProgramCacheKeyBase.call(material)}`;
  };
}

// export class OctahedralImpostorMaterial extends ShaderMaterial {

//   public get spritesPerSide(): number { return this.uniforms.spritesPerSide.value; }
//   public set spritesPerSide(value) { this.setUniform('spritesPerSide', value); }

//   public get useHemiOctahedron(): boolean { return this._useHemiOctahedron; }
//   public set useHemiOctahedron(value) {
//     this._useHemiOctahedron = value;
//     this.updateDefines(value, 'EZ_USE_HEMI_OCTAHEDRON');
//   }

//   public get albedo(): Texture { return this.uniforms.albedo.value; }
//   public set albedo(texture) { this.setUniform('albedo', texture); }

//   public get normalDepthMap(): Texture { return this.uniforms.normalDepthMap.value; }
//   public set normalDepthMap(texture) {
//     this.setUniform('normalDepthMap', texture);
//     // this.updateDefines(texture?.format === RGBAFormat, 'EZ_USE_NORMAL'); TODO when we'll pack the normal map and depth map
//   }

//   public get ormMap(): Texture { return this.uniforms.ormMap.value; }
//   public set ormMap(texture) {
//     this.setUniform('ormMap', texture);
//     this.updateDefines(texture, 'EZ_USE_ORM');
//   }

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
