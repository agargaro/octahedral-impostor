import { simplifyGeometry } from '@three.ez/simplify-geometry';
import { BufferGeometry } from 'three';
import { enqueue, GenerateChunkGeometryCallback, init, LODCount, Position, remove, updatePlayerPosition, WorkerData as WorkerRequest, WorkerResponse } from './shared.js';

// TODO: use array only instead
// TODO: add LOD levels count parameter
// TODO: add declare for generateChunkGeometry function
// TODO: implement better performance Queue
// TODO: send only N messages per frame

const queue: string[] = [];

let generateChunkGeometry: GenerateChunkGeometryCallback | null = null;
let size: number | null = null;
let segments: number | null = null;

let isRunning = true;

onmessage = async function (e) {
  const data = e.data as WorkerRequest;

  switch (data.type) {
    case init:
      _init(data.scriptPath, data.size, data.segments);
      return;
    case enqueue:
      _enqueue(data.chunkId);
      return;
    case remove:
      _remove(data.chunkId);
      return;
    case updatePlayerPosition:
      _updatePlayerPosition(data.position);
      return;
  }
};

async function _init(scriptPath: string, _size: number, _segments: number): Promise<void> {
  const module = await import(scriptPath);
  generateChunkGeometry = module.generateChunkGeometry;

  if (generateChunkGeometry === undefined) {
    throw new Error('generateChunkGeometry function is not defined in the script.');
  }

  size = _size;
  segments = _segments;

  isRunning = false;
  update();
}

async function _enqueue(chunkId: string): Promise<void> {
  queue.push(chunkId);
  update();
}

function _remove(chunkId: string): void {
  const index = queue.indexOf(chunkId);
  if (index !== -1) {
    queue.splice(index, 1);
  }
}

function _updatePlayerPosition(position: Position): void {
  // Handle player position update logic here
}

async function update(): Promise<void> {
  if (isRunning) return;

  isRunning = true;

  while (queue.length > 0) {
    const chunkId = queue.shift();
    await process(chunkId);
  }

  isRunning = false;
}

async function process(chunkId: string): Promise<void> {
  const { x, z } = decodeId(chunkId);
  const geometries: BufferGeometry[] = [];

  const geometry = generateChunkGeometry(x, z, size, segments);

  for (let i = 0; i < LODCount; i++) {
    geometries.push(await simplifyGeometry(geometries[i - 1] ?? geometry, { ratio: 0.5, lockBorder: true }));
  }

  postMessage({
    chunkId,
    position: geometry.attributes.position.array,
    normal: geometry.attributes.normal.array,
    indexes: geometries.map((x) => x.index.array)
  } satisfies WorkerResponse);
}

function decodeId(id: string): { x: number; z: number } {
  const parts = id.split('_');
  return { x: parseInt(parts[0]), z: parseInt(parts[1]) };
}
