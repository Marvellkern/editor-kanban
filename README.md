# EditorKanban

A sketch-style kanban board for video editors. Track every client video from "brief received" to "delivered", with deadlines, revision rounds and video types built in.

- No login, no backend, no analytics. The board lives in the visitor's browser (`localStorage`).
- Fully static: deploy the `dist/` folder anywhere.
- Live at: `[DOMAIN]`

## Run locally

Requires Node 18+.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build

```bash
npm run build
```

Output goes to `dist/` (about 88 KB of gzipped JS). Preview the production build with `npm run preview`.

## Deploy as a static site

The build uses relative asset paths (`base: "./"`), so `dist/` works at a domain root or in a subfolder.

- **Netlify:** build command `npm run build`, publish directory `dist`.
- **Vercel:** framework preset "Vite" (build `npm run build`, output `dist`).
- **GitHub Pages:** run `npm run build` and publish `dist/` (for example with the `actions/deploy-pages` workflow, or push `dist/` to a `gh-pages` branch).

There are no environment variables and no server code.

## Placeholders

Every unknown value lives in **`src/config.ts`**:

| Constant       | What it is                 | Where it shows                                        |
| -------------- | -------------------------- | ----------------------------------------------------- |
| `PRODUCT_NAME` | The site's name (EditorKanban) | Header logo, page `<title>`, footer, Open Graph tags |
| `TAGLINE`      | One-line description (set) | Meta description, Open Graph description             |
| `DOMAIN`       | Final URL                  | `og:url` meta tag, this README                        |
| `CREDIT_LINK`  | Footer link (marvellkern.online) | Footer                                                |

`index.html` gets its values from `src/config.ts` at build time (see the small plugin in `vite.config.ts`), so you only edit them in one place. Still to fill in: `DOMAIN` (also update `[DOMAIN]` near the top of this README).

## How it works

| Area                          | Where                                                       |
| ----------------------------- | ----------------------------------------------------------- |
| Data model                    | `src/types.ts`                                              |
| Store + persistence + undo    | `src/store.ts` (Zustand; key `sketchkanban.board.v1`, 300 ms debounced save) |
| Validation (load + import)    | `src/lib/validate.ts`                                       |
| Default board + sample cards  | `src/lib/defaults.ts`                                       |
| Deadline states               | `src/lib/dates.ts`                                          |
| Export / import               | `src/lib/backup.ts`                                         |
| Hand-drawn outlines           | `src/sketch/SketchBox.tsx` (Rough.js, seeded per card, cached so outlines never re-wobble) |
| Drag and drop                 | `src/components/Board.tsx` (`@dnd-kit`: mouse, touch long-press, keyboard) |

If stored data is unreadable, the app keeps a copy under `sketchkanban.board.corrupt` and starts with a fresh default board.

### Keyboard

- **Tab** to a card. **Enter** opens it. **Space** picks it up, **arrow keys** move it, **Space** drops it, **Escape** cancels. Moves are announced to screen readers.
- Dialogs trap focus and close with **Escape**.
