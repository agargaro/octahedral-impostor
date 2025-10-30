import { createRadixSort, extendBatchedMeshPrototype } from '@three.ez/batched-mesh-extensions';
import { simplifyGeometry } from '@three.ez/simplify-geometry';
import { createNoise2D } from 'simplex-noise';
import { BatchedMesh, BufferGeometry, Material, Matrix4, PlaneGeometry, Vector3, WebGLCoordinateSystem } from 'three';

export interface TerrainParams {
  maxChunksX: number;
  maxChunksZ: number;
  chunkSize: number;
  segments: number;
  frequency: number;
  amplitude: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  noiseCallback?: (x: number, y: number) => number;
}

extendBatchedMeshPrototype();

const matrix4 = new Matrix4();
const multiplierLODReservedIndex = 2;
const LODCount = 4;

export class Terrain<M extends Material> extends BatchedMesh {
  declare material: M;
  protected chunkSize: number;
  protected maxChunksX: number;
  protected maxChunksZ: number;
  protected segments: number;
  protected frequency: number;
  protected amplitude: number;
  protected octaves: number;
  protected lacunarity: number;
  protected gain: number;
  protected noiseCallback: (x: number, y: number) => number;

  constructor(material: M, options: TerrainParams) {
    const { maxChunksX, maxChunksZ, segments } = options;

    const maxInstanceCount = maxChunksX * maxChunksZ;
    const chunkVertexCount = (segments + 1) ** 2;
    const chunkVertexIndex = (segments * segments) * 6;
    const maxVertexCount = maxInstanceCount * chunkVertexCount;
    const maxIndexCount = maxInstanceCount * chunkVertexIndex * multiplierLODReservedIndex;

    super(maxInstanceCount, maxVertexCount, maxIndexCount, material);

    this.chunkSize = options.chunkSize;
    this.maxChunksX = maxChunksX;
    this.maxChunksZ = maxChunksZ;
    this.segments = segments;
    this.frequency = options.frequency;
    this.amplitude = options.amplitude;
    this.octaves = options.octaves;
    this.lacunarity = options.lacunarity;
    this.gain = options.gain;
    this.noiseCallback = options.noiseCallback ?? createNoise2D();

    this.computeBVH(WebGLCoordinateSystem); // add manually chunk to the bvh, is not like instancedMesh2
    this.customSort = createRadixSort(this as unknown as BatchedMesh);
  }

  public async addChunk(x: number, z: number): Promise<void> {
    const chunkSize = this.chunkSize;
    const geometry = this.generateChunkGeometry(x * chunkSize, z * chunkSize);

    const geometryId = await this.addGeometries(geometry);

    const instanceId = this.addInstance(geometryId);
    this.setMatrixAt(instanceId, matrix4.setPosition(x * chunkSize, 0, z * chunkSize));

    // this.computeBoundsTree(geometryId); // TODO: ask Garrett if we can compute the bvh of a LOD only
    this.bvh.insert(instanceId);
  }

  protected generateChunkGeometry(x: number, z: number): PlaneGeometry {
    const geometry = new PlaneGeometry(this.chunkSize, this.chunkSize, this.segments, this.segments);
    geometry.rotateX(-Math.PI / 2); // TODO create new plane geometry class to avoid this transformation

    const vertices = geometry.attributes.position.array;
    const octaves = this.octaves;
    let amplitude = this.amplitude;
    let frequency = this.frequency;

    for (let o = 0; o < octaves; o++) {
      for (let i = 0; i < vertices.length; i++) {
        vertices[i * 3 + 1] += this.noiseCallback((vertices[i * 3] + x) * frequency, (vertices[i * 3 + 2] + z) * frequency) * amplitude;
      }

      amplitude *= this.gain;
      frequency *= this.lacunarity;
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    return geometry;
  }

  protected async addGeometries(geometry: PlaneGeometry): Promise<number> {
    const geometryLODs = await this.createLODs(geometry);

    const geometryId = this.addGeometry(geometry, -1, geometry.index.count * multiplierLODReservedIndex);

    this.addGeometryLOD(geometryId, geometryLODs[0], 100);
    this.addGeometryLOD(geometryId, geometryLODs[1], 300);
    this.addGeometryLOD(geometryId, geometryLODs[2], 800);
    this.addGeometryLOD(geometryId, geometryLODs[3], 1500);

    return geometryId;
  }

  protected async createLODs(geometry: BufferGeometry): Promise<BufferGeometry[]> {
    const geometries: BufferGeometry[] = [];

    for (let i = 0; i < LODCount; i++) {
      geometries.push(await simplifyGeometry(geometries[i - 1] ?? geometry, { ratio: 0.5, lockBorder: true }));
    }

    return geometries;
  }

  // move
  public async generateTrees(count: number): Promise<Vector3[]> {
    const octaves = this.octaves;
    const chunkSize = this.chunkSize;
    const halfMaxChunksX = Math.trunc(this.maxChunksX / 2);
    const halfMaxChunksZ = Math.trunc(this.maxChunksZ / 2);

    const positions: Vector3[] = [];

    for (let i = 0; i < count; i++) {
      const x = this.randomRange(-halfMaxChunksX - 0.5, halfMaxChunksX - 0.5);
      const z = this.randomRange(-halfMaxChunksZ - 0.5, halfMaxChunksZ - 0.5);

      let amplitude = this.amplitude;
      let frequency = this.frequency;
      let noiseVal = 0;

      for (let o = 0; o < octaves; o++) {
        noiseVal += this.noiseCallback(x * chunkSize * frequency, z * chunkSize * frequency) * amplitude;
        amplitude *= this.gain;
        frequency *= this.lacunarity;
      }
      // if (noiseVal > -0.5 * this.amplitude && noiseVal < 0.5 * this.amplitude) {
      positions.push(new Vector3(x * chunkSize, noiseVal, z * chunkSize));
      // }
    }

    return positions;
  }

  public randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
