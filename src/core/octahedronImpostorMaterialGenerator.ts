import { DoubleSide, Material, Texture, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { createAlbedo, createDepthMap, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';

export class OctahedronImpostorMaterialGenerator<M extends typeof Material> {
  public readonly material: InstanceType<M>;
  public albedo: Texture = null;
  public depthMap: Texture = null;
  protected _albedoRT: WebGLRenderTarget = null;
  protected _depthMapRT: WebGLRenderTarget = null;
  protected _spritesPerSide: number = null;

  constructor(materialType: M) {
    const material = new materialType();
    material.transparent = true;
    material.depthWrite = false;
    material.side = DoubleSide; // TODO REMOVE
    this.material = material as InstanceType<M>;
  }

  public load(albedo: Texture, depthMap: Texture, spritesPerSide: number): InstanceType<M> {
    this.albedo = albedo;
    this.depthMap = depthMap;
    this._spritesPerSide = spritesPerSide;
    return this.material;
  }

  public create(renderer: WebGLRenderer, options: CreateTextureAtlasParams): InstanceType<M> {
    this._albedoRT = createAlbedo(renderer, options);
    this._depthMapRT = createDepthMap(renderer, options);
    this._spritesPerSide = options.spritesPerSide;
    this.albedo = this._albedoRT.texture;
    this.depthMap = this._depthMapRT.texture;
    this.patchMaterial();
    return this.material;
  }

  // public exportAlbedo(fileName: string): void {
  //   if (!this._albedoRT) throw new Error('Cannot export a texture passed as parameter.');
  //   exportTextureFromRenderTarget(this._albedoRT, fileName);
  // }

  // public exportDepthMap(fileName: string): void {
  //   if (!this._depthMapRT) throw new Error('Cannot export a texture passed as parameter.');
  //   exportTextureFromRenderTarget(this._depthMapRT, fileName);
  // }

  protected patchMaterial(): void {
    // TODO fix if onBeforeCompile already exists

    this.material.onBeforeCompile = (parameters) => {
      parameters.uniforms.spritesPerSide = { value: new Vector2(this._spritesPerSide, this._spritesPerSide) }; // TODO put in the shader without using uniform

      parameters.uniforms.albedo = { value: this.albedo };
      parameters.uniforms.depthMap = { value: this.depthMap };
      parameters.uniforms.depthScale = { value: 1 };

      parameters.vertexShader = parameters.vertexShader.replace('void main() {', `
          #include <ez_octa_uniforms>
          #include <ez_octa_varyings>
          #include <ez_octa_octahedron_utils>
          #include <ez_octa_sprite_utils>
    
          void main() {
            #include <ez_octa_vertex>
        `);

      parameters.vertexShader = parameters.vertexShader.replace('#include <project_vertex>', `
          #include <ez_octa_project_vertex>
          #include <project_vertex>
        `);

      parameters.fragmentShader = parameters.fragmentShader.replace('void main() {', `
          #include <ez_octa_uniforms>
          #include <ez_octa_varyings>
    
          void main() {
        `);

      parameters.fragmentShader = parameters.fragmentShader.replace('#include <map_fragment>', `
          float tileSize = 1.0 / spritesPerSide.x;
  
          vec4 quad_a = texture2D(albedo, (vUv + vFrame1) * tileSize);
          vec4 quad_b = texture2D(albedo, (vUv + vFrame2) * tileSize);
          vec4 quad_c = texture2D(albedo, (vUv + vFrame3) * tileSize);
          
          vec4 blendedColor = quad_a * vSpritesWeight.x + quad_b * vSpritesWeight.y + quad_c * vSpritesWeight.z;
          
          if (blendedColor.a == 0.0) discard;
          diffuseColor *= blendedColor;
        `);
    };
  }
}
