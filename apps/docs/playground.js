import { parse, renderSvg } from "markhome";

const DEFAULT_SOURCE = `# MarkHome MVP
# Text-first home layout notation, inspired by Markdown + Mermaid

home "Akcaabat Apartment" unit cm

room LivingRoom at 0,0 size 420x360 cutout southeast 120x100 label "Living Room"
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

const source = document.querySelector("#source");
const preview = document.querySelector("#preview");
const status = document.querySelector("#status");
const homeName = document.querySelector("#home-name");
const homeMeta = document.querySelector("#home-meta");
const summary = document.querySelector("#summary");
const zoomLabel = document.querySelector("#zoom-label");
const toast = document.querySelector("#toast");

let currentSvg = "";
let toastTimer;
let zoom = 1;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function encodeSource(value) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeSource(value) {
  try {
    return decodeURIComponent(escape(atob(value)));
  } catch {
    return null;
  }
}

function initialSource() {
  const hash = window.location.hash;
  if (!hash.startsWith("#source=")) return DEFAULT_SOURCE;
  return decodeSource(hash.slice("#source=".length)) ?? DEFAULT_SOURCE;
}

function showToast(message) {
  toast.textContent = message;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.textContent = "";
  }, 2200);
}

function formatError(error) {
  return error.line ? `Line ${error.line}: ${error.message}` : `Reference error: ${error.message}`;
}

function clampZoom(value) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function paintPreview() {
  const size = `${zoom * 100}%`;
  preview.innerHTML = `<div class="preview-zoom-layer" style="width: ${size}; height: ${size};">${currentSvg}</div>`;
  zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
}

function setZoom(value) {
  zoom = clampZoom(value);
  paintPreview();
}

function render() {
  const ast = parse(source.value);
  currentSvg = renderSvg(ast, { height: "100%" });
  paintPreview();
  homeName.textContent = ast.home.name;
  homeMeta.textContent = `Unit: ${ast.home.unit}`;
  summary.textContent = `${ast.rooms.length} rooms · ${ast.items.length} items`;

  if (ast.errors.length === 0) {
    status.innerHTML = '<p class="ok">No errors. The MarkHome file is valid.</p>';
    return;
  }

  status.innerHTML = `<ul class="error-list">${ast.errors
    .map((error) => `<li>${formatError(error)}</li>`)
    .join("")}</ul>`;
}

function downloadSvg() {
  const blob = new Blob([currentSvg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "markhome-layout.svg";
  anchor.click();
  URL.revokeObjectURL(url);
}

source.value = initialSource();
source.addEventListener("input", render);

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  source.value = DEFAULT_SOURCE;
  window.history.replaceState(null, "", window.location.pathname);
  render();
  showToast("Sample reset");
});

document.querySelector('[data-action="copy"]').addEventListener("click", async () => {
  await navigator.clipboard.writeText(currentSvg);
  showToast("SVG copied");
});

document.querySelector('[data-action="download"]').addEventListener("click", downloadSvg);

document.querySelector('[data-action="zoom-out"]').addEventListener("click", () => {
  setZoom(zoom - ZOOM_STEP);
});

document.querySelector('[data-action="zoom-in"]').addEventListener("click", () => {
  setZoom(zoom + ZOOM_STEP);
});

document.querySelector('[data-action="zoom-reset"]').addEventListener("click", () => {
  setZoom(1);
});

document.querySelector('[data-action="share"]').addEventListener("click", async () => {
  const url = `${window.location.origin}${window.location.pathname}#source=${encodeSource(source.value)}`;
  await navigator.clipboard.writeText(url);
  window.history.replaceState(null, "", url);
  showToast("Share link copied");
});

render();
