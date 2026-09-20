// Off-screen template rendering, used by batch printing to render one canvas
// per CSV row without touching the live preview canvas or React state.

import type { Template, PrinterConfig } from '../types';
import { updateSVGTextFields } from './svgTextUtils';
import { getSvgAspectRatio } from './svgAspectRatio';

const mmToPx = (mm: number): number => mm * 203 / 25.4;

/**
 * Render a template with the given field values to a detached canvas,
 * mirroring the live preview pipeline in useCanvas.ts (letterboxed fit +
 * Floyd-Steinberg dithering) so batch-printed labels match what the manual
 * "Print Sticker" button produces. The resulting canvas can be passed
 * straight to usePrinter's printImage.
 */
export const renderTemplateToCanvas = async (
  template: Template,
  textFieldValues: Record<string, string>,
  printerConfig: PrinterConfig,
  hiddenFields: Record<string, boolean> = {}
): Promise<HTMLCanvasElement> => {
  const canvas = document.createElement('canvas');

  const isLandscape = printerConfig.orientation === 'landscape';
  const displayWidth = isLandscape ? printerConfig.paperHeight : printerConfig.paperWidth;
  const displayHeight = isLandscape ? printerConfig.paperWidth : printerConfig.paperHeight;

  canvas.width = mmToPx(displayWidth);
  canvas.height = mmToPx(displayHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(template.svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) {
    throw new Error('Template SVG is invalid');
  }

  Object.entries(hiddenFields).forEach(([fieldId, isHidden]) => {
    if (isHidden) {
      const element = svgDoc.getElementById(fieldId);
      if (element) {
        element.style.display = 'none';
      }
    }
  });

  // Reuse the same field update logic (text, date, QR, barcode, image) as
  // the manual print/preview path.
  await updateSVGTextFields(svgDoc, textFieldValues, template.fieldMetadata);

  const serializer = new XMLSerializer();
  const updatedSvgString = serializer.serializeToString(svgDoc);

  const img = new Image();
  const blob = new Blob([updatedSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to render template SVG'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }

  // Fit the template into the canvas preserving its aspect ratio (letterbox)
  // instead of stretching, matching the live preview's aspect-ratio safety.
  const templateRatio = getSvgAspectRatio(template.svgContent) ?? (img.naturalWidth / img.naturalHeight);
  const canvasRatio = canvas.width / canvas.height;

  let drawWidth = canvas.width;
  let drawHeight = canvas.height;
  if (templateRatio > canvasRatio) {
    drawHeight = canvas.width / templateRatio;
  } else if (templateRatio < canvasRatio) {
    drawWidth = canvas.height * templateRatio;
  }
  const offsetX = (canvas.width - drawWidth) / 2;
  const offsetY = (canvas.height - drawHeight) / 2;

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  // Floyd-Steinberg dithering to black and white, matching the live preview.
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const oldPixel = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const newPixel = oldPixel < 128 ? 0 : 255;
    const quantError = oldPixel - newPixel;

    data[i] = data[i + 1] = data[i + 2] = newPixel;

    if (i + 4 < data.length) data[i + 4] += quantError * 7 / 16;
    if (i + canvas.width * 4 - 4 < data.length) data[i + canvas.width * 4 - 4] += quantError * 3 / 16;
    if (i + canvas.width * 4 < data.length) data[i + canvas.width * 4] += quantError * 5 / 16;
    if (i + canvas.width * 4 + 4 < data.length) data[i + canvas.width * 4 + 4] += quantError * 1 / 16;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
};
