# 📅 Wall Calendar — Interactive Component

A polished, physical wall-calendar aesthetic built as both a **React component** (`App.jsx`).

---

## ✨ Features

| Feature | Details |
|---|---|
| **Wall-calendar aesthetic** | Binding holes, tape strips, monthly hero image, paper-texture notes |
| **Day range selector** | Click start → hover preview → click end; visual states for start, end, in-range |
| **Notes per date/range** | Persisted to `localStorage`; label updates per selection |
| **Theme toggle** | Light ↔ Dark, accent palette changes per theme |
| **Page-flip animation** | CSS `perspective` + `rotateX` on month navigation |
| **Holiday markers** | Dot indicator + tooltip on known US holidays |
| **Today jump** | "TODAY" button appears when not on current month |
| **Fully responsive** | Side-by-side desktop → stacked mobile |
| **Curated monthly images** | Unsplash photos mood-matched to each month |

---

## 🚀 How to Run

### React component in a Next.js or Vite project

1. Copy `App.jsx` into your project's `components/` folder.
2. Install no extra dependencies (uses only React hooks + browser APIs).
3. Import and render:

```jsx
// pages/index.jsx  or  app/page.jsx
import App from "@/components/WallCalendar";
export default function Home() {
  return <App />;
}
```

Google Fonts (`Playfair Display`, `Lato`, `DM Mono`) are loaded inline via a `<style>` tag — no `next/font` config required.

---



## 🎨 Design Decisions

- **Aesthetic**: Editorial / refined print magazine. The calendar should feel like a physical object — hence the hole punches, binding strip, tape lines, and dotted-rule note lines.
- **Typography**: `Playfair Display` for the month title (authoritative, editorial), `DM Mono` for numbers and labels (precise, structured), `Lato` for notes (readable, neutral).
- **Accent color**: Deep red (`#c0392b`) in light mode → warm gold (`#c9a96e`) in dark mode. Both feel "premium print".
- **No backend**: All notes stored in `localStorage` keyed by date range or month.
- **Animation philosophy**: One well-orchestrated flip > scattered micro-interactions. The page-flip on month nav is the single high-impact moment.

---

## 📐 Responsive Breakpoint

| < 700 px | ≥ 700 px |
|---|---|
| Image stacked on top (210px tall) | Image panel (42% width) + calendar side-by-side |
| Month title slightly smaller | Full-size layout |
| Notes below calendar | Notes anchored to right panel bottom |

---

## 🧩 State Management

All state is vanilla React `useState` / plain JS variables:

- `vYear`, `vMonth` — current view
- `rangeStart`, `rangeEnd` — selected date objects `{ y, m, d, ts }`
- `selecting` — boolean; true while awaiting second click
- `hoverDay` — live hover target for range preview
- `notes` — `Record<string, string>` persisted via `localStorage`
