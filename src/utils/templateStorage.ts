import type { Template, FieldType } from '../types';

const TEMPLATES_KEY = 'labelync_templates';
const DEFAULT_TEMPLATE_ID = 'default_no_template';

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
    
    // Always ensure default template exists and is up-to-date
    const defaultIndex = templates.findIndex(t => t.id === DEFAULT_TEMPLATE_ID);
    const currentDefault = createDefaultTemplate();
    
    if (defaultIndex >= 0) {
      // Update existing default template while preserving usage data
      const existingDefault = templates[defaultIndex];
      templates[defaultIndex] = {
        ...currentDefault,
        lastUsedAt: existingDefault.lastUsedAt // Preserve last used timestamp
      };
    } else {
      // Add default template if it doesn't exist
      templates.unshift(currentDefault);
    }
    
    return templates;
  } catch (error) {
    console.error('Failed to load templates:', error);
    return [createDefaultTemplate()];
  }
};

export const deleteTemplate = (templateId: string): void => {
  // Prevent deletion of default template
  if (templateId === DEFAULT_TEMPLATE_ID) {
    return;
  }
  
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
};

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
  const svgContent = `<svg width="150" height="100" version="1.1" viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg">
 <text id="date" x="145" y="15" font-family="Arial" font-size="14" text-anchor="end" data-field-type="date" data-label="Date" data-date-format="YYYY-MM-DD" data-optional="true">2024-01-01</text>
 <text id="Text" x="50%" y="50%" font-family="Arial" font-size="26" text-anchor="middle" dominant-baseline="middle">
  <tspan x="50%" dy="0">Text</tspan>
 </text>
</svg>`;

  return {
    id: DEFAULT_TEMPLATE_ID,
    name: 'No template',
    svgContent,
    textFieldValues: { 
      Text: '',
      date: new Date().toISOString().split('T')[0]
    },
    fieldMetadata: [
      {
        id: 'date',
        type: 'date' as FieldType,
        label: 'Date',
        dateFormat: 'YYYY-MM-DD',
        optional: true
      },
      {
        id: 'Text',
        type: 'text' as FieldType,
        label: 'Text'
      }
    ],
    createdAt: 0,
    lastUsedAt: 0
  };
};

export const getDefaultTemplate = (): Template => {
  return createDefaultTemplate();
};

export const isDefaultTemplate = (templateId: string): boolean => {
  return templateId === DEFAULT_TEMPLATE_ID;
};
