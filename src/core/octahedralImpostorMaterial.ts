import { IUniform, ShaderMaterial, Texture } from 'three';
import fragmentShader from '../shaders/fragment.glsl';
import vertexShader from '../shaders/vertex.glsl';

export type OctahedralImpostorDefines = 'EZ_USE_HEMI_OCTAHEDRON' | 'EZ_USE_NORMAL' | 'EZ_USE_ORM' | 'EZ_TRANSPARENT';
export type UniformValue<T> = T extends IUniform<infer U> ? U : never;

export interface OctahedralImpostorUniforms {
  spritesPerSide: IUniform<number>;
  albedo: IUniform<Texture>;
  normalDepthMap: IUniform<Texture>;
  ormMap?: IUniform<Texture>;
  parallaxScale: IUniform<number>;
  alphaClamp: IUniform<number>;
}

export interface OctahedralImpostorMaterialParameters {
  spritesPerSide: number;
  useHemiOctaheron: boolean;
  albedo: Texture;
  normalDepthMap: Texture;
  ormMap?: Texture;
  transparent?: boolean;
  parallaxScale?: number;
  alphaClamp?: number;
  // opaqueBlending?: boolean; TODO
  // borderClamp?: boolean; TODO
}

export class OctahedralImpostorMaterial extends ShaderMaterial {
  public override readonly type = 'OctahedralImpostorMaterial';
  public override uniforms: OctahedralImpostorUniforms & { [key: string]: IUniform };
  public override vertexShader = vertexShader;
  public override fragmentShader = fragmentShader;
  public readonly isOctahedralImpostorMaterial = true;
  protected _useHemiOctaheron: boolean;
  protected _transparent: boolean;

  public get spritesPerSide(): number { return this.uniforms.spritesPerSide.value; }
  public set spritesPerSide(value) { this.setUniform('spritesPerSide', value); }

  public get useHemiOctaheron(): boolean { return this._useHemiOctaheron; }
  public set useHemiOctaheron(value) {
    this._useHemiOctaheron = value;
    this.updateDefines(value, 'EZ_USE_HEMI_OCTAHEDRON');
  }

  public get albedo(): Texture { return this.uniforms.albedo.value; }
  public set albedo(texture) { this.setUniform('albedo', texture); }

  public get normalDepthMap(): Texture { return this.uniforms.normalDepthMap.value; }
  public set normalDepthMap(texture) {
    this.setUniform('normalDepthMap', texture);
    // this.updateDefines(texture?.format === RGBAFormat, 'EZ_USE_NORMAL'); TODO when we'll pack the normal map and depth map
  }

  public get ormMap(): Texture { return this.uniforms.ormMap.value; }
  public set ormMap(texture) {
    this.setUniform('ormMap', texture);
    this.updateDefines(texture, 'EZ_USE_ORM');
  }

  // @ts-expect-error: It's defined as a property in class, but is overridden here as an accessor.
  public override get transparent(): boolean { return this._transparent; }
  public override set transparent(value) {
    this._transparent = value;
    this.depthWrite = !value;
    this.updateDefines(value, 'EZ_TRANSPARENT');
  }

  public get parallaxScale(): number { return this.uniforms.parallaxScale.value; }
  public set parallaxScale(value) { this.setUniform('parallaxScale', value); }

  public get alphaClamp(): number { return this.uniforms.alphaClamp.value; }
  public set alphaClamp(value) { this.setUniform('alphaClamp', value); }

  constructor(parameters: OctahedralImpostorMaterialParameters) {
    if (!parameters) throw new Error('OctahedralImpostorMaterial: parameters is required.');
    if (!parameters.spritesPerSide) throw new Error('OctahedralImpostorMaterial: spritesPerSide is required.');
    if (!parameters.useHemiOctaheron) throw new Error('OctahedralImpostorMaterial: useHemiOctaheron is required.');
    if (!parameters.albedo) throw new Error('OctahedralImpostorMaterial: albedo is required.');
    if (!parameters.normalDepthMap) throw new Error('OctahedralImpostorMaterial: normalDepthMap is required.');

    super();

    this.spritesPerSide = parameters.spritesPerSide;
    this.useHemiOctaheron = parameters.useHemiOctaheron;
    this.albedo = parameters.albedo;
    this.normalDepthMap = parameters.normalDepthMap;
    this.ormMap = parameters.ormMap;
    this.transparent = parameters.transparent ?? false;
    this.parallaxScale = parameters.parallaxScale ?? 0.15;
    this.alphaClamp = parameters.alphaClamp ?? 0.5;
  }

  protected setUniform<T extends keyof OctahedralImpostorUniforms>(key: T, value: UniformValue<OctahedralImpostorUniforms[T]>): void {
    if (!this.uniforms) return;

    if (!this.uniforms[key]) {
      this.uniforms[key] = { value } as IUniform;
      return;
    }

    this.uniforms[key].value = value;
  }

  protected updateDefines(value: unknown, key: OctahedralImpostorDefines): void {
    if (!this.defines) return;

    this.needsUpdate = true;
    if (value) this.defines[key] = '';
    else delete this.defines[key];
  }
}
