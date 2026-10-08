import { Board } from "./components/Board";
import { ColumnSettings } from "./components/ColumnSettings";
import { ConfirmDialog, Toasts } from "./components/Dialogs";
import { EditPanel } from "./components/EditPanel";
import { Footer, Header, NoticeBar } from "./components/Header";
import { useUI } from "./store";
import { useEffect } from "react";

export function App() {
  const blur = useUI((s) => s.blur);

  // On <html> so dialogs and toasts (portaled to <body>) pick it up too.
  useEffect(() => {
    document.documentElement.classList.toggle("is-blurred", blur);
  }, [blur]);

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
