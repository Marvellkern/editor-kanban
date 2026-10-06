import { useBoard, useUI } from "../store";
import { backupFilename } from "./dates";
import { validateBoard } from "./validate";

const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export function exportBoard() {
  const board = useBoard.getState().board;
  const blob = new Blob([JSON.stringify(board, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  useUI.getState().showToast({ message: `Saved ${a.download}` });
}

export async function importBoardFile(file: File) {
  const ui = useUI.getState();
  const fail = (why: string) =>
    ui.askConfirm({
      title: "That file didn't work",
      body: `We couldn't load “${file.name}” because ${why}. Your board hasn't changed.`,
      confirmLabel: "OK",
      alertOnly: true,
    });

  if (file.size > MAX_IMPORT_BYTES) return fail("it's much bigger than any board backup");
  let data: unknown;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return fail("it isn't a valid backup file (not readable JSON)");
  }
  const result = validateBoard(data);
  if (!result.ok) return fail(result.reason);

  const count = Object.keys(result.board.cards).length;
  ui.askConfirm({
    title: "Replace your board?",
    body: `This loads ${count} ${count === 1 ? "video" : "videos"} from “${file.name}” and replaces everything on your current board. Export first if you want to keep what's here.`,
    confirmLabel: "Replace board",
    danger: true,
    onConfirm: () => {
      ui.openCard(null);
      ui.openColumnSettings(null);
      useBoard.getState().replaceBoard(result.board);
      ui.showToast({ message: "Board imported" });
    },
  });
}
