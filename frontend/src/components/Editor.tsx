interface EditorProps {
  resultUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
  onReset: () => void;
}

export function Editor({ resultUrl, isLoading, onDownload, onReset }: EditorProps) {
  return (
    <section className="editor">
      <header className="editor__header">
        <h2>翻译结果</h2>
        <div className="actions">
          <button onClick={onReset} disabled={isLoading}>
            重置
          </button>
          <button onClick={onDownload} disabled={!resultUrl || isLoading}>
            下载结果
          </button>
        </div>
      </header>

      <div className="editor__preview">
        {resultUrl ? (
          <img src={resultUrl} alt="翻译结果" />
        ) : (
          <p className="placeholder">请先上传并翻译图片</p>
        )}
      </div>
    </section>
  );
}
