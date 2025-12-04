import { useEffect, useState } from "react";

import { getStorageUrl, HistoryItem } from "../api/translateClient";
import { useHistory } from "../hooks/useHistory";

interface HistoryProps {
  onSelectItem?: (item: HistoryItem) => void;
}

export function History({ onSelectItem }: HistoryProps) {
  const { items, total, page, pages, isLoading, error, load, goToPage, remove } =
    useHistory();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗？")) return;
    setDeletingId(id);
    await remove(id);
    setDeletingId(null);
    if (selectedId === id) setSelectedId(null);
  };

  const handleSelect = (item: HistoryItem) => {
    setSelectedId(item.id);
    onSelectItem?.(item);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const langLabel = (code: string) => {
    const map: Record<string, string> = {
      zh: "中文",
      en: "英语",
      ja: "日语",
      ko: "韩语",
      fr: "法语",
      de: "德语",
      es: "西班牙语",
      ru: "俄语",
      auto: "自动",
    };
    return map[code] ?? code;
  };

  return (
    <div className="history">
      <header className="history__header">
        <h2>翻译历史</h2>
        <span className="history__count">共 {total} 条</span>
      </header>

      {error && <p className="error">{error}</p>}

      {isLoading && items.length === 0 ? (
        <p className="history__loading">加载中...</p>
      ) : items.length === 0 ? (
        <p className="history__empty">暂无翻译记录</p>
      ) : (
        <>
          <ul className="history__list">
            {items.map((item) => (
              <li
                key={item.id}
                className={`history__item ${selectedId === item.id ? "history__item--selected" : ""}`}
                onClick={() => handleSelect(item)}
              >
                <div className="history__thumb">
                  {item.result_url ? (
                    <img
                      src={getStorageUrl(item.result_url)}
                      alt="缩略图"
                      loading="lazy"
                    />
                  ) : (
                    <div className="history__thumb-placeholder">
                      {item.status === "failed" ? "失败" : "处理中"}
                    </div>
                  )}
                </div>
                <div className="history__info">
                  <p className="history__langs">
                    {langLabel(item.source_lang)} → {langLabel(item.target_lang)}
                  </p>
                  <p className="history__date">{formatDate(item.created_at)}</p>
                  <span
                    className={`history__status history__status--${item.status}`}
                  >
                    {item.status === "done"
                      ? "完成"
                      : item.status === "failed"
                        ? "失败"
                        : "处理中"}
                  </span>
                </div>
                <div className="history__actions">
                  {item.result_url && (
                    <a
                      href={getStorageUrl(item.result_url)}
                      download={`translated-${item.id}.png`}
                      onClick={(e) => e.stopPropagation()}
                      className="history__download"
                    >
                      下载
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    disabled={deletingId === item.id}
                    className="history__delete"
                  >
                    {deletingId === item.id ? "..." : "删除"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="history__pagination">
              <button
                type="button"
                disabled={page <= 1 || isLoading}
                onClick={() => goToPage(page - 1)}
              >
                上一页
              </button>
              <span>
                {page} / {pages}
              </span>
              <button
                type="button"
                disabled={page >= pages || isLoading}
                onClick={() => goToPage(page + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
