import { useState } from "react";

import { Dashboard } from "./components/Dashboard";
import { History } from "./components/History";

type TabType = "translate" | "history";

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>("translate");

  return (
    <main className="app-shell">
      <header>
        <h1>跨境图片翻译</h1>
        <p>上传图片，选择语言，一键生成可下载的译图</p>
        <nav className="app-nav">
          <button
            type="button"
            className={activeTab === "translate" ? "active" : ""}
            onClick={() => setActiveTab("translate")}
          >
            翻译
          </button>
          <button
            type="button"
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            历史记录
          </button>
        </nav>
      </header>
      {activeTab === "translate" ? <Dashboard /> : <History />}
    </main>
  );
}
