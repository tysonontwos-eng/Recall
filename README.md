# Recall

A mobile-first web app for memorizing text passages. Inspired by the Verses app.

- **Quick Mode** — treat the whole text as one passage and run the full 5-game sequence.
- **Long Mode** — auto-splits longer texts into sections with a progressive learning structure.

Built with React + Vite. All state stored in `localStorage`. Deploys as a static site on GitHub Pages.

---

## Running locally

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173/Recall/](http://localhost:5173/Recall/) in your browser.

---

## Deploying to GitHub Pages

### 1. Create a GitHub repository

Create a new repo (e.g. `Recall`) on GitHub.

### 2. Match the repo name in `vite.config.js`

```js
// vite.config.js
const REPO_NAME = "Recall"  // ← must exactly match your GitHub repo name
```

### 3. Push your code

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/Recall.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 4. Deploy

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to the `gh-pages` branch.

### 5. Enable GitHub Pages

In your repo's **Settings → Pages**, set:
- Source: **Deploy from a branch**
- Branch: **gh-pages** / `/ (root)`

Your app will be live at: `https://YOUR_USERNAME.github.io/Recall/`

---

## Tech stack

| | |
|---|---|
| Framework | React 19 + Vite 7 |
| Drag-and-drop | [@dnd-kit](https://dndkit.com) |
| Deployment | [gh-pages](https://github.com/tschaub/gh-pages) |
| Storage | `localStorage` (no backend) |
| Styling | Plain CSS with custom properties |

---

## The 5 games

1. **Tap to Reveal** — tap each word to reveal it
2. **Reorder** — drag blocks into the correct order
3. **Word Bank** — fill blanks from a shuffled word bank
4. **First Letter** — every word is shown as its first letter
5. **Full Recall** — type the full passage from memory
