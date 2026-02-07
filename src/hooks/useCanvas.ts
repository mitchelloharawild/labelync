import { useEffect, useRef } from 'react';
import type { FormData } from '../types';

const mmToPx = (mm: number): number => mm * 203 / 25.4;

export const useCanvas = (formData: FormData) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const widthPx = mmToPx(formData.width);
    const heightPx = mmToPx(formData.height);

    canvas.width = widthPx;
    canvas.height = heightPx;

    // Clear and draw white background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw uploaded image if present
    if (formData.image) {
      drawImage(ctx, canvas, formData.image);
    }

    // Draw QR code
    if (formData.qrText.trim()) {
      drawQRCode(ctx, canvas, formData.qrText);
    }

    // Draw date
    if (formData.useDate && formData.date) {
      drawDate(ctx, canvas, formData.date);
    }

    // Draw centered text
    if (formData.centeredText.trim()) {
      drawCenteredText(ctx, canvas, formData.centeredText, formData.qrText.trim() !== '');
    }
  }, [formData]);

  return canvasRef;
};

const drawImage = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, file: File): void => {
  const img = new Image();
  const reader = new FileReader();

  reader.onload = (event) => {
    if (!event.target?.result) return;
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Check if already black and white
      let isBlackAndWhite = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] !== data[i + 1] || data[i] !== data[i + 2]) {
          isBlackAndWhite = false;
          break;
        }
      }

      if (!isBlackAndWhite) {
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
      }

      ctx.putImageData(imageData, 0, 0);
    };
    img.src = event.target.result as string;
  };

  reader.readAsDataURL(file);
};

const drawQRCode = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string): void => {
  const qrSize = 0.5 * canvas.height;
  
  // Use canvas-based QR code generation
  import('qrcode').then((QRCode) => {
    const qrCanvas = document.createElement('canvas');
    QRCode.toCanvas(qrCanvas, text, {
      width: qrSize,
      margin: 0,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error?: Error | null) => {
      if (!error) {
        ctx.drawImage(qrCanvas, 10, 10, qrSize, qrSize);
      }
    });
  });
};

const drawDate = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, date: string): void => {
  ctx.font = '24px Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.fillText(date, canvas.width - 10, 20);
};

const drawCenteredText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, text: string, hasQRCode: boolean): void => {
  const lines = text.split('\n');
  ctx.font = '32pt Arial';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = 40;
  let centerY = canvas.height / 2 - (lineHeight * (lines.length - 1)) / 2;

  if (hasQRCode) {
    centerY = centerY + canvas.height / 4;
  }

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, centerY + i * lineHeight);
  });
};
