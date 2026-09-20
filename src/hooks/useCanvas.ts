import { useEffect, useRef } from 'react';
import type { Template, PrinterConfig } from '../types';
import { updateSVGTextFields } from '../utils/svgTextUtils';
import { getSvgAspectRatio } from '../utils/svgAspectRatio';

const mmToPx = (mm: number): number => mm * 203 / 25.4;

export const useCanvas = (
  template: Template,
  textFieldValues: Record<string, string>,
  printerConfig: PrinterConfig,
  hiddenFields: Record<string, boolean>
) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Apply orientation to preview dimensions
    const isLandscape = printerConfig.orientation === 'landscape';
    const displayWidth = isLandscape ? printerConfig.paperHeight : printerConfig.paperWidth;
    const displayHeight = isLandscape ? printerConfig.paperWidth : printerConfig.paperHeight;
    
    const widthPx = mmToPx(displayWidth);
    const heightPx = mmToPx(displayHeight);

    canvas.width = widthPx;
    canvas.height = heightPx;

    // Clear and draw white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw SVG template (async)
    drawSVGTemplate(ctx, canvas, template, textFieldValues, hiddenFields);
  }, [template, textFieldValues, printerConfig, hiddenFields]);

  return canvasRef;
};

const drawSVGTemplate = async (
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  template: Template,
  textFields: Record<string, string>,
  hiddenFields: Record<string, boolean>
): Promise<void> => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(template.svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  
  if (!svgElement) return;

  // Hide elements marked as hidden
  Object.entries(hiddenFields).forEach(([fieldId, isHidden]) => {
    if (isHidden) {
      const element = svgDoc.getElementById(fieldId);
      if (element) {
        element.style.display = 'none';
      }
    }
  });

  // Update text elements using async utility (supports QR codes, dates, etc.)
  await updateSVGTextFields(svgDoc, textFields, template.fieldMetadata);

  // Serialize the updated SVG
  const serializer = new XMLSerializer();
  const updatedSvgString = serializer.serializeToString(svgDoc);

  // Convert SVG to image and draw on canvas
  const img = new Image();
  const blob = new Blob([updatedSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    // Fit the template into the canvas preserving its aspect ratio (letterbox)
    // instead of stretching it to fill, which would distort the label if the
    // template's viewBox ratio doesn't match the configured paper size.
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
    URL.revokeObjectURL(url);

    // Apply dithering to convert to black and white
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Floyd-Steinberg Dithering
    for (let i = 0; i < data.length; i += 4) {
      let oldPixel = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const newPixel = oldPixel < 128 ? 0 : 255;
      const quantError = oldPixel - newPixel;

      data[i] = data[i + 1] = data[i + 2] = newPixel;

      if (i + 4 < data.length) data[i + 4] += quantError * 7 / 16;
      if (i + canvas.width * 4 - 4 < data.length) data[i + canvas.width * 4 - 4] += quantError * 3 / 16;
      if (i + canvas.width * 4 < data.length) data[i + canvas.width * 4] += quantError * 5 / 16;
      if (i + canvas.width * 4 + 4 < data.length) data[i + canvas.width * 4 + 4] += quantError * 1 / 16;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  img.src = url;
};


