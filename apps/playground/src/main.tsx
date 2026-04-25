import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { parse, renderSvg } from "markhome";
import type { MarkHomeError } from "markhome";
import "./styles.css";

const DEFAULT_SOURCE = `# MarkHome MVP
# Text-first home layout notation, inspired by Markdown + Mermaid

home "Akcaabat Apartment" unit cm

room LivingRoom at 0,0 size 420x360 label "Living Room"
room BabyRoom right_of LivingRoom gap 20 size 300x280 label "Baby Room"
room Kitchen below LivingRoom gap 20 size 260x220 label "Kitchen"

window LivingRoom north at 110 size 180
window BabyRoom north at 70 size 140
window Kitchen south at 60 size 120

door LivingRoom east at 155 size 90 swing inward
door BabyRoom west at 100 size 80 swing inward
door Kitchen north at 90 size 80 swing inward

item sofa in LivingRoom at 55,245 size 230x75 label "Sofa"
item tv in LivingRoom at 150,25 size 120x28 label "TV"
item rug in LivingRoom at 115,135 size 190x120 label "Rug"
item crib in BabyRoom at 35,80 size 125x75 label "Crib"
item wardrobe in BabyRoom at 185,65 size 85x150 label "Wardrobe"
item table in Kitchen at 60,70 size 120x80 label "Table"

note LivingRoom "Keep 80cm walking path"
note BabyRoom "Crib away from window"`;

function encodeSource(source: string): string {
  return btoa(unescape(encodeURIComponent(source)));
}

function decodeSource(value: string): string | null {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return null;
  }
}

function initialSource(): string {
  const hash = window.location.hash;
  if (!hash.startsWith("#source=")) return DEFAULT_SOURCE;
  return decodeSource(hash.slice("#source=".length)) ?? DEFAULT_SOURCE;
}

function formatError(error: MarkHomeError): string {
  return error.line ? `Line ${error.line}: ${error.message}` : `Reference error: ${error.message}`;
}

function downloadSvg(svg: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "markhome-layout.svg";
  anchor.click();
  URL.revokeObjectURL(url);
}

function App(): React.ReactElement {
  const [source, setSource] = useState(initialSource);
  const [status, setStatus] = useState("");
  const parsed = useMemo(() => parse(source), [source]);
  const svg = useMemo(() => renderSvg(parsed, { height: "100%" }), [parsed]);

  useEffect(() => {
    if (!status) return;
    const timeout = window.setTimeout(() => setStatus(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [status]);

  function reset(): void {
    setSource(DEFAULT_SOURCE);
    window.history.replaceState(null, "", window.location.pathname);
    setStatus("Sample reset");
  }

  async function copySvg(): Promise<void> {
    await navigator.clipboard.writeText(svg);
    setStatus("SVG copied");
  }

  async function share(): Promise<void> {
    const nextUrl = `${window.location.origin}${window.location.pathname}#source=${encodeSource(source)}`;
    await navigator.clipboard.writeText(nextUrl);
    window.history.replaceState(null, "", nextUrl);
    setStatus("Share link copied");
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MarkHome v0.1 Playground</p>
          <h1>Markdown for simple 2D home layouts</h1>
        </div>
        <div className="actions" aria-label="Playground actions">
          <button type="button" onClick={reset}>Reset</button>
          <button type="button" onClick={copySvg}>Copy SVG</button>
          <button type="button" onClick={() => downloadSvg(svg)}>Download SVG</button>
          <button type="button" onClick={share}>Share</button>
        </div>
      </header>

      <section className="workspace" aria-label="MarkHome editor and preview">
        <div className="panel source-panel">
          <div className="panel-header">
            <div>
              <h2>Source</h2>
              <p>Commands: home, room, door, window, item, note</p>
            </div>
          </div>
          <textarea
            value={source}
            onChange={(event) => setSource(event.target.value)}
            spellCheck={false}
            aria-label="MarkHome source"
          />
        </div>

        <div className="panel preview-panel">
          <div className="panel-header split">
            <div>
              <h2>{parsed.home.name}</h2>
              <p>Unit: {parsed.home.unit}</p>
            </div>
            <div className="count">{parsed.rooms.length} rooms · {parsed.items.length} items</div>
          </div>
          <div className="preview-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
      </section>

      <section className="status-grid" aria-label="Parser status and grammar">
        <div className="status-panel">
          <h2>Parser Status</h2>
          {parsed.errors.length === 0 ? (
            <p className="ok">No errors. The MarkHome file is valid.</p>
          ) : (
            <ul className="error-list">
              {parsed.errors.map((error, index) => (
                <li key={`${formatError(error)}-${index}`}>{formatError(error)}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="status-panel grammar">
          <h2>MVP Grammar</h2>
          <pre>{`room Name at 0,0 size 420x360
room B right_of A gap 20 size 300x280
door Room east at 150 size 90
window Room north at 100 size 160
item sofa in Room at 50,240 size 220x80
note Room "Design note"`}</pre>
        </div>
      </section>

      <div className="toast" aria-live="polite">{status}</div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
