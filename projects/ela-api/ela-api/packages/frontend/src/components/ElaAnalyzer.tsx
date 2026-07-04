'use client';

import { useState, useCallback, useRef } from 'react';
import styles from './ElaAnalyzer.module.css';

interface ElaParams {
  quality: number;
  scale: number;
}

interface AnalysisResult {
  originalUrl: string;
  elaUrl: string;
  filename: string;
  fileSize: number;
  quality: number;
  scale: number;
  processingTime: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export default function ElaAnalyzer() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [params, setParams] = useState<ElaParams>({ quality: 75, scale: 10 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('対応形式: JPEG, PNG, WebP');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズは10MB以下にしてください');
      return;
    }
    setError(null);
    setResult(null);
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const analyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setError(null);
    const start = performance.now();

    try {
      const form = new FormData();
      form.append('image', selectedFile);
      form.append('quality', String(params.quality));
      form.append('scale', String(params.scale));

      const res = await fetch(`${API_BASE}/api/ela`, { method: 'POST', body: form });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const elaUrl = URL.createObjectURL(blob);
      const processingTime = Math.round(performance.now() - start);

      setResult({
        originalUrl: previewUrl!,
        elaUrl,
        filename: selectedFile.name,
        fileSize: selectedFile.size,
        quality: params.quality,
        scale: params.scale,
        processingTime,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFile, params, previewUrl]);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const downloadResult = useCallback(() => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.elaUrl;
    a.download = `ela-${result.filename.replace(/\.[^.]+$/, '')}.png`;
    a.click();
  }, [result]);

  return (
    <div className={styles.analyzer}>
      {/* Upload Zone */}
      {!selectedFile && (
        <div
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div className={styles.dropzoneIcon}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="17" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 32l10-10 8 8 6-6 16 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M24 14v12M18 20l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={styles.dropzoneTitle}>画像をドロップ / クリックで選択</p>
          <p className={styles.dropzoneSubtitle}>JPEG · PNG · WebP · 最大10MB</p>
        </div>
      )}

      {/* Selected file preview */}
      {selectedFile && !result && (
        <div className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.badge}>INPUT</span>
            <span className={styles.filename}>{selectedFile.name}</span>
            <span className={styles.filesize}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
            <button className={styles.resetBtn} onClick={reset}>✕ リセット</button>
          </div>
          <div className={styles.previewImage}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl!} alt="Preview" />
          </div>
        </div>
      )}

      {/* Parameters */}
      {selectedFile && (
        <div className={styles.paramsCard}>
          <h3 className={styles.paramsTitle}>
            <span className={styles.bracket}>[</span> 解析パラメータ <span className={styles.bracket}>]</span>
          </h3>
          <div className={styles.paramRow}>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>
                JPEG品質 <code className={styles.paramValue}>{params.quality}</code>
              </label>
              <input
                type="range"
                min="1" max="99"
                value={params.quality}
                onChange={(e) => setParams((p) => ({ ...p, quality: Number(e.target.value) }))}
                className={styles.slider}
              />
              <div className={styles.paramHint}>低 → 高感度 / 高 → 高精度</div>
            </div>
            <div className={styles.paramItem}>
              <label className={styles.paramLabel}>
                増幅係数 <code className={styles.paramValue}>{params.scale}</code>
              </label>
              <input
                type="range"
                min="1" max="50"
                value={params.scale}
                onChange={(e) => setParams((p) => ({ ...p, scale: Number(e.target.value) }))}
                className={styles.slider}
              />
              <div className={styles.paramHint}>高いほど差分を強調表示</div>
            </div>
          </div>
          <button
            className={styles.analyzeBtn}
            onClick={analyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <span className={styles.analyzing}>
                <span className={styles.spinner} />
                解析中...
              </span>
            ) : (
              <span>
                <span className={styles.btnIcon}>◈</span> ELA解析を実行
              </span>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={styles.resultSection}>
          <div className={styles.resultMeta}>
            <div className={styles.resultMetaItem}>
              <span className={styles.metaLabel}>ファイル</span>
              <span className={styles.metaValue}>{result.filename}</span>
            </div>
            <div className={styles.resultMetaItem}>
              <span className={styles.metaLabel}>品質</span>
              <span className={styles.metaValue}>{result.quality}</span>
            </div>
            <div className={styles.resultMetaItem}>
              <span className={styles.metaLabel}>増幅</span>
              <span className={styles.metaValue}>{result.scale}×</span>
            </div>
            <div className={styles.resultMetaItem}>
              <span className={styles.metaLabel}>処理時間</span>
              <span className={`${styles.metaValue} ${styles.metaHighlight}`}>{result.processingTime}ms</span>
            </div>
          </div>

          <div className={styles.comparison}>
            <div className={styles.compPanel}>
              <div className={styles.compLabel}>
                <span className={styles.badge}>ORIGINAL</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.originalUrl} alt="Original" className={styles.compImage} />
            </div>
            <div className={styles.compDivider}>
              <span className={styles.compArrow}>→</span>
              <span className={styles.compArrowLabel}>ELA</span>
            </div>
            <div className={styles.compPanel}>
              <div className={styles.compLabel}>
                <span className={`${styles.badge} ${styles.badgeCyan}`}>ELA RESULT</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={result.elaUrl} alt="ELA Result" className={styles.compImage} />
            </div>
          </div>

          <div className={styles.resultGuide}>
            <div className={`${styles.guideItem} ${styles.guideHigh}`}>
              <span className={styles.guideColor} />
              <div>
                <strong>明るい領域</strong>
                <p>圧縮エラーが大きい → 改ざんの疑い</p>
              </div>
            </div>
            <div className={`${styles.guideItem} ${styles.guideLow}`}>
              <span className={styles.guideColor} />
              <div>
                <strong>暗い領域</strong>
                <p>圧縮エラーが小さい → 改ざんの疑いなし</p>
              </div>
            </div>
          </div>

          <div className={styles.resultActions}>
            <button className={styles.downloadBtn} onClick={downloadResult}>
              ↓ ELA画像をダウンロード
            </button>
            <button className={styles.resetBtn} onClick={reset}>
              ✕ 新しい画像を解析
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
