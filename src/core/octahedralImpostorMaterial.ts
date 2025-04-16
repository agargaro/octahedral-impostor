import { ShaderMaterial, Texture } from 'three';
import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';

export interface OctahedralImpostorMaterialParameters {
  spritesPerSide: number;
  albedo: Texture;
  normalDepthMap?: Texture;
  ormMap?: Texture;
  transparent?: boolean;
  parallaxScale?: number;
  alphaClamp?: number;
  // transparentBlending?: boolean; TODO
  // borderClamp?: boolean; TODO
}

export class OctahedralImpostorMaterial extends ShaderMaterial {
  public override type = 'OctahedralImpostorMaterial';
  public override vertexShader = vertexShader;
  public override fragmentShader = fragmentShader;
  public isOctahedralImpostorMaterial = true;

  public get albedo(): Texture { return this.uniforms.albedo.value; }
  public set albedo(texture) { this.uniforms.albedo.value = texture; }

  public get normalDepthMap(): Texture { return this.uniforms.normalDepthMap.value; }
  public set normalDepthMap(texture) { this.uniforms.normalDepthMap.value = texture; }

  public get spritesPerSide(): number { return this.uniforms.spritesPerSide.value; }
  public set spritesPerSide(value) { this.uniforms.spritesPerSide.value = value; }

  public get parallaxScale(): number { return this.uniforms.parallaxScale.value; }
  public set parallaxScale(value) { this.uniforms.parallaxScale.value = value; }

  public get alphaClamp(): number { return this.uniforms.alphaClamp.value; }
  public set alphaClamp(value) { this.uniforms.alphaClamp.value = value; }

  constructor(parameters: OctahedralImpostorMaterialParameters) {
    if (!parameters) throw new Error('OctahedralImpostorMaterial: parameters is required.');
    if (!parameters.spritesPerSide) throw new Error('OctahedralImpostorMaterial: spritesPerSide is required.');
    if (!parameters.albedo) throw new Error('OctahedralImpostorMaterial: albedo is required.');

    super();

    if (parameters.transparent) {
      this.transparent = true;
      this.depthWrite = false;
      this.defines.EZ_TRANSPARENT = '';
    }

    this.defines.EZ_USE_HEMI_OCTAHEDRON = '';
    // this.defines.EZ_USE_ORM = ''; // TODO
    // this.defines.EZ_USE_NORMAL = ''; // TODO

    this.uniforms = {
      albedo: { value: parameters.albedo },
      normalDepthMap: { value: parameters.normalDepthMap },
      spritesPerSide: { value: parameters.spritesPerSide },
      parallaxScale: { value: parameters.parallaxScale },
      alphaClamp: { value: parameters.alphaClamp }
    };
  }
}
