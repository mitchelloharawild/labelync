/**
 * Determine an SVG template's intrinsic aspect ratio (width / height) from its
 * `viewBox` attribute, falling back to explicit `width`/`height` attributes.
 * Returns null when no usable dimensions can be found.
 */
export const getSvgAspectRatio = (svgContent: string): number | null => {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
  const svgElement = svgDoc.querySelector('svg');
  if (!svgElement) return null;

  const viewBox = svgElement.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n)) && parts[2] > 0 && parts[3] > 0) {
      return parts[2] / parts[3];
    }
  }

  const width = parseFloat(svgElement.getAttribute('width') || '');
  const height = parseFloat(svgElement.getAttribute('height') || '');
  if (!isNaN(width) && !isNaN(height) && width > 0 && height > 0) {
    return width / height;
  }

  return null;
};
