// SVG utilities for handling text elements and special field types

import { FieldType, FieldMetadata } from '../types';
import { 
  updateQRCodeElement, 
  updateDateElement, 
  updateImageElement 
} from './fieldRenderers';

export interface TextFieldInfo {
  ids: string[];
  defaults: Record<string, string>;
  metadata: FieldMetadata[];
}

/**
 * Extract field metadata from SVG elements
 */
export const extractFieldMetadata = (element: Element): FieldMetadata => {
  const id = element.getAttribute('id') || '';
  const typeAttr = element.getAttribute('data-field-type');
  
  let type: FieldType;
  if (typeAttr === 'date') {
    type = FieldType.DATE;
  } else if (typeAttr === 'qr') {
    type = FieldType.QR;
  } else if (typeAttr === 'image') {
    type = FieldType.IMAGE;
  } else {
    type = FieldType.TEXT;
  }
  
  const metadata: FieldMetadata = {
    id,
    type,
    label: element.getAttribute('data-label') || undefined,
  };
  
  if (type === FieldType.QR) {
    const qrVersion = element.getAttribute('data-qr-version');
    const qrErrorCorrection = element.getAttribute('data-qr-error-correction');
    metadata.qrVersion = qrVersion || 'auto';
    metadata.qrErrorCorrection = (qrErrorCorrection as 'L' | 'M' | 'Q' | 'H') || 'M';
  }
  
  if (type === FieldType.DATE) {
    metadata.dateFormat = element.getAttribute('data-date-format') || 'YYYY-MM-DD';
  }
  
  if (type === FieldType.IMAGE) {
    const width = element.getAttribute('data-image-width');
    const height = element.getAttribute('data-image-height');
    if (width) metadata.imageWidth = parseInt(width, 10);
    if (height) metadata.imageHeight = parseInt(height, 10);
  }
  
  return metadata;
};

/**
 * Extract text field IDs and their default values from SVG content
 */
export const extractTextFieldIds = (svgContent: string): TextFieldInfo => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const textElements = svgDoc.querySelectorAll('text[id], rect[id], image[id]');
  
  const ids: string[] = [];
  const defaults: Record<string, string> = {};
  const metadata: FieldMetadata[] = [];
  
  textElements.forEach(el => {
    const id = el.getAttribute('id');
    if (id) {
      ids.push(id);
      const fieldMetadata = extractFieldMetadata(el);
      metadata.push(fieldMetadata);
      
      if (fieldMetadata.type === FieldType.DATE) {
        defaults[id] = new Date().toISOString().split('T')[0];
      } else if (fieldMetadata.type === FieldType.QR) {
        defaults[id] = '';
      } else if (fieldMetadata.type === FieldType.IMAGE) {
        defaults[id] = '';
      } else {
        const tspans = el.querySelectorAll('tspan');
        if (tspans.length > 0) {
          const lines: string[] = [];
          tspans.forEach(tspan => {
            lines.push(tspan.textContent || '');
          });
          defaults[id] = lines.join('\n');
        } else {
          defaults[id] = el.textContent || '';
        }
      }
    }
  });
  
  return { ids, defaults, metadata };
};

/**
 * Update text elements in SVG with new values (async version)
 */
export const updateSVGTextFields = async (
  svgDoc: Document,
  textFields: Record<string, string>,
  maxTextWidth: number,
  fieldMetadata?: FieldMetadata[]
): Promise<void> => {
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) return;

  const metadataMap = new Map<string, FieldMetadata>();
  if (fieldMetadata) {
    fieldMetadata.forEach(meta => metadataMap.set(meta.id, meta));
  }

  const updates = Object.entries(textFields).map(async ([id, value]) => {
    const element = svgDoc.getElementById(id);
    if (!element) return;

    const metadata = metadataMap.get(id);
    
    if (metadata) {
      if (metadata.type === FieldType.QR) {
        await updateQRCodeElement(svgDoc, id, value, metadata);
        return;
      } else if (metadata.type === FieldType.DATE) {
        const formattedDate = updateDateElement(svgDoc, id, value, metadata);
        value = formattedDate;
      } else if (metadata.type === FieldType.IMAGE) {
        updateImageElement(svgDoc, id, value, metadata);
        return;
      }
    }

    const textElement = element as SVGTextElement;
    if (textElement.tagName !== 'text') return;

    updateTextElement(svgDoc, textElement, value, maxTextWidth);
  });

  await Promise.all(updates);
};

/**
 * Update a standard text element with value
 */
const updateTextElement = (
  svgDoc: Document,
  textElement: SVGTextElement,
  value: string,
  maxTextWidth: number
): void => {
  const originalFontSize = parseFloat(textElement.getAttribute('font-size') || '32');
  let adjustedFontSize = originalFontSize;

  const dominantBaseline = textElement.getAttribute('dominant-baseline');
  const isMiddleAligned = dominantBaseline === 'middle';

  const tspans = textElement.querySelectorAll('tspan');
  if (tspans.length > 0) {
    const lines = value.split('\n');
    
    let longestLine = '';
    lines.forEach(line => {
      if (line.length > longestLine.length) {
        longestLine = line;
      }
    });

    if (longestLine) {
      adjustedFontSize = calculateFontSize(
        longestLine,
        maxTextWidth,
        originalFontSize,
        textElement
      );
    }

    textElement.setAttribute('font-size', adjustedFontSize.toString());

    const firstTspan = tspans[0];
    const usesDy = firstTspan.hasAttribute('dy');
    const baseX = firstTspan.getAttribute('x') || '192';
    const tspanStyle = firstTspan.getAttribute('style') || '';
    
    let lineSpacing: number;
    
    if (usesDy) {
      if (tspans.length > 1) {
        const firstDy = parseFloat(tspans[1].getAttribute('dy') || '0');
        lineSpacing = firstDy || (adjustedFontSize * 1.25);
      } else {
        lineSpacing = adjustedFontSize * 1.25;
      }
    } else {
      lineSpacing = adjustedFontSize * 1.25;
      if (tspans.length > 1) {
        const firstY = parseFloat(tspans[0].getAttribute('y') || '0');
        const secondY = parseFloat(tspans[1].getAttribute('y') || '0');
        lineSpacing = secondY - firstY;
      }
    }

    let verticalOffset = 0;
    if (isMiddleAligned && lines.length > 1) {
      const totalHeight = (lines.length - 1) * lineSpacing;
      verticalOffset = -totalHeight / 2;
    }

    tspans.forEach(tspan => tspan.remove());

    lines.forEach((line, index) => {
      const tspan = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.textContent = line;
      tspan.setAttribute('x', baseX);
      
      if (usesDy) {
        if (index === 0) {
          tspan.setAttribute('dy', verticalOffset.toString());
        } else {
          tspan.setAttribute('dy', lineSpacing.toString());
        }
      } else {
        const baseY = parseFloat(firstTspan.getAttribute('y') || '100');
        const yPosition = baseY + verticalOffset + (index * lineSpacing);
        tspan.setAttribute('y', yPosition.toString());
      }
      
      if (tspanStyle) {
        tspan.setAttribute('style', tspanStyle);
      }
      
      textElement.appendChild(tspan);
    });
  } else {
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
};

/**
 * Calculate appropriate font size for text width
 */
const calculateFontSize = (
  text: string,
  maxWidth: number,
  originalFontSize: number,
  textElement: SVGTextElement
): number => {
  if (!text) return originalFontSize;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.style.position = 'absolute';
  svg.style.visibility = 'hidden';
  document.body.appendChild(svg);

  const tempText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  tempText.textContent = text;
  
  const fontFamily = textElement.getAttribute('font-family') || 'sans-serif';
  const fontWeight = textElement.getAttribute('font-weight') || 'normal';
  
  tempText.setAttribute('font-family', fontFamily);
  tempText.setAttribute('font-weight', fontWeight);
  tempText.setAttribute('font-size', originalFontSize.toString());
  
  svg.appendChild(tempText);

  let bbox = tempText.getBBox();
  let currentWidth = bbox.width;
  let fontSize = originalFontSize;

  if (currentWidth <= maxWidth) {
    document.body.removeChild(svg);
    return originalFontSize;
  }

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

/**
 * Check if a text field ID is multi-line (has tspans)
 */
export const extractMultiLineFields = (svgContent: string): Set<string> => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const textElements = svgDoc.querySelectorAll('text[id]');
  
  const multiLine = new Set<string>();
  
  textElements.forEach(el => {
    const id = el.getAttribute('id');
    if (id) {
      const tspans = el.querySelectorAll('tspan');
      if (tspans.length > 0) {
        multiLine.add(id);
      }
    }
  });
  
  return multiLine;
};
