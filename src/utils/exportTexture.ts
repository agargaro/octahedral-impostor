import { WebGLRenderTarget } from 'three';
import { renderer } from './createTextureAtlas.js';

export function exportTextureFromRenderTarget(renderTarget: WebGLRenderTarget, fileName: string): void {
  const width = renderTarget.texture.image.width;
  const height = renderTarget.texture.image.height;
  const readBuffer = new Uint8Array(width * height * 4);

  renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, readBuffer);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(width, height);
  const imageDataArray = imageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dest = (x + y * width) * 4;
      const src = (x + (height - y - 1) * width) * 4; // vertical flip

      // questo ora non serve, se utilizzeremo un clear color servirà invece
      // if (readBuffer[src + 3] === 0) { // empty pixel
      //   imageDataArray[dest] = 0; // TODO this is the clear color
      //   imageDataArray[dest + 1] = 0;
      //   imageDataArray[dest + 2] = 0;
      //   imageDataArray[dest + 3] = 255;
      //   continue;
      // }

      imageDataArray[dest] = readBuffer[src];
      imageDataArray[dest + 1] = readBuffer[src + 1];
      imageDataArray[dest + 2] = readBuffer[src + 2];
      imageDataArray[dest + 3] = readBuffer[src + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const dataURL = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataURL;
  link.download = `${fileName}.png`;
  link.click();
}
