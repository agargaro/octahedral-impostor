import { createRadixSort, extendBatchedMeshPrototype } from '@three.ez/batched-mesh-extensions';
import { BatchedMesh, BufferAttribute, CoordinateSystem, DynamicDrawUsage, Material, Matrix4, PlaneGeometry, TypedArray, Vector3 } from 'three';
import { enqueue, init, remove, WorkerData, WorkerResponse } from './shared.js';

// INFO: instanceId and geometryId are the same

// TODO: better LOD optimization if after first simplifcation the appearance error is too low
// TODO: preserve some chunks to avoid to recalculate them
// TODO: add distance check to calculate chunks near player before
// TODO: uv are always equals for each geometry... can we save a bit of memory?
// TODO use simpler object for position?

extendBatchedMeshPrototype(); // TODO remove

export interface TerrainParams {
  /**
   * The coordinate system used to create the TLAS BVH
   */
  coordinateSystem: CoordinateSystem;
  /**
   * The path to the terrain generation script
   */
  scriptPath: string;
  /**
   * The maximum number of chunks in the X direction
   * @default 23
   */
  maxChunksX?: number;
  /**
   * The maximum number of chunks in the Z direction
   * @default 23
   */
  maxChunksZ?: number;
  /**
   * The size of each chunk
   * @default 128
   */
  chunkSize?: number;
  /**
   * The number of segments in each chunk
   * @default 48
   */
  segments?: number;
  /**
   * The position of the player, used to calculate the chunks to generate
   * @default new Vector3(0, 0, 0)
   */
  playerPosition?: Vector3;
  /**
   * Multiplier to reserve a larger index buffer used for LODs
   * @default 2
   */
  multiplierLODReservedIndex?: number;
  /**
   * The number of workers to use for terrain generation
   * @default 2
   */
  workerCount?: number;
  /**
   * The maximum number of chunks processed per update
   * @default 62
   */
  maxChunkProcessedPerUpdate?: number;
  /**
   * The rate at which the terrain is updated
   * @default 0.25 (4 times per second)
   */
  updateRate?: number;
}

interface ChunkInfo {
  state: typeof queued | typeof ready;
  geometryId: number | null;
  position: TypedArray;
  normal: TypedArray;
  indexes: TypedArray[];
}

const queued = 0;
const ready = 1;

export class Terrain<M extends Material> extends BatchedMesh {
  declare material: M;
  protected readonly _planeGeometryBase: PlaneGeometry;
  protected readonly _chunkSize: number;
  protected readonly _maxChunksX: number;
  protected readonly _maxChunksZ: number;
  protected readonly _segments: number;
  protected readonly _multiplierLODReservedIndex: number;
  protected readonly _map = new Map<string, ChunkInfo>();
  protected readonly _result: string[] = [];
  protected readonly _availableId: number[] = [];
  protected readonly _workers: Worker[] = [];
  protected readonly _workerCount: number;
  protected readonly _maxChunkProcessedPerFrame: number;
  protected readonly _updateRate: number;
  protected readonly _lastPlayerPosition: Vector3;
  protected _lastUpdateTime = 0;
  protected _workerRequestCount = 0;

  constructor(material: M, options: TerrainParams) {
    if (!options.coordinateSystem) throw new Error('coordinateSystem is required');
    if (!options.scriptPath) throw new Error('scriptPath is required');

    const maxChunksX = options.maxChunksX ?? 23;
    const maxChunksZ = options.maxChunksZ ?? 23;
    const segments = options.segments ?? 48;
    const chunkSize = options.chunkSize ?? 128;
    const multiplierLODReservedIndex = options.multiplierLODReservedIndex ?? 2;

    const maxInstanceCount = maxChunksX * maxChunksZ;
    const chunkVertexCount = (segments + 1) ** 2;
    const chunkVertexIndex = (segments * segments) * 6;
    const maxVertexCount = maxInstanceCount * chunkVertexCount;
    const maxIndexCount = maxInstanceCount * chunkVertexIndex * multiplierLODReservedIndex;

    super(maxInstanceCount, maxVertexCount, maxIndexCount, material);

    this._chunkSize = chunkSize;
    this._maxChunksX = maxChunksX;
    this._maxChunksZ = maxChunksZ;
    this._segments = segments;
    this._multiplierLODReservedIndex = multiplierLODReservedIndex;
    this._workerCount = options.workerCount ?? 2;
    this._maxChunkProcessedPerFrame = options.maxChunkProcessedPerUpdate ?? 62;
    this._updateRate = options.updateRate ?? 0.25;
    this._lastPlayerPosition = options.playerPosition?.clone() ?? new Vector3();
    this._planeGeometryBase = new PlaneGeometry(chunkSize, chunkSize, segments, segments);

    this.frustumCulled = false;

    this._workers = this.initWorkers(options.scriptPath);

    this.enqueueAll();

    this.computeBVH(options.coordinateSystem);
    this.customSort = createRadixSort(this as unknown as BatchedMesh);
  }

  protected initWorkers(scriptPath: string): Worker[] {
    const workers: Worker[] = [];
    const count = this._workerCount;
    const segments = this._segments;
    const size = this._chunkSize;
    const position = this._lastPlayerPosition;

    for (let i = 0; i < count; i++) {
      const worker = new Worker(new URL('terrain-worker.js', import.meta.url), { type: 'module' });

      worker.postMessage({ type: init, scriptPath, segments, size, position } satisfies WorkerData);

      worker.onmessage = (event) => {
        // TODO move it in a function
        const { chunkId, position, normal, indexes } = event.data as WorkerResponse;
        const chunkInfo = this._map.get(chunkId);

        chunkInfo.position = position;
        chunkInfo.normal = normal;
        chunkInfo.indexes = indexes;
        chunkInfo.state = ready;

        this._result.push(chunkId);
        // console.log(`Worker ${i} processed chunk ${chunkId}`);
      };

      workers.push(worker);
    }

    return workers;
  }

  protected enqueueAll(): void {
    // TODO add start from origin
    const startX = Math.floor(this._maxChunksX / -2);
    const startZ = Math.floor(this._maxChunksZ / -2);

    for (let x = 0; x < this._maxChunksX; x++) {
      for (let z = 0; z < this._maxChunksZ; z++) {
        this.enqueueChunk(startX + x, startZ + z);
      }
    }
  }

  /**
   * Updates the terrain based on the player's position and the delta time.
   * @param delta The time since the last update.
   * @param position The current position of the player.
   */
  public update(delta: number, position: Vector3): void {
    this._lastUpdateTime += delta;
    if (this._lastUpdateTime < this._updateRate) return;
    this._lastUpdateTime %= this._updateRate;

    // TODO check diff and enqueue chunks

    this._lastPlayerPosition.copy(position);

    // TODO check se ho già callato postMessage con nuova pos

    this.updateChunks();
  }

  protected updateChunks(): void {
    const result = this._result;
    const count = Math.min(this._result.length, this._maxChunkProcessedPerFrame);
    if (count === 0) return;

    const isInitialized = this.geometry.getIndex() !== null;

    for (let i = 0; i < count; i++) {
      const chunkId = result[i];
      this.addChunk(chunkId); // TODO add only if not too far?
    }

    if (this._result.length - count === 0) {
      this._result.length = 0;
    } else {
      this._result.splice(0, count);
    }

    if (!isInitialized) {
      // NOTE: DynamicDrawUsage for position and normal is not working well, so we use it only for indexes
      // const positionAttr = this.geometry.getAttribute('position') as BufferAttribute;
      // const normalAttr = this.geometry.getAttribute('normal') as BufferAttribute;
      // positionAttr.setUsage(DynamicDrawUsage);
      // normalAttr.setUsage(DynamicDrawUsage);

      const indexAttr = this.geometry.getIndex();
      indexAttr.setUsage(DynamicDrawUsage);
    }
  }

  protected enqueueChunk(x: number, z: number): void {
    const chunkId = this.encodeId(x, z);
    if (this._map.has(chunkId)) return;

    this._map.set(chunkId, { geometryId: null, state: queued, position: null, normal: null, indexes: null });

    const workerIndex = this._workerRequestCount++ % this._workers.length;
    this._workers[workerIndex].postMessage({ type: enqueue, chunkId } satisfies WorkerData);
  }

  protected addChunk(chunkId: string): number {
    // TODO check also availableId and edit instead of update
    const chunkSize = this._chunkSize;
    const chunkInfo = this._map.get(chunkId);
    const { x, z } = this.decodeId(chunkId);

    const geometryId = this.addGeometries(chunkInfo.position, chunkInfo.normal, chunkInfo.indexes);
    this.addInstance(geometryId);

    this.setMatrixAt(geometryId, matrix4.setPosition(x * chunkSize, 0, z * chunkSize));

    this.bvh.insert(geometryId);

    // TODO handle better
    chunkInfo.geometryId = geometryId;
    chunkInfo.position = null;
    chunkInfo.normal = null;
    chunkInfo.indexes = null;

    return geometryId;
  }

  protected updateGeometry(chunkId: string, oldChunkId: string): void {
    // TODO
  }

  protected addGeometries(position: TypedArray, normal: TypedArray, indexes: TypedArray[]): number {
    // TODO add logic if available array è possibile

    const tempGeometry = this._planeGeometryBase;
    (tempGeometry.getAttribute('position') as BufferAttribute).array = position;
    (tempGeometry.getAttribute('normal') as BufferAttribute).array = normal;

    const geometryId = this.addGeometry(tempGeometry, -1, tempGeometry.index.count * this._multiplierLODReservedIndex);

    this.addGeometryLOD(geometryId, indexes[0], 100);
    this.addGeometryLOD(geometryId, indexes[1], 300);
    this.addGeometryLOD(geometryId, indexes[2], 800);
    this.addGeometryLOD(geometryId, indexes[3], 1500);

    (tempGeometry.getAttribute('position') as BufferAttribute).array = null;
    (tempGeometry.getAttribute('normal') as BufferAttribute).array = null;

    return geometryId;
  }

  protected removeFromMap(x: number, z: number): void {
    // TODO use it
    const chunkId = this.encodeId(x, z);
    this._map.delete(chunkId);
  }

  protected removeChunk(x: number, z: number): void {
    const chunkId = this.encodeId(x, z);
    const chunkInfo = this._map.get(chunkId);
    if (!chunkInfo) return;

    this._map.delete(chunkId);

    if (chunkInfo.state === queued) {
      for (let i = 0, l = this._workers.length; i < l; i++) {
        this._workers[i].postMessage({ type: remove, chunkId } satisfies WorkerData);
      }
    } else {
      // TODO new part of preserving chunks in a certain distance
      this.removeGeometry(chunkInfo.geometryId);
    }
  }

  protected removeGeometry(geometryId: number): void {
    this.bvh.delete(geometryId);
    this._availableId.push(geometryId);
  }

  protected encodeId(x: number, z: number): string {
    return `${x}_${z}`;
  }

  protected decodeId(id: string): { x: number; z: number } {
    const parts = id.split('_');
    return { x: parseInt(parts[0]), z: parseInt(parts[1]) };
  }
}

const matrix4 = new Matrix4();
