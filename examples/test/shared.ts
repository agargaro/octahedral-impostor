import type { BufferGeometry, TypedArray, Vector3 } from 'three';

export type GenerateChunkGeometryCallback = (x: number, z: number, size: number, segments: number) => BufferGeometry;

// TODO better typing based on type
export interface WorkerData {
  type: typeof init | typeof enqueue | typeof remove | typeof updatePlayerPosition;
  scriptPath?: string;
  size?: number;
  segments?: number;
  chunkId?: string;
  position?: Vector3;
}

export interface WorkerResponse {
  chunkId: string;
  position: TypedArray;
  normal: TypedArray;
  indexes: TypedArray[];
}

export const init = 0;
export const enqueue = 1;
export const remove = 2;
export const updatePlayerPosition = 3;

export const LODCount = 4;
