import type { Template, PrinterConfig } from '../types';
import { renderTemplateToCanvas } from './renderTemplateToCanvas';

/**
 * Render a template with the given field values and print it, sharing the
 * exact render+print sequence used by both CSV batch printing and MQTT live
 * printing so the two input paths can't drift apart.
 */
export const printTemplateWithValues = async (
  template: Template,
  fieldValues: Record<string, string>,
  printerConfig: PrinterConfig,
  hiddenFields: Record<string, boolean>,
  printImage: (canvas: HTMLCanvasElement, config: PrinterConfig) => Promise<void>
): Promise<void> => {
  const canvas = await renderTemplateToCanvas(template, fieldValues, printerConfig, hiddenFields);
  await printImage(canvas, printerConfig);
};
