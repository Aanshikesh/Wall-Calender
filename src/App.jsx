import { useState, useEffect, useRef, useCallback } from "react";

// ─── Utilities ───────────────────────────────────────────────────────────────
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Curated Unsplash monthly images (landscape, mood-matched)
const MONTH_IMAGES = [
  { url: "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=900&auto=format&fit=crop", label: "Winter Stillness" },
  { url: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&auto=format&fit=crop", label: "Soft Light" },
  { url: "https://images.unsplash.com/photo-1617184003170-1f266c325ff3?q=80&w=687&auto=format&fit=crop", label: "Colorful life" },
  { url: "https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=900&auto=format&fit=crop", label: "Spring Rain" },
  { url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=900&auto=format&fit=crop", label: "Golden Hour" },
  { url: "https://plus.unsplash.com/premium_photo-1682535209719-839f625f8770?q=80&w=692&auto=format&fit=crop", label: "Midsummer" },
  { url: "https://plus.unsplash.com/premium_photo-1680995369588-502d70f0e3c8?q=80&w=687&auto=format&fit=crop", label: "Coastal Drift" },
  { url: "https://plus.unsplash.com/premium_photo-1668967516060-624b8a7021f4?q=80&w=687&auto=format&fit=crop", label: "Late August" },
  { url: "https://images.unsplash.com/photo-1444492417251-9c84a5fa18e0?q=80&w=735&auto=format&fit=crop", label: "Autumn Amber" },
  { url: "https://plus.unsplash.com/premium_photo-1663045269127-9a9c3da2c178?q=80&w=687&auto=format&fit=crop", label: "Harvest Fog" },
  { url: "https://images.unsplash.com/photo-1542202229-7d93c33f5d07?w=900&auto=format&fit=crop", label: "Bare Trees" },
  { url: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=900&auto=format&fit=crop", label: "Year's End" },
];

// Simple US holidays
const HOLIDAYS = {
  "1-1": "New Year's Day",
  "7-4": "Independence Day",
  "12-25": "Christmas",
  "12-31": "New Year's Eve",
  "11-11": "Veterans Day",
  "2-14": "Valentine's Day",
  "3-17": "St. Patrick's Day",
  "10-31": "Halloween",
};

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.y === b.y && a.m === b.m && a.d === b.d;
}
function isInRange(day, start, end) {
  if (!start || !end) return false;
  const [s, e] = start.ts <= end.ts ? [start, end] : [end, start];
  return day.ts > s.ts && day.ts < e.ts;
}
function makeDay(y, m, d) {
  return { y, m, d, ts: new Date(y, m, d).getTime() };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useNotes() {
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cal_notes") || "{}"); } catch { return {}; }
  });
  const save = useCallback((key, val) => {
    setNotes(prev => {
      const next = { ...prev, [key]: val };
      localStorage.setItem("cal_notes", JSON.stringify(next));
      return next;
    });
  }, []);
  return [notes, save];
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function HolePunch({ count = 3 }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-around", padding: "0 40px", position: "relative", zIndex: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)",
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.08)",
          border: "1px solid #111",
        }} />
      ))}
    </div>
  );
}

function MonthNavButton({ dir, onClick }) {
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <button onClick={onClick} style={{
      background: isHovering ? "var(--hover-bg)" : "none", 
      border: "none", 
      cursor: "pointer",
      width: 36, height: 36, borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: isHovering ? "var(--accent)" : "var(--text-secondary)",
      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
      fontSize: 18,
      transform: isHovering ? "scale(1.1)" : "scale(1)",
    }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {dir === "prev" ? "‹" : "›"}
    </button>
  );
}

function DatePickerModal({ visible, month, year, onMonthChange, onYearChange, onConfirm, onCancel }) {
  return visible ? (
    <div className="date-picker-overlay" onClick={onCancel}>
      <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Jump to Date</h2>
        
        <div className="date-picker-section">
          <label>Month</label>
          <select 
            className="date-picker-input" 
            value={month} 
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="date-picker-section">
          <label>Year</label>
          <input 
            type="number" 
            className="date-picker-input" 
            value={year}
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            min="1900"
            max="2100"
          />
        </div>

        <div className="date-picker-buttons">
          <button className="date-picker-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="date-picker-btn apply" onClick={onConfirm}>Go</button>
        </div>
      </div>
    </div>
  ) : null;
}

function DayCell({ day, isToday, isStart, isEnd, isInRange, isOtherMonth, isSelecting, holiday, onClick, onHover }) {
  const bg = isStart || isEnd ? "var(--accent)" :
    isInRange ? "var(--range-bg)" : "transparent";
  const color = isStart || isEnd ? "#fff" : isOtherMonth ? "var(--text-muted)" : "var(--text-primary)";
  const radiusStyle = isStart
    ? { borderRadius: "50% 0 0 50%" }
    : isEnd
      ? { borderRadius: "0 50% 50% 0" }
      : isInRange
        ? { borderRadius: 0 }
        : { borderRadius: "50%" };

  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovering(true);
        onHover();
      }}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 40,
        background: isHovering && !isOtherMonth ? "rgba(201, 169, 110, 0.08)" : bg,
        ...((isStart || isEnd) ? { borderRadius: "50%" } : radiusStyle),
        cursor: isOtherMonth ? "default" : "pointer",
        userSelect: "none",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        transform: isHovering && !isOtherMonth ? "scale(1.08)" : "scale(1)",
      }}
    >
      <span style={{
        width: 32, height: 32,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: "50%",
        fontSize: "0.8rem",
        fontFamily: "var(--font-mono)",
        fontWeight: isToday ? 700 : isStart || isEnd ? 700 : 400,
        color,
        border: isToday && !isStart && !isEnd ? "1.5px solid var(--accent)" : "none",
        background: isStart || isEnd ? "var(--accent)" : "transparent",
        boxShadow: isStart || isEnd ? "0 4px 16px var(--accent-glow)" : isHovering ? "0 2px 8px rgba(0,0,0,0.1)" : "none",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        position: "relative", zIndex: 2,
      }}>
        {day.d}
      </span>
      {holiday && (
        <div style={{
          position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)",
          width: 5, height: 5, borderRadius: "50%", background: "var(--holiday-dot)",
          animation: isHovering ? "bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) infinite" : "none",
        }} />
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function App() {
  const today = { y: new Date().getFullYear(), m: new Date().getMonth(), d: new Date().getDate() };
  const [viewYear, setViewYear] = useState(today.y);
  const [viewMonth, setViewMonth] = useState(today.m);
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);
  const [hoverDay, setHoverDay] = useState(null);
  const [selecting, setSelecting] = useState(false); // awaiting second click
  const [theme, setTheme] = useState("light");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const [activeNoteKey, setActiveNoteKey] = useState(null);
  const [notes, saveNote] = useNotes();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(viewMonth);
  const [pickerYear, setPickerYear] = useState(viewYear);
  const imgRef = useRef();

  const monthImg = MONTH_IMAGES[viewMonth];
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build calendar grid
  const cells = [];
  const prevDays = getDaysInMonth(viewYear, viewMonth - 1 < 0 ? 11 : viewMonth - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    const m = viewMonth - 1 < 0 ? 11 : viewMonth - 1;
    const y = viewMonth - 1 < 0 ? viewYear - 1 : viewYear;
    cells.push({ day: makeDay(y, m, prevDays - i), other: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: makeDay(viewYear, viewMonth, d), other: false });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth + 1 > 11 ? 0 : viewMonth + 1;
    const y = viewMonth + 1 > 11 ? viewYear + 1 : viewYear;
    cells.push({ day: makeDay(y, m, d), other: true });
  }

  // Effective end for hover-previewing
  const effectiveEnd = selecting ? hoverDay : rangeEnd;

  const handleDayClick = (day) => {
    if (!selecting) {
      setRangeStart(day);
      setRangeEnd(null);
      setSelecting(true);
      const key = `range_${day.y}_${day.m + 1}_${day.d}`;
      setActiveNoteKey(key);
    } else {
      // If click same as start → deselect
      if (isSameDay(day, rangeStart)) {
        setSelecting(false);
        return;
      }
      setRangeEnd(day);
      setSelecting(false);
      const [s, e] = rangeStart.ts <= day.ts ? [rangeStart, day] : [day, rangeStart];
      const key = `range_${s.y}_${s.m + 1}_${s.d}_${e.y}_${e.m + 1}_${e.d}`;
      setActiveNoteKey(key);
    }
  };

  const navigate = (dir) => {
    setFlipping(true);
    setImgLoaded(false);
    setTimeout(() => {
      if (dir === "prev") {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
      } else {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
      }
      setFlipping(false);
      setRangeStart(null); setRangeEnd(null); setSelecting(false); setHoverDay(null);
    }, 400);
  };

  const handleDatePickerConfirm = () => {
    setFlipping(true);
    setImgLoaded(false);
    setTimeout(() => {
      setViewMonth(pickerMonth);
      setViewYear(pickerYear);
      setFlipping(false);
      setShowDatePicker(false);
      setRangeStart(null); setRangeEnd(null); setSelecting(false); setHoverDay(null);
    }, 400);
  };

  const openDatePicker = () => {
    setPickerMonth(viewMonth);
    setPickerYear(viewYear);
    setShowDatePicker(true);
  };

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wall-calendar-notes-${viewYear}-${viewMonth + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDays = rangeStart && effectiveEnd
    ? Math.abs(Math.floor((effectiveEnd.ts - rangeStart.ts) / 86400000)) + 1
    : 0;
  const noteKey = activeNoteKey || `month_${viewYear}_${viewMonth + 1}`;
  const notePreview = notes[noteKey] ? notes[noteKey].split('\n')[0] : "none";
  const noteSummary = notePreview.length > 24 ? `${notePreview.slice(0, 24)}…` : notePreview;

  const noteLabel = rangeStart && rangeEnd
    ? `${MONTHS[rangeStart.m].slice(0, 3)} ${rangeStart.d} → ${MONTHS[rangeEnd.m].slice(0, 3)} ${rangeEnd.d}`
    : rangeStart
      ? `${MONTHS[rangeStart.m].slice(0, 3)} ${rangeStart.d} (selecting…)`
      : `${MONTHS[viewMonth]} ${viewYear}`;

  const isDark = theme === "dark";

  // CSS vars injected inline via a style tag equivalent in the root
  const cssVars = isDark ? {
    "--bg": "#141414",
    "--paper": "#1e1e1e",
    "--card": "#252525",
    "--border": "#333",
    "--text-primary": "#e8e4dc",
    "--text-secondary": "#888",
    "--text-muted": "#555",
    "--accent": "#c9a96e",
    "--accent-glow": "rgba(201,169,110,0.35)",
    "--range-bg": "rgba(201,169,110,0.15)",
    "--hover-bg": "rgba(255,255,255,0.06)",
    "--holiday-dot": "#e07070",
    "--note-bg": "#1a1a1a",
    "--shadow": "0 8px 40px rgba(0,0,0,0.5)",
    "--font-display": "'Playfair Display', Georgia, serif",
    "--font-body": "'Lato', sans-serif",
    "--font-mono": "'DM Mono', monospace",
    "--paper-texture": "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(255,255,255,0.02) 25px)",
  } : {
    "--bg": "#f0ebe3",
    "--paper": "#faf8f5",
    "--card": "#fff",
    "--border": "#e2ddd5",
    "--text-primary": "#1a1814",
    "--text-secondary": "#888",
    "--text-muted": "#bbb",
    "--accent": "#c0392b",
    "--accent-glow": "rgba(192,57,43,0.3)",
    "--range-bg": "rgba(192,57,43,0.08)",
    "--hover-bg": "rgba(0,0,0,0.04)",
    "--holiday-dot": "#e67e22",
    "--note-bg": "#fdfaf6",
    "--shadow": "0 8px 40px rgba(0,0,0,0.12)",
    "--font-display": "'Playfair Display', Georgia, serif",
    "--font-body": "'Lato', sans-serif",
    "--font-mono": "'DM Mono', monospace",
    "--paper-texture": "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(0,0,0,0.018) 25px)",
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&family=DM+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: var(--bg); }

        .cal-root { font-family: var(--font-body); }

        .cal-card {
          background: var(--paper);
          border-radius: 4px 4px 2px 2px;
          box-shadow: var(--shadow), 0 2px 0 var(--accent), inset 0 0 0 1px rgba(255,255,255,0.5);
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .cal-flip {
          animation: wallCalendarFlip 0.8s cubic-bezier(0.35, 0, 0.25, 1) forwards;
          transform-origin: bottom center;
        }

        @keyframes wallCalendarFlip {
          0% { 
            transform: perspective(1600px) rotateX(0deg) rotateZ(0deg);
            opacity: 1;
          }
          30% {
            transform: perspective(1600px) rotateX(-35deg) rotateZ(-2deg);
            opacity: 0.9;
          }
          60% {
            transform: perspective(1600px) rotateX(-65deg) rotateZ(1deg);
            opacity: 0.8;
          }
          85% {
            transform: perspective(1600px) rotateX(-25deg) rotateZ(-1deg);
            opacity: 0.95;
          }
          100% { 
            transform: perspective(1600px) rotateX(0deg) rotateZ(0deg);
            opacity: 1;
          }
        }

        .img-panel {
          position: relative;
          overflow: hidden;
          background: #1a1a1a;
        }

        .img-panel img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                      transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                      filter 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          filter: brightness(0.95);
        }

        .img-panel img.loaded { 
          transform: scale(1.05);
          filter: brightness(1);
        }

        .img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%);
        }

        .img-label {
          position: absolute;
          bottom: 14px; left: 18px;
          font-family: var(--font-display);
          font-style: italic;
          color: rgba(255,255,255,0.75);
          font-size: 0.78rem;
          letter-spacing: 0.08em;
        }

        .img-theme-btn {
          position: absolute;
          top: 12px; right: 12px;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          color: #fff;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          cursor: pointer;
          backdrop-filter: blur(4px);
          font-family: var(--font-body);
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .img-theme-btn:hover { 
          background: rgba(0,0,0,0.65);
          transform: scale(1.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .img-theme-btn:active {
          transform: scale(0.96);
        }

        .grid-panel {
          padding: 20px 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeIn 0.4s ease-out;
        }

        .month-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .month-title {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .month-year {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          color: var(--accent);
          letter-spacing: 0.15em;
          margin-top: 3px;
          display: block;
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .top-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-bottom: 20px;
        }

        .hero-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 14px;
          flex-wrap: wrap;
        }

        .app-title {
          font-family: var(--font-display);
          font-size: 2rem;
          color: var(--text-primary);
          line-height: 1.05;
        }

        .app-subtitle {
          font-family: var(--font-body);
          color: var(--text-secondary);
          margin-top: 8px;
          font-size: 0.95rem;
        }

        .top-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .export-btn,
        .theme-btn {
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 10px 14px;
          background: var(--card);
          color: var(--text-primary);
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
        }

        .export-btn:hover,
        .theme-btn:hover {
          background: var(--hover-bg);
          border-color: var(--accent);
          color: var(--accent);
          transform: translateY(-1px);
        }

        .summary-panels {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .summary-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 18px 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        .summary-label {
          font-family: var(--font-mono);
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 10px;
        }

        .summary-value {
          font-family: var(--font-display);
          font-size: 1.8rem;
          color: var(--text-primary);
          font-weight: 700;
        }

        .summary-caption {
          margin-top: 6px;
          font-family: var(--font-body);
          font-size: 0.78rem;
          color: var(--text-secondary);
        }

        @media (max-width: 820px) {
          .summary-panels {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .hero-header {
            align-items: flex-start;
          }

          .top-actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .export-btn,
          .theme-btn {
            width: auto;
          }

          .summary-panels {
            grid-template-columns: 1fr;
          }
        }

        .day-headers {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          animation: fadeIn 0.4s ease-out;
        }

        .day-header-cell {
          text-align: center;
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
          padding-bottom: 6px;
          border-bottom: 1px solid var(--border);
          transition: all 0.3s ease;
        }

        .day-header-cell.weekend { 
          color: var(--accent);
          transition: all 0.3s ease;
        }

        .day-header-cell:hover {
          color: var(--accent);
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .days-grid > div {
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Notes section */
        .notes-section {
          border-top: 1px dashed var(--border);
          padding: 14px 20px 20px;
          background: var(--note-bg);
          background-image: var(--paper-texture);
          animation: fadeIn 0.4s ease-out;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .notes-label {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: var(--accent);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .notes-range-tag {
          font-family: var(--font-body);
          font-size: 0.68rem;
          color: var(--text-secondary);
          letter-spacing: 0;
          text-transform: none;
        }

        .notes-textarea {
          width: 100%;
          min-height: 80px;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-body);
          font-size: 0.85rem;
          line-height: 1.7;
          color: var(--text-primary);
          caret-color: var(--accent);
          padding: 2px 0;
          transition: all 0.3s ease;
        }

        .notes-textarea:focus {
          border-bottom: 1px solid var(--accent);
          transform: translateX(2px);
        }

        .notes-textarea::placeholder {
          color: var(--text-muted);
          font-style: italic;
          transition: color 0.3s ease;
        }

        .notes-line {
          border: none;
          border-bottom: 1px solid var(--border);
          margin: 4px 0;
          height: 26px;
          pointer-events: none;
          position: absolute;
          left: 20px; right: 20px;
        }

        /* Legend */
        .legend {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          padding: 8px 20px 12px;
          border-top: 1px solid var(--border);
          animation: fadeIn 0.4s ease-out;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--text-secondary);
          letter-spacing: 0.06em;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .legend-item:hover {
          color: var(--accent);
          transform: translateX(2px);
        }

        /* Responsive layout */
        .cal-layout {
          display: flex;
          flex-direction: column;
        }

        @media (min-width: 720px) {
          .cal-layout {
            flex-direction: row;
          }
          .img-panel {
            width: 42%;
            min-height: 420px;
            flex-shrink: 0;
          }
          .cal-right {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
        }

        @media (max-width: 719px) {
          .img-panel { height: 200px; }
          .month-title { font-size: 1.3rem; }
        }

        /* Date Picker Modal */
        .date-picker-overlay {
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.76);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
          backdrop-filter: blur(6px);
        }

        .date-picker-modal {
          background: rgba(12, 18, 32, 0.98);
          color: #fff;
          border-radius: 12px;
          padding: 28px;
          width: min(420px, calc(100vw - 32px));
          max-width: 420px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.16);
          animation: slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .date-picker-modal h2 {
          font-family: var(--font-display);
          font-size: 1.4rem;
          color: #fff;
          margin-bottom: 18px;
          text-align: center;
          letter-spacing: 0.02em;
        }

        .date-picker-section {
          margin-bottom: 18px;
        }

        .date-picker-section label {
          display: block;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: #fff;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
          opacity: 0.8;
        }

        .date-picker-input {
          width: 100%;
          padding: 12px 14px;
          font-size: 1rem;
          border: 1px solid rgba(255,255,255,0.24);
          border-radius: 8px;
          background: rgba(255,255,255,0.06);
          color: #fff;
          font-family: var(--font-body);
          transition: all 0.2s ease;
          appearance: none;
        }

        .date-picker-input:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 16px rgba(0,212,255,0.3);
        }

        .date-picker-input option {
          background: rgba(0,0,0,0.9);
          color: #fff;
        }

        .date-picker-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .date-picker-btn {
          flex: 1;
          padding: 12px 0;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 8px;
          font-family: var(--font-mono);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(255,255,255,0.08);
          color: #fff;
        }

        .date-picker-btn.cancel {
          color: #dcdcdc;
        }

        .date-picker-btn.cancel:hover {
          background: var(--hover-bg);
          color: var(--text-primary);
        }

        .date-picker-btn.apply {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }

        .date-picker-btn.apply:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 24px rgba(201,169,110,0.22);
        }

        .date-picker-btn:active {
          transform: translateY(0);
        }

        .date-picker-jump-btn {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--text-primary);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
          letter-spacing: 0.08em;
          transition: all 0.2s ease;
        }
        .date-picker-jump-btn:hover { 
          background: var(--accent);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        }
        .date-picker-jump-btn:active {
          transform: translateY(0);
        }

        .clear-btn {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: var(--text-muted);
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 0.08em;
          padding: 0;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .clear-btn:hover { 
          color: var(--accent);
          transform: scale(1.1);
        }
        .clear-btn:active {
          transform: scale(0.95);
        }

        /* Today jump */
        .today-btn {
          font-family: var(--font-mono);
          font-size: 0.62rem;
          color: var(--accent);
          background: none;
          border: 1px solid var(--accent);
          border-radius: 3px;
          padding: 2px 7px;
          cursor: pointer;
          letter-spacing: 0.1em;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .today-btn:hover { 
          background: var(--accent); 
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(192,57,43,0.3);
        }
        .today-btn:active {
          transform: translateY(0);
        }

        .selecting-hint {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--accent);
          letter-spacing: 0.08em;
          text-align: center;
          animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite, slideDown 0.4s ease-out;
          margin-bottom: 8px;
        }
        @keyframes pulse { 
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          } 
          50% { 
            opacity: 1;
            transform: scale(1.02);
          } 
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
      `}</style>

      <div className="cal-root" style={cssVars}>
        {/* Outer wrapper — centered on page */}
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          background: "var(--bg)",
          backgroundImage: isDark
            ? "radial-gradient(ellipse at 20% 80%, rgba(201,169,110,0.06) 0%, transparent 60%)"
            : "radial-gradient(ellipse at 80% 20%, rgba(192,57,43,0.05) 0%, transparent 60%)",
        }}>
          <div style={{ width: "100%", maxWidth: 860 }}>

            <div className="top-panel">
              <div className="hero-header">
                <div>
                  <div className="app-title">Wall Calendar</div>
                  <div className="app-subtitle">Select dates · Write notes</div>
                </div>
                <div className="top-actions">
                  <button className="export-btn" onClick={exportNotes}>↓ Export Notes</button>
                  <button className="theme-btn" onClick={() => setTheme(t => t === "light" ? "dark" : "light")}>{isDark ? "☀" : "☾"}</button>
                </div>
              </div>
              <div className="summary-panels">
                <div className="summary-card">
                  <div className="summary-label">MONTH</div>
                  <div className="summary-value">{MONTHS[viewMonth]}</div>
                  <div className="summary-caption">{viewYear}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">DAYS</div>
                  <div className="summary-value">{daysInMonth}</div>
                  <div className="summary-caption">in {MONTHS[viewMonth]}</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">SELECTED</div>
                  <div className="summary-value">{selectedDays}</div>
                  <div className="summary-caption">days</div>
                </div>
                <div className="summary-card">
                  <div className="summary-label">NOTE</div>
                  <div className="summary-value">{noteSummary || '—'}</div>
                  <div className="summary-caption">{noteSummary === 'none' ? 'none' : 'preview'}</div>
                </div>
              </div>
            </div>

            {/* Binding strip / tape look */}
            <div style={{
              height: 14,
              background: `repeating-linear-gradient(90deg, var(--accent) 0px, var(--accent) 60px, transparent 60px, transparent 70px)`,
              opacity: 0.25,
              borderRadius: "4px 4px 0 0",
            }} />

            {/* Hole punches */}
            <div style={{ background: isDark ? "#222" : "#d8d2cb", padding: "6px 0" }}>
              <HolePunch count={5} />
            </div>

            {/* Main card */}
            <div className={`cal-card ${flipping ? "cal-flip" : ""}`}>
              <div className="cal-layout">

                {/* ── Image Panel ── */}
                <div className="img-panel">
                  <img
                    ref={imgRef}
                    key={`${viewYear}-${viewMonth}`}
                    src={monthImg.url}
                    alt={monthImg.label}
                    onLoad={() => setImgLoaded(true)}
                    className={imgLoaded ? "loaded" : ""}
                    style={{ opacity: imgLoaded ? 1 : 0 }}
                  />
                  <div className="img-overlay" />
                  <span className="img-label">{monthImg.label}</span>
                  <button
                    className="img-theme-btn"
                    onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
                  >
                    {isDark ? "☀ LIGHT" : "☾ DARK"}
                  </button>
                </div>

                {/* ── Right Panel ── */}
                <div className="cal-right">

                  {/* Grid section */}
                  <div className="grid-panel">

                    {/* Month header */}
                    <div className="month-header">
                      <div>
                        <div className="month-title">{MONTHS[viewMonth]}</div>
                        <span className="month-year">{viewYear}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {(viewYear !== today.y || viewMonth !== today.m) && (
                          <button className="today-btn" onClick={() => {
                            setFlipping(true);
                            setTimeout(() => {
                              setViewYear(today.y); setViewMonth(today.m);
                              setFlipping(false);
                            }, 400);
                          }}>TODAY</button>
                        )}
                        <button className="date-picker-jump-btn" onClick={openDatePicker}>📅</button>
                        <MonthNavButton dir="prev" onClick={() => navigate("prev")} />
                        <MonthNavButton dir="next" onClick={() => navigate("next")} />
                      </div>
                    </div>

                    {/* Selecting hint */}
                    {selecting && (
                      <div className="selecting-hint">↗ Click an end date to complete your selection</div>
                    )}

                    {/* Day-of-week headers */}
                    <div className="day-headers">
                      {DAYS_SHORT.map((d, i) => (
                        <div key={d} className={`day-header-cell ${i === 0 || i === 6 ? "weekend" : ""}`}>{d}</div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="days-grid">
                      {cells.map(({ day, other }, idx) => {
                        const isToday = !other && isSameDay(day, { y: today.y, m: today.m, d: today.d, ts: new Date(today.y, today.m, today.d).getTime() });
                        const isStart = isSameDay(day, rangeStart);
                        const isEnd = effectiveEnd ? isSameDay(day, effectiveEnd) : false;
                        const inRange = isInRange(day, rangeStart, effectiveEnd);
                        const holiday = !other ? HOLIDAYS[`${day.m + 1}-${day.d}`] : null;

                        return (
                          <div key={idx} title={holiday || undefined}>
                            <DayCell
                              day={day}
                              isToday={isToday}
                              isStart={isStart}
                              isEnd={isEnd && !isSameDay(effectiveEnd, rangeStart)}
                              isInRange={inRange}
                              isOtherMonth={other}
                              isSelecting={selecting}
                              holiday={holiday}
                              onClick={() => !other && handleDayClick(day)}
                              onHover={() => selecting && !other && setHoverDay(day)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="legend">
                    {[
                      { dot: "var(--accent)", label: "Selected" },
                      { dot: "var(--range-bg)", label: "Range", border: `1px solid var(--accent)` },
                      { dot: "var(--holiday-dot)", label: "Holiday" },
                    ].map(({ dot, label, border }) => (
                      <div key={label} className="legend-item">
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, border: border || "none", flexShrink: 0 }} />
                        {label}
                      </div>
                    ))}
                    {(rangeStart || rangeEnd) && (
                      <button className="clear-btn" style={{ marginLeft: "auto" }} onClick={() => {
                        setRangeStart(null); setRangeEnd(null); setSelecting(false);
                        setActiveNoteKey(`month_${viewYear}_${viewMonth + 1}`);
                      }}>
                        × CLEAR
                      </button>
                    )}
                  </div>

                  {/* Notes section */}
                  <div className="notes-section" style={{ flex: 1 }}>
                    <div className="notes-label">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <rect x="1" y="1" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                        <line x1="3" y1="4" x2="7" y2="4" stroke="currentColor" strokeWidth="1"/>
                        <line x1="3" y1="6" x2="6" y2="6" stroke="currentColor" strokeWidth="1"/>
                      </svg>
                      NOTES
                      <span className="notes-range-tag">— {noteLabel}</span>
                    </div>
                    <textarea
                      className="notes-textarea"
                      placeholder="Jot something down…"
                      value={notes[noteKey] || ""}
                      onChange={e => saveNote(noteKey, e.target.value)}
                      rows={4}
                    />
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom shadow strip */}
            <div style={{
              height: 8,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)",
              borderRadius: "0 0 6px 6px",
            }} />

            <div style={{
              marginTop: 0,
              textAlign: "center",
              fontFamily: "var(--font-body)",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              letterSpacing: "0.04em",
            }}>
              © {viewYear} Wall Calendar • Made with ❤️Aanshikesh Rawat
            </div>

          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      <DatePickerModal 
        visible={showDatePicker}
        month={pickerMonth}
        year={pickerYear}
        onMonthChange={setPickerMonth}
        onYearChange={setPickerYear}
        onConfirm={handleDatePickerConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
    </>
  );
}
