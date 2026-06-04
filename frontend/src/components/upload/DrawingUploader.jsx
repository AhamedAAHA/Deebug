import { useState, useRef, useEffect } from 'react';
import { uploadSteps } from '../../data/mockData';
import { delay, withTimeout, tick } from '../../utils/formatters';
import { uploadDrawing, syncBoqToServer } from '../../utils/api';
import { saveLatestDrawing } from '../../utils/drawingSession';
import { extractCadPreview } from '../../utils/cadPreview';
import { extractBoqFromCad } from '../../utils/boqExtraction';

const UPLOAD_TIMEOUT_MS = 25_000;
const CAD_TIMEOUT_MS = 120_000;

export default function DrawingUploader({
  onComplete,
  label = 'Upload Construction Drawing',
  saveAsLatest = true,
}) {
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [serverWarning, setServerWarning] = useState('');
  const [statusHint, setStatusHint] = useState('');
  const inputRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => () => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
  }, []);

  const startStepPulse = (fromStep, toStep) => {
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    let step = fromStep;
    setCurrentStep(step);
    stepTimerRef.current = setInterval(() => {
      if (step < toStep) {
        step += 1;
        setCurrentStep(step);
      }
    }, 2200);
  };

  const stopStepPulse = () => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setProcessing(true);
    setError('');
    setServerWarning('');
    setStatusHint('Loading CAD engine…');
    setCurrentStep(0);
    startStepPulse(0, 2);

    try {
      const uploadResult = await withTimeout(
        uploadDrawing(file),
        UPLOAD_TIMEOUT_MS,
        'Server upload timed out.',
      );

      if (!uploadResult.success) {
        setServerWarning(
          uploadResult.message
            || 'File was not saved on the server. Local CAD analysis will continue.',
        );
      }

      const cadPreview = await withTimeout(
        extractCadPreview(file, {
          onProgress: (step) => {
            setCurrentStep(Math.min(step, 3));
            const hints = [
              'Reading drawing…',
              'Parsing DWG geometry…',
              'Detecting walls & openings…',
              'Building 3D BIM model…',
            ];
            setStatusHint(hints[step] || hints[0]);
            if (step >= 2) stopStepPulse();
          },
        }),
        CAD_TIMEOUT_MS,
        'CAD parsing timed out. Try AutoCAD 2013 DWG or explode blocks before upload.',
      );

      stopStepPulse();
      setCurrentStep(3);
      setStatusHint('Calculating quantities…');
      await tick();

      const boqExtraction = extractBoqFromCad(cadPreview, file.name);
      const result = {
        ...uploadResult,
        ...cadPreview,
        ...boqExtraction,
        serverUploadFailed: !uploadResult.success,
      };

      if (boqExtraction.extractionAvailable && boqExtraction.boqItems?.length) {
        await syncBoqToServer({
          items: boqExtraction.boqItems,
          quantities: boqExtraction.quantities,
          fileName: file.name,
        });
      } else if (uploadResult.success && uploadResult.boqItems?.length) {
        await syncBoqToServer({
          items: uploadResult.boqItems,
          quantities: uploadResult.quantities,
          fileName: file.name,
        });
      }

      const drawing = saveAsLatest ? await saveLatestDrawing(file, result) : null;

      setCurrentStep(4);
      setStatusHint('Generating BOQ…');
      await delay(500);

      setProcessing(false);
      setStatusHint('');
      onComplete?.(file, result, drawing);
    } catch (err) {
      stopStepPulse();
      let message = err instanceof Error ? err.message : 'Upload failed. Please try again.';
      if (err?.name === 'QuotaExceededError' || /quota/i.test(message)) {
        message = 'Drawing data is too large for browser storage. Try a smaller DWG or clear site data for localhost.';
      }
      setError(message);
      setProcessing(false);
      setStatusHint('');
      setCurrentStep(-1);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="drawing-uploader">
      <div
        className={`upload-zone ${dragging ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !processing && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.dwg,.dxf"
          hidden
          onChange={(e) => processFile(e.target.files[0])}
        />
        <div className="upload-zone-icon">DWG</div>
        <h3>{label}</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Drag and drop PDF, image, DWG, or DXF drawings, or click to browse.
        </p>
        {fileName && <p style={{ marginTop: '0.75rem', color: 'var(--accent-cyan)' }}>File selected: {fileName}</p>}
      </div>

      {serverWarning && !processing && (
        <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem', borderColor: 'rgba(245, 158, 11, 0.35)' }}>
          <p style={{ color: '#b45309', margin: 0 }}>
            <strong>Server upload failed.</strong> {serverWarning}
          </p>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setServerWarning('')}>
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ marginTop: '1rem', padding: '1rem', borderColor: 'rgba(248,113,113,0.4)' }}>
          <p style={{ color: '#f87171', margin: 0 }}>{error}</p>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      {processing && (
        <div className="upload-steps">
          {statusHint && (
            <p className="upload-status-hint">{statusHint}</p>
          )}
          {uploadSteps.map((step, i) => (
            <div
              key={step}
              className={`upload-step ${i < currentStep ? 'done' : ''} ${i === currentStep ? 'active' : ''}`}
            >
              <span className="upload-step-indicator">
                {i < currentStep ? 'OK' : i + 1}
              </span>
              <span>{step}</span>
              {i === currentStep && (
                <div className="progress-bar" style={{ flex: 1, marginLeft: 'auto', maxWidth: 120 }}>
                  <div className="progress-bar-fill upload-progress-indeterminate" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
