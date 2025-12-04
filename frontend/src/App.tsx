import { Dashboard } from "./components/Dashboard";

export function App() {
  return (
    <main className="app-shell">
      <header>
        <h1>跨境图片翻译</h1>
        <p>上传图片，选择语言，一键生成可下载的译图</p>
      </header>
      <Dashboard />
    </main>
  );
}
