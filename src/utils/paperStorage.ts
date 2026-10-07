import type { PaperPreset, ProtocolFamily } from '../types';

const PAPER_PRESETS_KEY = 'labelync_paper_presets';

type PaperSize = Pick<PaperPreset, 'family' | 'paperType' | 'paperWidth' | 'paperHeight'>;

const loadAll = (): PaperPreset[] => {
  try {
    const stored = localStorage.getItem(PAPER_PRESETS_KEY);
    return stored ? JSON.parse(stored) as PaperPreset[] : [];
  } catch (error) {
    console.error('Failed to load paper presets:', error);
    return [];
  }
};

const saveAll = (presets: PaperPreset[]): void => {
  try {
    localStorage.setItem(PAPER_PRESETS_KEY, JSON.stringify(presets));
  } catch (error) {
    console.error('Failed to save paper presets:', error);
  }
};

export const isSamePaperSize = (a: PaperSize, b: PaperSize): boolean =>
  a.family === b.family &&
  a.paperWidth === b.paperWidth &&
  a.paperHeight === b.paperHeight &&
  // Media type isn't configurable for the M02 family, so ignore it there.
  (a.family === 'M02' || a.paperType === b.paperType);

// Presets for a printer family, most recently used first.
export const loadPaperPresets = (family: ProtocolFamily): PaperPreset[] =>
  loadAll()
    .filter(p => p.family === family)
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt);

// Saves a paper size, reusing an existing identical preset rather than
// creating a duplicate. Returns the stored preset.
export const savePaperPreset = (size: PaperSize): PaperPreset => {
  const presets = loadAll();
  const now = Date.now();
  const existing = presets.find(p => isSamePaperSize(p, size));

  if (existing) {
    existing.lastUsedAt = now;
    saveAll(presets);
    return existing;
  }

  const preset: PaperPreset = {
    ...size,
    id: `paper_${now}_${Math.random().toString(36).slice(2, 11)}`,
    createdAt: now,
    lastUsedAt: now
  };
  presets.push(preset);
  saveAll(presets);
  return preset;
};

export const updatePaperPresetUsage = (presetId: string): void => {
  const presets = loadAll();
  const preset = presets.find(p => p.id === presetId);

  if (preset) {
    preset.lastUsedAt = Date.now();
    saveAll(presets);
  }
};

export const deletePaperPreset = (presetId: string): void => {
  saveAll(loadAll().filter(p => p.id !== presetId));
};
