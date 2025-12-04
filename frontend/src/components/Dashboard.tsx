import { ChangeEvent, useCallback, useState } from "react";

import { downloadBlob } from "../api/translateClient";
import { useTranslation } from "../hooks/useTranslation";
import { Editor } from "./Editor";

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

export function Dashboard() {
  const { translate, isLoading, error, resultBlob, resultUrl, reset } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("zh");
  const [field, setField] = useState<"e-commerce" | "general">("e-commerce");

  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) {
      setFile(null);
      return;
    }
    setFile(event.target.files[0]);
  }, []);

  const onTranslate = useCallback(async () => {
    if (!file) {
      return;
    }

    await translate(file, {
      sourceLang,
      targetLang,
      field,
      enablePostprocess: true,
    });
  }, [file, translate, sourceLang, targetLang, field]);

  const handleReset = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const onDownload = useCallback(() => {
    if (resultBlob) {
      downloadBlob(resultBlob);
    }
  }, [resultBlob]);

  return (
    <div className="dashboard">
      <section className="panel">
        <label className="block">
          <span>上传图片</span>
          <input type="file" accept="image/*" onChange={onFileChange} />
        </label>

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

        <button disabled={!file || isLoading} onClick={onTranslate}>
          {isLoading ? "翻译中..." : "开始翻译"}
        </button>
        {error && <p className="error">{error}</p>}
      </section>

      <Editor
        resultUrl={resultUrl}
        isLoading={isLoading}
        onDownload={onDownload}
        onReset={handleReset}
      />
    </div>
  );
}
