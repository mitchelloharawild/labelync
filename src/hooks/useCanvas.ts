import { useEffect, useRef } from 'react';
import type { Template, PrinterConfig } from '../types';
import { updateSVGTextFields } from '../utils/svgTextUtils';

const mmToPx = (mm: number): number => mm * 203 / 25.4;

export const useCanvas = (
  template: Template,
  textFieldValues: Record<string, string>,
  printerConfig: PrinterConfig
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

    // Draw SVG template
    drawSVGTemplate(ctx, canvas, template.svgContent, textFieldValues);
  }, [template, textFieldValues, printerConfig]);

  return canvasRef;
};

const drawSVGTemplate = (
  ctx: CanvasRenderingContext2D, 
  canvas: HTMLCanvasElement, 
  svgTemplate: string, 
  textFields: Record<string, string>
): void => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgTemplate, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  
  if (!svgElement) return;

  // Get SVG dimensions
  const widthAttr = svgElement.getAttribute('width') || '384';
  let svgWidth: number;
  
  // If width contains non-numeric characters (like 'cm', 'mm', etc.), use viewBox instead
  if (widthAttr.match(/[a-z]/i)) {
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const viewBoxValues = viewBox.split(/\s+/);
      svgWidth = parseFloat(viewBoxValues[2]) || 384;
    } else {
      svgWidth = 384;
    }
  } else {
    svgWidth = parseFloat(widthAttr);
  }
  
  const padding = 20; // 20px padding on each side
  const maxTextWidth = svgWidth - (padding * 2);

  // Update text elements using shared utility
  updateSVGTextFields(svgDoc, textFields, maxTextWidth);

  // Serialize the updated SVG
  const serializer = new XMLSerializer();
  const updatedSvgString = serializer.serializeToString(svgDoc);

  // Convert SVG to image and draw on canvas
  const img = new Image();
  const blob = new Blob([updatedSvgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  img.onload = () => {
    // Draw SVG to fill the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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


