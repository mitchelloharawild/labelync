import React, { useEffect, useRef, useState } from 'react';
import type { PrinterConfig, Template } from '../types';
import { FieldType } from '../types';
import { getFreshTextFieldValues } from '../utils/svgTextUtils';
import { parseCSV } from '../utils/csvParser';
import { renderTemplateToCanvas } from '../utils/renderTemplateToCanvas';
import Modal from './Modal';
import './ModalForms.css';
import './BatchPrintModal.css';

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  printerConfig: PrinterConfig;
  hiddenFields: Record<string, boolean>;
  printImage: (canvas: HTMLCanvasElement, config: PrinterConfig) => Promise<void>;
}

interface FailedRow {
  row: number; // 1-indexed CSV row, counting the header row as row 1
  error: string;
}

interface BatchProgress {
  current: number;
  total: number;
  succeeded: number;
  failed: FailedRow[];
}

type BatchStep = 'upload' | 'mapping' | 'printing' | 'summary';

const FIELD_TYPE_LABEL: Partial<Record<FieldType, string>> = {
  [FieldType.TEXT]: 'Text',
  [FieldType.DATE]: 'Date',
  [FieldType.QR]: 'QR code',
  [FieldType.BARCODE]: 'Barcode',
};

const EMPTY_PROGRESS: BatchProgress = { current: 0, total: 0, succeeded: 0, failed: [] };

const BatchPrintModal: React.FC<BatchPrintModalProps> = ({
  isOpen,
  onClose,
  template,
  printerConfig,
  hiddenFields,
  printImage
}) => {
  const [step, setStep] = useState<BatchStep>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState<BatchProgress>(EMPTY_PROGRESS);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef(false);

  // Image fields can't reasonably be driven by a CSV cell, so they're always
  // left at the template's default and excluded from the mapping UI.
  const mappableFields = template.fieldMetadata.filter(f => f.type !== FieldType.IMAGE);
  const imageFieldCount = template.fieldMetadata.length - mappableFields.length;

  // Reset to a clean slate every time the modal is (re)opened.
  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFileName('');
      setHeaders([]);
      setRows([]);
      setColumnMapping({});
      setProgress(EMPTY_PROGRESS);
      setUploadError(null);
      cancelRef.current = false;
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file still fires onChange
    // (same convention as the template SVG upload).
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (!file) return;

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);

      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setUploadError('The CSV file must contain a header row and at least one data row.');
        return;
      }

      // Try to auto-map columns whose header matches a field's id or label.
      const initialMapping: Record<string, string> = {};
      mappableFields.forEach(field => {
        const match = parsed.headers.find(h =>
          h.toLowerCase() === field.id.toLowerCase() ||
          (!!field.label && h.toLowerCase() === field.label.toLowerCase())
        );
        initialMapping[field.id] = match ?? '';
      });

      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setColumnMapping(initialMapping);
      setStep('mapping');
    };
    reader.onerror = () => setUploadError('Failed to read the CSV file. Please try again.');
    reader.readAsText(file);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleMappingChange = (fieldId: string, column: string) => {
    setColumnMapping(prev => ({ ...prev, [fieldId]: column }));
  };

  const runBatch = async () => {
    cancelRef.current = false;
    setStep('printing');
    setProgress({ current: 0, total: rows.length, succeeded: 0, failed: [] });

    // Start each row from the template's fresh default values (e.g. today's
    // date for date fields), then overlay whichever columns were mapped.
    const baseValues = getFreshTextFieldValues(template.textFieldValues, template.fieldMetadata);

    let succeeded = 0;
    const failed: FailedRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (cancelRef.current) break;

      const row = rows[i];
      const rowValues: Record<string, string> = { ...baseValues };
      mappableFields.forEach(field => {
        const column = columnMapping[field.id];
        if (!column) return;
        const columnIndex = headers.indexOf(column);
        if (columnIndex !== -1 && row[columnIndex] !== undefined) {
          rowValues[field.id] = row[columnIndex];
        }
      });

      // Sequential, awaited render+print per row (mirrors the copies loop in
      // App.tsx's handlePrint) — a failed row is recorded and the batch
      // continues rather than aborting.
      try {
        const canvas = await renderTemplateToCanvas(template, rowValues, printerConfig, hiddenFields);
        await printImage(canvas, printerConfig);
        succeeded++;
      } catch (error) {
        failed.push({
          row: i + 2, // +1 for 0-index, +1 for the header row
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      setProgress({ current: i + 1, total: rows.length, succeeded, failed: [...failed] });
    }

    setStep('summary');
  };

  const handleCancelPrinting = () => {
    cancelRef.current = true;
  };

  const handleStartOver = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setColumnMapping({});
    setProgress(EMPTY_PROGRESS);
    setUploadError(null);
  };

  const mappedFieldCount = mappableFields.filter(f => columnMapping[f.id]).length;
  const stoppedEarly = step === 'summary' && progress.current < progress.total;

  const footer = (() => {
    if (step === 'upload') {
      return (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button className="button button-secondary" onClick={onClose}>Cancel</button>
          <button className="button button-primary" onClick={handleUploadClick}>📁 Choose CSV File</button>
        </>
      );
    }
    if (step === 'mapping') {
      return (
        <>
          <button className="button button-secondary" onClick={handleStartOver}>Back</button>
          <button className="button button-primary" onClick={runBatch} disabled={rows.length === 0}>
            Print {rows.length} Label{rows.length === 1 ? '' : 's'}
          </button>
        </>
      );
    }
    if (step === 'printing') {
      return (
        <button className="button button-secondary" onClick={handleCancelPrinting}>
          Stop After Current Label
        </button>
      );
    }
    // summary
    return (
      <>
        <button className="button button-secondary" onClick={handleStartOver}>Print Another CSV</button>
        <button className="button button-primary" onClick={onClose}>Done</button>
      </>
    );
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Print from CSV"
      footer={footer}
      className="batch-print-modal-content"
    >
      {step === 'upload' && (
        <div className="batch-step batch-upload-step">
          <p>
            Upload a CSV file with one row per label. Its first row should be column
            headers — each column can then be mapped to a field in the current template
            (<strong>{template.name}</strong>) on the next step.
          </p>
          {uploadError && <div className="batch-error">{uploadError}</div>}
        </div>
      )}

      {step === 'mapping' && (
        <div className="batch-step batch-mapping-step">
          <p className="batch-summary-line">
            <strong>{rows.length}</strong> row{rows.length === 1 ? '' : 's'} found in{' '}
            <strong>{fileName}</strong> &mdash; {mappedFieldCount} of {mappableFields.length}{' '}
            field{mappableFields.length === 1 ? '' : 's'} mapped.
          </p>

          <div className="batch-mapping-list">
            {mappableFields.map(field => (
              <div className="batch-mapping-row" key={field.id}>
                <label htmlFor={`batch-map-${field.id}`}>
                  {field.label || field.id}
                  <span className="batch-field-type">{FIELD_TYPE_LABEL[field.type] || field.type}</span>
                </label>
                <select
                  id={`batch-map-${field.id}`}
                  value={columnMapping[field.id] || ''}
                  onChange={(e) => handleMappingChange(field.id, e.target.value)}
                >
                  <option value="">Use template default</option>
                  {headers.map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {imageFieldCount > 0 && (
            <p className="batch-note">
              {imageFieldCount} image field{imageFieldCount === 1 ? '' : 's'} in this template
              can&apos;t be set from CSV data &mdash; the template&apos;s current image will be
              used for every label.
            </p>
          )}
        </div>
      )}

      {step === 'printing' && (
        <div className="batch-step batch-printing-step">
          <p className="batch-summary-line">
            Printing label {Math.min(progress.current + 1, progress.total)} of {progress.total}&hellip;
          </p>
          <div className="batch-progress-bar">
            <div
              className="batch-progress-fill"
              style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
            />
          </div>
          <p className="batch-progress-counts">
            <span className="batch-count-success">{progress.succeeded} succeeded</span>
            {progress.failed.length > 0 && (
              <span className="batch-count-failed">{progress.failed.length} failed</span>
            )}
          </p>
        </div>
      )}

      {step === 'summary' && (
        <div className="batch-step batch-summary-step">
          <p className="batch-summary-line">
            {progress.succeeded} of {progress.total} label{progress.total === 1 ? '' : 's'} printed
            successfully.{stoppedEarly && ' Batch stopped early.'}
          </p>

          {progress.failed.length > 0 && (
            <div className="batch-failed-list">
              <p className="batch-failed-heading">Failed rows:</p>
              <ul>
                {progress.failed.map(f => (
                  <li key={f.row}>CSV row {f.row}: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default BatchPrintModal;
