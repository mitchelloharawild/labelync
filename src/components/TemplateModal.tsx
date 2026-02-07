import React, { useState, useEffect, useRef } from 'react';
import type { Template } from '../types';
import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  generateTemplateId,
  updateTemplateUsage,
  isDefaultTemplate
} from '../utils/templateStorage';
import './TemplateModal.css';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  currentTemplateId?: string;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  currentTemplateId
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplatesFromStorage();
    }
  }, [isOpen]);

  const loadTemplatesFromStorage = () => {
    const loadedTemplates = loadTemplates();
    
    // Sort templates: default first, then by last used (most recent first)
    const sorted = loadedTemplates.sort((a, b) => {
      // Default template always first
      if (isDefaultTemplate(a.id)) return -1;
      if (isDefaultTemplate(b.id)) return 1;
      
      // Otherwise sort by last used
      return b.lastUsedAt - a.lastUsedAt;
    });
    
    setTemplates(sorted);
  };

  const extractTextFieldIds = (svgContent: string): { ids: string[], defaults: Record<string, string> } => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const textElements = svgDoc.querySelectorAll('text[id]');
    
    const ids: string[] = [];
    const defaults: Record<string, string> = {};
    
    textElements.forEach(el => {
      const id = el.getAttribute('id');
      if (id) {
        ids.push(id);
        
        // Check if text element has tspan children (multi-line)
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
    });
    
    return { ids, defaults };
  };

  const generateThumbnail = async (svgContent: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      canvas.width = 200;
      canvas.height = 200;
      
      img.onload = () => {
        if (ctx) {
          // Calculate scaling to fit within thumbnail while maintaining aspect ratio
          const scale = Math.min(200 / img.width, 200 / img.height);
          const x = (200 - img.width * scale) / 2;
          const y = (200 - img.height * scale) / 2;
          
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 200, 200);
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve('');
        }
      };
      
      img.onerror = () => resolve('');
      
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      img.src = url;
    });
  };

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('svg')) {
      alert('Please upload an SVG file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const svgContent = event.target?.result as string;
      const { ids, defaults } = extractTextFieldIds(svgContent);
      
      if (ids.length === 0) {
        alert('The SVG file must contain text elements with id attributes');
        return;
      }

      const thumbnail = await generateThumbnail(svgContent);
      const now = Date.now();
      
      const newTemplate: Template = {
        id: generateTemplateId(),
        name: file.name.replace('.svg', ''),
        svgContent,
        textFieldIds: ids,
        textFieldValues: defaults,
        thumbnail,
        createdAt: now,
        lastUsedAt: now
      };

      saveTemplate(newTemplate);
      loadTemplatesFromStorage();
    };
    
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent deletion of default template
    if (isDefaultTemplate(templateId)) {
      return;
    }
    
    setDeleteConfirmId(templateId);
  };

  const handleConfirmDelete = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTemplate(templateId);
    loadTemplatesFromStorage();
    setDeleteConfirmId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(null);
  };

  const handleSelectTemplate = (template: Template) => {
    updateTemplateUsage(template.id);
    onSelectTemplate(template);
    onClose();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content template-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Template Manager</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body template-modal-body">
          <div className="templates-grid">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${currentTemplateId === template.id ? 'active' : ''}`}
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="template-preview">
                  {template.thumbnail ? (
                    <img src={template.thumbnail} alt={template.name} />
                  ) : (
                    <div className="template-preview-placeholder">
                      <span>📄</span>
                    </div>
                  )}
                  {!isDefaultTemplate(template.id) && (
                    deleteConfirmId === template.id ? (
                      <div className="delete-confirm">
                        <button
                          className="confirm-delete-btn"
                          onClick={(e) => handleConfirmDelete(template.id, e)}
                          title="Confirm delete"
                        >
                          ✓
                        </button>
                        <button
                          className="cancel-delete-btn"
                          onClick={handleCancelDelete}
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        className="delete-btn"
                        onClick={(e) => handleDeleteClick(template.id, e)}
                        title="Delete template"
                      >
                        🗑️
                      </button>
                    )
                  )}
                </div>
                <div className="template-info">
                  <div className="template-name">{template.name}</div>
                  <div className="template-meta">
                    {template.textFieldIds.length} field{template.textFieldIds.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            onChange={handleUploadTemplate}
            style={{ display: 'none' }}
          />
          <button className="button button-primary upload-template-btn" onClick={handleUploadClick}>
            📁 Upload New Template
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateModal;
