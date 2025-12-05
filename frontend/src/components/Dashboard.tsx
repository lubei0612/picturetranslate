import { ChangeEvent, DragEvent, useCallback, useRef, useState } from "react";

import { downloadBlob, getStorageUrl } from "../api/translateClient";
import { useJobQueue } from "../hooks/useJobQueue";
import { useTranslation } from "../hooks/useTranslation";
import { Editor } from "./Editor";
import { MaskCanvas } from "./MaskCanvas";

const LANGUAGE_OPTIONS = [
  { label: "自动检测", value: "auto" },
  { label: "中文", value: "zh" },
  { label: "英语", value: "en" },
  { label: "日语", value: "ja" },
  { label: "韩语", value: "ko" },
  { label: "法语", value: "fr" },
  { label: "德语", value: "de" },
  { label: "西班牙语", value: "es" },
  { label: "俄语", value: "ru" },
];

const FIELD_OPTIONS = [
  { label: "电商图片", value: "e-commerce" },
  { label: "通用图片", value: "general" },
];

const MAX_BATCH_SIZE = 5;

export function Dashboard() {
  const { translate, isLoading: singleLoading, error: singleError, resultBlob, resultUrl, reset: singleReset } = useTranslation();
  const { submitJob, images, status: batchStatus, error: batchError, reset: batchReset, isProcessing } = useJobQueue();

  const [files, setFiles] = useState<File[]>([]);
  const [masks, setMasks] = useState<Map<number, Blob>>(new Map());
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [field, setField] = useState<"e-commerce" | "general">("e-commerce");
  const [isDragActive, setIsDragActive] = useState(false);
  const [maskEditIndex, setMaskEditIndex] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isBatchMode = files.length > 1;
  const isLoading = isBatchMode ? isProcessing : singleLoading;
  const error = isBatchMode ? batchError : singleError;

  const updatePreviewUrls = useCallback((newFiles: File[]) => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
  }, [previewUrls]);

  const handleFilesSelected = useCallback(
    (selectedFiles: FileList) => {
      const newFiles = Array.from(selectedFiles).slice(0, MAX_BATCH_SIZE);
      setFiles(newFiles);
      setMasks(new Map());
      setMaskEditIndex(null);
      updatePreviewUrls(newFiles);
    },
    [updatePreviewUrls]
  );

  const onFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files?.length) {
        setFiles([]);
        return;
      }
      handleFilesSelected(event.target.files);
    },
    [handleFilesSelected]
  );

  const onTranslate = useCallback(async () => {
    if (files.length === 0) return;

    if (isBatchMode) {
      const masksArray: Blob[] = [];
      files.forEach((_, idx) => {
        const mask = masks.get(idx);
        if (mask) masksArray.push(mask);
      });
      await submitJob({
        files,
        masks: masksArray.length > 0 ? masksArray : undefined,
        sourceLang,
        targetLang,
        field,
        enablePostprocess: true,
      });
    } else {
      await translate(files[0], {
        sourceLang,
        targetLang,
        field,
        enablePostprocess: true,
      });
    }
  }, [files, isBatchMode, masks, sourceLang, targetLang, field, submitJob, translate]);

  const handleReset = useCallback(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setMasks(new Map());
    setMaskEditIndex(null);
    setPreviewUrls([]);
    setImageDimensions(null);
    singleReset();
    batchReset();
  }, [previewUrls, singleReset, batchReset]);

  const onDownload = useCallback(() => {
    if (resultBlob) {
      downloadBlob(resultBlob);
    }
  }, [resultBlob]);

  const handleDrag = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragActive(true);
    } else if (event.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragActive(false);
      if (!event.dataTransfer.files?.length) return;
      handleFilesSelected(event.dataTransfer.files);
    },
    [handleFilesSelected]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      setFiles(newFiles);
      const newMasks = new Map(masks);
      newMasks.delete(index);
      setMasks(newMasks);
      if (maskEditIndex === index) setMaskEditIndex(null);

      previewUrls.forEach((url, i) => {
        if (i === index) URL.revokeObjectURL(url);
      });
      setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    },
    [files, masks, maskEditIndex, previewUrls]
  );

  const openMaskEditor = useCallback((index: number) => {
    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
      setMaskEditIndex(index);
    };
    img.src = previewUrls[index];
  }, [previewUrls]);

  const handleMaskChange = useCallback(
    (blob: Blob) => {
      if (maskEditIndex === null) return;
      setMasks((prev) => new Map(prev).set(maskEditIndex, blob));
      setMaskEditIndex(null);
    },
    [maskEditIndex]
  );

  const filesText = files.length > 0
    ? `已选择 ${files.length} 个文件`
    : "未选择文件";

  return (
    <div className="dashboard">
      <section className="panel">
        <div
          className={`drop-zone ${isDragActive ? "drop-zone--active" : ""}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <p className="drop-zone__title">上传图片</p>
          <p className="drop-zone__hint">拖拽图片到这里（最多 {MAX_BATCH_SIZE} 张），或</p>
          <button className="drop-zone__button" type="button" onClick={openFilePicker}>
            选择文件
          </button>
          <p className="drop-zone__filename">{filesText}</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            hidden
          />
        </div>

        {files.length > 0 && (
          <div className="file-preview-list">
            {files.map((file, idx) => (
              <div key={`${file.name}-${idx}`} className="file-preview-item">
                <img src={previewUrls[idx]} alt={file.name} />
                <span className="file-preview-item__name">{file.name}</span>
                <div className="file-preview-item__actions">
                  {masks.has(idx) && <span className="file-preview-item__mask-badge">Mask</span>}
                  <button type="button" onClick={() => openMaskEditor(idx)} title="编辑 Mask">
                    M
                  </button>
                  <button type="button" onClick={() => removeFile(idx)} title="移除">
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid">
          <label>
            <span>源语言</span>
            <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
              {LANGUAGE_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>目标语言</span>
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              {LANGUAGE_OPTIONS.filter((option) => option.value !== "auto").map(
                (option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>翻译领域</span>
            <select value={field} onChange={(e) => setField(e.target.value as "e-commerce" | "general")}>
              {FIELD_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button disabled={files.length === 0 || isLoading} onClick={onTranslate}>
          {isLoading ? "翻译中..." : `开始翻译${isBatchMode ? ` (${files.length} 张)` : ""}`}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      {maskEditIndex !== null && imageDimensions && (
        <div className="mask-editor-modal">
          <div className="mask-editor-modal__overlay" onClick={() => setMaskEditIndex(null)} />
          <div className="mask-editor-modal__content">
            <h3>编辑 Mask - {files[maskEditIndex]?.name}</h3>
            <MaskCanvas
              imageUrl={previewUrls[maskEditIndex]}
              width={imageDimensions.width}
              height={imageDimensions.height}
              onMaskChange={handleMaskChange}
            />
            <button type="button" onClick={() => setMaskEditIndex(null)}>
              取消
            </button>
          </div>
        </div>
      )}

      {isBatchMode && batchStatus !== "idle" ? (
        <section className="batch-results">
          <header>
            <h2>批量翻译结果</h2>
            <button type="button" onClick={handleReset}>重置</button>
          </header>
          <div className="batch-results__grid">
            {images.map((img, idx) => (
              <div key={img.uuid} className={`batch-results__item batch-results__item--${img.status}`}>
                <span>图片 {idx + 1}</span>
                {img.status === "done" && img.resultUrl ? (
                  <>
                    <img src={img.resultUrl} alt={`结果 ${idx + 1}`} />
                    <a href={img.resultUrl} download={`translated-${idx + 1}.png`}>
                      下载
                    </a>
                  </>
                ) : img.status === "failed" ? (
                  <p className="error">{img.error ?? "翻译失败"}</p>
                ) : (
                  <p className="batch-results__status">
                    {img.status === "processing" ? "处理中..." : "等待中"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Editor
          resultUrl={resultUrl}
          isLoading={singleLoading}
          onDownload={onDownload}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
