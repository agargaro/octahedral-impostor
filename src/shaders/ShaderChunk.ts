import { ShaderChunk } from 'three';
import octahedron_utils from './chunks/octahedron_utils.glsl.js';
import project_vertex from './chunks/project_vertex.glsl.js';
import sprite_utils from './chunks/sprite_utils.glsl.js';
import uniforms from './chunks/uniforms.glsl.js';
import varyings from './chunks/varyings.glsl.js';
import vertex from './chunks/vertex.glsl.js';

ShaderChunk['ez_octa_octahedron_utils'] = octahedron_utils;
ShaderChunk['ez_octa_project_vertex'] = project_vertex;
ShaderChunk['ez_octa_sprite_utils'] = sprite_utils;
ShaderChunk['ez_octa_uniforms'] = uniforms;
ShaderChunk['ez_octa_varyings'] = varyings;
ShaderChunk['ez_octa_vertex'] = vertex;
