import { Board } from "./components/Board";
import { ColumnSettings } from "./components/ColumnSettings";
import { ConfirmDialog, Toasts } from "./components/Dialogs";
import { EditPanel } from "./components/EditPanel";
import { Footer, Header, NoticeBar } from "./components/Header";

export function App() {
  return (
    <div className="app">
      <Header />
      <NoticeBar />
      <main className="main" id="main">
        <h1 className="visually-hidden">Video board</h1>
        <Board />
      </main>
      <Footer />
      <EditPanel />
      <ColumnSettings />
      <ConfirmDialog />
      <Toasts />
    </div>
  );
}
