/* Some browsers fire a click on the card right after a mouse drag ends; ignore it. */
let lastDragEnd = 0;

export function markDragEnd() {
  lastDragEnd = Date.now();
}

export function recentlyDragged() {
  return Date.now() - lastDragEnd < 250;
}
