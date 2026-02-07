import { useEffect, useRef } from 'react';
import type { Template, PrinterConfig } from '../types';

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
  const svgWidth = parseFloat(svgElement.getAttribute('width') || '384');
  const padding = 20; // 20px padding on each side
  const maxTextWidth = svgWidth - (padding * 2);

  // Update text elements with new values and adjust font size
  Object.entries(textFields).forEach(([id, value]) => {
    const textElement = svgDoc.getElementById(id) as SVGTextElement;
    if (!textElement) return;

    // Get original font size
    const originalFontSize = parseFloat(textElement.getAttribute('font-size') || '32');
    let adjustedFontSize = originalFontSize;

    // Check if it's a multi-line text (has tspan children)
    const tspans = textElement.querySelectorAll('tspan');
    if (tspans.length > 0) {
      // Multi-line: split value by newlines and update tspans
      const lines = value.split('\n');
      
      // Find the longest line
      let maxLineLength = 0;
      let longestLine = '';
      lines.forEach(line => {
        if (line.length > maxLineLength) {
          maxLineLength = line.length;
          longestLine = line;
        }
      });

      // Calculate required font size based on longest line
      if (longestLine) {
        adjustedFontSize = calculateFontSize(
          longestLine,
          maxTextWidth,
          originalFontSize,
          textElement
        );
      }

      // Update font size
      textElement.setAttribute('font-size', adjustedFontSize.toString());

      // Get the first tspan's y position and x position to use as baseline
      const firstTspan = tspans[0];
      const baseY = parseFloat(firstTspan.getAttribute('y') || '100');
      const baseX = firstTspan.getAttribute('x') || '192';
      
      // Store the style attribute from the first tspan to preserve formatting
      const tspanStyle = firstTspan.getAttribute('style') || '';
      
      // Calculate original line spacing from the first two tspans
      let lineHeight = originalFontSize * 1.25; // fallback based on original font size
      if (tspans.length > 1) {
        const firstY = parseFloat(tspans[0].getAttribute('y') || '0');
        const secondY = parseFloat(tspans[1].getAttribute('y') || '0');
        lineHeight = secondY - firstY; // Use original spacing as-is
      }

      // Remove all existing tspans
      tspans.forEach(tspan => tspan.remove());

      // Create new tspans for all lines
      lines.forEach((line, index) => {
        const tspan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan.textContent = line;
        
        // Set absolute y position for each line
        const yPosition = baseY + (index * lineHeight);
        tspan.setAttribute('y', yPosition.toString());
        
        // Use consistent x position for all lines
        tspan.setAttribute('x', baseX);
        
        // Preserve the original style attributes for proper alignment
        if (tspanStyle) {
          tspan.setAttribute('style', tspanStyle);
        }
        
        textElement.appendChild(tspan);
      });
    } else {
      // Single-line: update text and calculate font size
      const text = value || '';
      adjustedFontSize = calculateFontSize(
        text,
        maxTextWidth,
        originalFontSize,
        textElement
      );
      
      textElement.setAttribute('font-size', adjustedFontSize.toString());
      textElement.textContent = text;
    }
  });

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

// Helper function to calculate appropriate font size for text width
const calculateFontSize = (
  text: string,
  maxWidth: number,
  originalFontSize: number,
  textElement: SVGTextElement
): number => {
  if (!text) return originalFontSize;

  // Create a temporary SVG to measure text width
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);

  const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tempText.textContent = text;
  
  // Copy relevant attributes
  const fontFamily = textElement.getAttribute('font-family') || 'sans-serif';
  const fontWeight = textElement.getAttribute('font-weight') || 'normal';
  
  tempText.setAttribute('font-family', fontFamily);
  tempText.setAttribute('font-weight', fontWeight);
  tempText.setAttribute('font-size', originalFontSize.toString());
  
  svg.appendChild(tempText);

  // Measure text width at original font size
  let bbox = tempText.getBBox();
  let currentWidth = bbox.width;
  let fontSize = originalFontSize;

  // If text fits, return original size
  if (currentWidth <= maxWidth) {
    document.body.removeChild(svg);
    return originalFontSize;
  }

  // Binary search for appropriate font size
  let minSize = 8;
  let maxSize = originalFontSize;
  
  while (maxSize - minSize > 0.5) {
    fontSize = (minSize + maxSize) / 2;
    tempText.setAttribute('font-size', fontSize.toString());
    bbox = tempText.getBBox();
    currentWidth = bbox.width;

    if (currentWidth > maxWidth) {
      maxSize = fontSize;
    } else {
      minSize = fontSize;
    }
  }

  document.body.removeChild(svg);
  return Math.floor(minSize);
};


