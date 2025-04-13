import { Material, Texture, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { createAlbedo, createDepthMap, CreateTextureAtlasParams } from '../utils/createTextureAtlas.js';
import { exportTextureFromRenderTarget } from '../utils/exportTexture.js';

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

  public exportAlbedo(renderer: WebGLRenderer, fileName: string): void {
    if (!this._albedoRT) throw new Error('Cannot export a texture passed as parameter.');
    exportTextureFromRenderTarget(renderer, this._albedoRT, fileName);
  }

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
      parameters.uniforms.depthScale = { value: 0.2 };

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
    
          vec4 blendColors(vec2 uv1, vec2 uv2, vec2 uv3)
          {
            vec4 sprite1 = texture2D(albedo, uv1, 0.0);
            vec4 sprite2 = texture2D(albedo, uv2, 0.0);
            vec4 sprite3 = texture2D(albedo, uv3, 0.0);
            return sprite1 * vSpritesWeight.x + sprite2 * vSpritesWeight.y + sprite3 * vSpritesWeight.z;
          }

          vec2 recalculateUV(vec2 uv_f,  vec2 frame, vec2 xy_f, float frame_size, float d_scale)
          {
            uv_f = clamp(uv_f, vec2(0), vec2(1));
            vec2 uv_quad = frame_size * (frame + uv_f);
            vec4 n_depth = 1.0 - texture2D( depthMap, uv_quad, 0.0 );
            uv_f = xy_f * n_depth.r * d_scale + uv_f;
            uv_f = clamp(uv_f, vec2(0), vec2(1));
            uv_f =  frame_size * (frame + uv_f);
            return clamp(uv_f, vec2(0), vec2(1));
          }

          void main() {
        `);

      parameters.fragmentShader = parameters.fragmentShader.replace('#include <map_fragment>', `
          float quad_size = 1.0 / spritesPerSide.x;

          vec2 uv_f1 = recalculateUV(vFrameUv1, vFrame1, vFrameXY1, quad_size, depthScale);
          vec2 uv_f2 = recalculateUV(vFrameUv2, vFrame2, vFrameXY2, quad_size, depthScale);
          vec2 uv_f3 = recalculateUV(vFrameUv3, vFrame3, vFrameXY3, quad_size, depthScale);

          vec4 baseTex = blendColors(uv_f1, uv_f2, uv_f3);
          // vec4 baseTex = blendColors((vFrame1 + vUv) * quad_size, (vFrame2 + vUv) * quad_size, (vFrame3 + vUv) * quad_size);
          
          if (baseTex.a <= 0.5) discard; // TODO add uniform
          diffuseColor *= baseTex;
        `);
    };
  }
}
