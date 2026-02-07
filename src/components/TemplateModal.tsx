import React, { useState, useEffect, useRef } from 'react';
import type { Template } from '../types';
import { 
  saveTemplate, 
  loadTemplates, 
  deleteTemplate, 
  generateTemplateId, 
  isDefaultTemplate,
  updateTemplateUsage 
} from '../utils/templateStorage';
import { extractTextFieldIds } from '../utils/svgTextUtils';
import Modal from './Modal';
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
      const { defaults, metadata } = extractTextFieldIds(svgContent);
      
      if (metadata.length === 0) {
        alert('The SVG file must contain elements with id attributes (text, rect, or image elements)');
        return;
      }

      const thumbnail = await generateThumbnail(svgContent);
      const now = Date.now();
      
      const newTemplate: Template = {
        id: generateTemplateId(),
        name: file.name.replace('.svg', ''),
        svgContent,
        textFieldValues: defaults,
        fieldMetadata: metadata,
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

  // Helper to format field type counts
  const getFieldTypeSummary = (template: Template): string => {
    const counts: Record<string, number> = {};
    template.fieldMetadata.forEach(meta => {
      counts[meta.type] = (counts[meta.type] || 0) + 1;
    });

    const parts: string[] = [];
    if (counts.text) parts.push(`${counts.text} text`);
    if (counts.date) parts.push(`${counts.date} date`);
    if (counts.qr) parts.push(`${counts.qr} QR`);
    if (counts.image) parts.push(`${counts.image} image`);

    return parts.join(', ') || `${template.fieldMetadata.length} field${template.fieldMetadata.length !== 1 ? 's' : ''}`;
  };

  const footer = (
    <>
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
    </>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Template Manager" 
      footer={footer}
      className="template-modal-content"
    >
      <div className="template-modal-body">
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
                    {getFieldTypeSummary(template)}
                  </div>
                </div>
              </div>
            ))}
          </div>
      </div>
    </Modal>
  );
};

export default TemplateModal;
