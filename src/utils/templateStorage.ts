import type { Template } from '../types';

const TEMPLATES_KEY = 'phomemo_templates';
const DEFAULT_TEMPLATE_ID = 'default_no_template';

// ...existing code...

export const saveTemplate = (template: Template): void => {
  const templates = loadTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);
  
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const loadTemplates = (): Template[] => {
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    const templates = stored ? JSON.parse(stored) as Template[] : [];
    
    // Always ensure default template exists
    const hasDefault = templates.some(t => t.id === DEFAULT_TEMPLATE_ID);
    if (!hasDefault) {
      templates.unshift(createDefaultTemplate());
    }
    
    return templates;
  } catch (error) {
    console.error('Failed to load templates:', error);
    return [createDefaultTemplate()];
  }
};

// ...existing code...

export const deleteTemplate = (templateId: string): void => {
  // Prevent deletion of default template
  if (templateId === DEFAULT_TEMPLATE_ID) {
    return;
  }
  
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
};

// ...existing code...

export const getTemplate = (templateId: string): Template | null => {
  const templates = loadTemplates();
  return templates.find(t => t.id === templateId) || null;
};

export const getRecentlyUsedTemplates = (limit: number = 10): Template[] => {
  const templates = loadTemplates();
  return templates
    .sort((a, b) => b.lastUsedAt - a.lastUsedAt)
    .slice(0, limit);
};

export const updateTemplateUsage = (templateId: string): void => {
  const templates = loadTemplates();
  const template = templates.find(t => t.id === templateId);
  
  if (template) {
    template.lastUsedAt = Date.now();
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  }
};

export const generateTemplateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDefaultTemplate = (): Template => {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="384" height="200" viewBox="0 0 384 200">
  <rect width="384" height="200" fill="white"/>
  <text id="Text" x="192" y="100" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="black">
    <tspan x="192" y="70">Line 1</tspan>
    <tspan x="192" y="100">Line 2</tspan>
    <tspan x="192" y="130">Line 3</tspan>
  </text>
</svg>`;

  return {
    id: DEFAULT_TEMPLATE_ID,
    name: 'No template',
    svgContent,
    textFieldIds: ['Text'],
    textFieldValues: { Text: 'Line 1\nLine 2\nLine 3' },
    createdAt: 0, // epoch 0 to indicate it's a default template
    lastUsedAt: 0
  };
};

export const getDefaultTemplate = (): Template => {
  return createDefaultTemplate();
};

export const isDefaultTemplate = (templateId: string): boolean => {
  return templateId === DEFAULT_TEMPLATE_ID;
};
