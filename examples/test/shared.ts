import type { BufferGeometry, TypedArray } from 'three';

export type Position = { x: number; y: number; z: number };
export type GenerateChunkGeometryCallback = (x: number, z: number, size: number, segments: number) => BufferGeometry;

// TODO better typing based on type
export interface WorkerData {
  type: typeof init | typeof enqueue | typeof remove | typeof updatePlayerPosition;
  scriptPath?: string;
  size?: number;
  segments?: number;
  chunkId?: string;
  position?: Position;
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
