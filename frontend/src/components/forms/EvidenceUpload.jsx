import React, { useRef, useState } from 'react';
import { UploadCloud, X, Sparkles, Loader2, AlertCircle, FileImage } from 'lucide-react';

// Pre-generated lightweight demo visual evidence assets for testing
export const SAMPLE_EVIDENCE_ASSETS = [
  {
    id: 'sample-collapse',
    label: 'Collapse Photo',
    name: 'building_collapse.jpg',
    size: '2.4 MB',
    type: 'image/jpeg',
    hint: 'Supports Collapse',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23334155"/><polygon points="80,350 140,180 260,210 240,350" fill="%23475569"/><polygon points="240,350 280,120 420,160 400,350" fill="%2364748B"/><polygon points="380,350 430,220 540,250 510,350" fill="%23475569"/><polygon points="260,200 320,320 380,260" fill="%2394A3B8"/><circle cx="340" cy="310" r="25" fill="%23E2E8F0"/><text x="30" y="50" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold">MG Road Structural Collapse Evidence</text><text x="30" y="80" fill="%2394A3B8" font-family="sans-serif" font-size="14">Heavy Rubble, Debris, Access Blocked</text></svg>`,
  },
  {
    id: 'sample-flood',
    label: 'Flood Photo',
    name: 'street_flooding.jpg',
    size: '3.1 MB',
    type: 'image/jpeg',
    hint: 'Supports Flood',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230F172A"/><rect x="0" y="240" width="600" height="160" fill="%230284C7"/><path d="M0,240 Q150,230 300,245 T600,240 L600,400 L0,400 Z" fill="%230369A1"/><rect x="120" y="140" width="80" height="100" fill="%23334155"/><polygon points="100,140 160,80 220,140" fill="%23475569"/><rect x="340" y="160" width="100" height="80" fill="%23334155"/><text x="30" y="50" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold">Urban Flood Inundation Evidence</text><text x="30" y="80" fill="%237DD3FC" font-family="sans-serif" font-size="14">High Watermark Submerging Pavement</text></svg>`,
  },
  {
    id: 'sample-fire',
    label: 'Fire Photo',
    name: 'warehouse_fire.jpg',
    size: '1.9 MB',
    type: 'image/jpeg',
    hint: 'Supports Fire',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%231E293B"/><ellipse cx="300" cy="180" rx="140" ry="90" fill="%23475569" opacity="0.8"/><ellipse cx="320" cy="130" rx="110" ry="70" fill="%23334155" opacity="0.9"/><polygon points="220,320 280,210 320,320" fill="%23EA580C"/><polygon points="290,320 340,190 380,320" fill="%23F97316"/><polygon points="260,320 300,240 330,320" fill="%23FBBF24"/><text x="30" y="50" fill="%23F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold">Industrial Fire & Smoke Plume</text><text x="30" y="80" fill="%23FDBA74" font-family="sans-serif" font-size="14">Active Thermal Signature Visible</text></svg>`,
  },
  {
    id: 'sample-conflict',
    label: 'Clear Road Photo',
    name: 'normal_clear_road.jpg',
    size: '1.4 MB',
    type: 'image/jpeg',
    hint: 'Triggers Conflict Alert',
    dataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23047857"/><rect x="0" y="220" width="600" height="180" fill="%2364748B"/><line x1="0" y1="310" x2="600" y2="310" stroke="%23FFFFFF" stroke-width="4" stroke-dasharray="20,20"/><circle cx="500" cy="80" r="45" fill="%23FBBF24"/><text x="30" y="50" fill="%23FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Sunny Park & Clear Dry Roadway</text><text x="30" y="80" fill="%23A7F3D0" font-family="sans-serif" font-size="14">No Water, No Smoke, No Damage</text></svg>`,
  },
];

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

export function EvidenceUpload({ evidenceImage, onChange }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [fileError, setFileError] = useState('');

  const validateAndProcessFile = (file) => {
    if (!file) return;
    setFileError('');

    // Check file extension / MIME type
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
    const isExtensionValid = /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isMimeValid && !isExtensionValid) {
      setFileError('Invalid file type. Please upload an image in JPG, JPEG, PNG, or WebP format.');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`Image file is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please upload an image under 10 MB.`);
      return;
    }

    setIsReadingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      setIsReadingFile(false);
      const sizeStr = file.size < 1024 * 1024
        ? `${Math.round(file.size / 1024)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      onChange({
        name: file.name,
        size: sizeStr,
        type: file.type || 'image/jpeg',
        dataUrl: e.target.result,
      });
    };

    reader.onerror = () => {
      setIsReadingFile(false);
      setFileError('Unable to read the selected file. Please try selecting the image again.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onChange(null);
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Description */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Supporting Evidence
          </label>
          <span className="text-[10px] text-slate-400 font-medium">Optional</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload a photo of the incident if available.
        </p>
      </div>

      {/* Inline Validation Error */}
      {fileError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{fileError}</span>
        </div>
      )}

      {/* Hidden File Input with Camera/Gallery Support */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            validateAndProcessFile(e.target.files[0]);
          }
        }}
      />

      {/* Loading state while file is being read */}
      {isReadingFile && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <span>Processing incident photo...</span>
        </div>
      )}

      {/* Selected Image Preview OR Dropzone */}
      {!isReadingFile && (
        evidenceImage ? (
          <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 shadow-xs">
                <img
                  src={evidenceImage.dataUrl}
                  alt={evidenceImage.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 text-xs">
                <div className="font-bold text-slate-900 truncate">
                  {evidenceImage.name}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono">{evidenceImage.size}</span>
                  <span>·</span>
                  <span className="uppercase text-[10px] text-slate-400 font-semibold">{evidenceImage.type?.split('/')[1] || 'IMAGE'}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 transition shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`p-4 rounded-xl border-2 border-dashed text-center transition ${
              isDragging
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="p-2 rounded-full bg-slate-100 text-slate-500">
                <UploadCloud className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-xs text-slate-700">
                <span className="font-medium">Drag & drop photo here, or </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 font-bold hover:underline cursor-pointer focus:outline-none"
                >
                  browse files
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Supports JPG, JPEG, PNG, WebP (up to 10 MB)
              </p>
            </div>
          </div>
        )
      )}

      {/* Demo sample images shortcut */}
      <div className="pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick Test Photos:
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {SAMPLE_EVIDENCE_ASSETS.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                setFileError('');
                onChange({
                  name: asset.name,
                  size: asset.size,
                  type: asset.type,
                  dataUrl: asset.dataUrl,
                });
              }}
              className={`p-1.5 rounded-lg border text-left text-xs transition cursor-pointer ${
                evidenceImage?.name === asset.name
                  ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="truncate font-medium text-[11px]">{asset.label}</div>
              <div className="text-[9px] text-slate-400 font-mono truncate">{asset.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
