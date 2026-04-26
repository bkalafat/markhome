import { parse, renderSvg } from "markhome";

const EXAMPLES = {
  apartment: `# MarkHome MVP
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
note BabyRoom "Crib away from window"`,
  lroom: `# L-shaped room

home "L Room Example" unit cm

room LivingRoom at 0,0 size 460x360 cutout southeast 170x130 label "L Living"
room Study right_of LivingRoom gap 24 size 220x220 label "Study"

window LivingRoom north at 120 size 190
window LivingRoom west at 90 size 130
door LivingRoom east at 70 size 88 swing inward

item sofa in LivingRoom at 42,245 size 220x72 label "Sofa"
item rug in LivingRoom at 115,130 size 190x110 label "Rug"
item table in LivingRoom at 300,70 size 95x70 label "Desk"

note LivingRoom "Cutout creates L shape"`,
  studio: `# Studio apartment

home "Studio Apartment" unit cm

room Main at 0,0 size 520x390 cutout northeast 120x110 label "Main Space"
room Bath right_of Main gap 18 size 190x220 label "Bath"
room Entry below Bath gap 18 size 190x150 label "Entry"

window Main north at 145 size 210
window Main west at 90 size 140
door Main east at 265 size 90 swing inward
door Bath west at 85 size 72 swing inward
door Entry west at 48 size 80 swing inward

item sofa in Main at 45,245 size 210x72 label "Sofa"
item bed in Main at 320,230 size 150x110 label "Bed"
item table in Main at 185,122 size 110x80 label "Table"
item wardrobe in Main at 365,40 size 100x68 label "Storage"

note Main "Rooms can reference later definitions"`,
  baby: `# Baby room

home "Baby Room" unit cm

room BabyRoom at 0,0 size 300x280 label "Baby Room"

window BabyRoom north at 70 size 140
door BabyRoom west at 100 size 80 swing inward

item crib in BabyRoom at 35,80 size 125x75 label "Crib"
item wardrobe in BabyRoom at 185,65 size 85x150 label "Wardrobe"

note BabyRoom "Crib away from window"`
};

const DEFAULT_SOURCE = EXAMPLES.apartment;

const source = document.querySelector("#source");
const preview = document.querySelector("#preview");
const status = document.querySelector("#status");
const homeName = document.querySelector("#home-name");
const homeMeta = document.querySelector("#home-meta");
const summary = document.querySelector("#summary");
const zoomLabel = document.querySelector("#zoom-label");
const zoomSlider = document.querySelector("#zoom-slider");
const gridToggle = document.querySelector("#grid-toggle");
const exampleSelect = document.querySelector("#example-select");
const toast = document.querySelector("#toast");

let currentSvg = "";
let currentAst = null;
let toastTimer;
let zoom = 1;
let dragState = null;

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
  if (!hash.startsWith("#source=")) return localStorage.getItem("markhome-source") || DEFAULT_SOURCE;
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
  zoomSlider.value = String(Math.round(zoom * 100));
}

function setZoom(value) {
  zoom = clampZoom(value);
  paintPreview();
}

function render() {
  currentAst = parse(source.value);
  currentSvg = renderSvg(currentAst, { height: "100%", showGrid: gridToggle.checked });
  localStorage.setItem("markhome-source", source.value);
  paintPreview();

  homeName.textContent = currentAst.home.name;
  homeMeta.textContent = `Unit: ${currentAst.home.unit}`;
  summary.textContent = `${currentAst.rooms.length} rooms · ${currentAst.doors.length} doors · ${currentAst.windows.length} windows · ${currentAst.items.length} items`;

  if (currentAst.errors.length === 0) {
    const message = document.createElement("p");
    message.className = "ok";
    message.textContent = "No errors. The MarkHome file is valid.";
    status.replaceChildren(message);
    return;
  }

  const list = document.createElement("ul");
  list.className = "error-list";
  currentAst.errors.forEach((parserError) => {
    const item = document.createElement("li");
    item.textContent = formatError(parserError);
    list.append(item);
  });
  status.replaceChildren(list);
}

function downloadText(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadSvg() {
  downloadText("markhome-layout.svg", currentSvg, "image/svg+xml");
}

function downloadSource() {
  downloadText("layout.markhome", source.value, "text/plain");
}

function loadExample(name) {
  source.value = EXAMPLES[name] || DEFAULT_SOURCE;
  window.history.replaceState(null, "", window.location.pathname);
  render();
  showToast("Example loaded");
}

source.value = initialSource();
source.addEventListener("input", render);

exampleSelect.addEventListener("change", () => {
  loadExample(exampleSelect.value);
});

gridToggle.addEventListener("change", render);

zoomSlider.addEventListener("input", () => {
  setZoom(Number(zoomSlider.value) / 100);
});

preview.addEventListener("wheel", (event) => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  setZoom(zoom + (event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP));
});

preview.addEventListener("pointerdown", (event) => {
  dragState = {
    x: event.clientX,
    y: event.clientY,
    left: preview.scrollLeft,
    top: preview.scrollTop
  };
  preview.setPointerCapture(event.pointerId);
  preview.classList.add("is-panning");
});

preview.addEventListener("pointermove", (event) => {
  if (!dragState) return;
  preview.scrollLeft = dragState.left - (event.clientX - dragState.x);
  preview.scrollTop = dragState.top - (event.clientY - dragState.y);
});

preview.addEventListener("pointerup", () => {
  dragState = null;
  preview.classList.remove("is-panning");
});

preview.addEventListener("pointercancel", () => {
  dragState = null;
  preview.classList.remove("is-panning");
});

document.querySelector('[data-action="reset"]').addEventListener("click", () => {
  source.value = DEFAULT_SOURCE;
  exampleSelect.value = "apartment";
  window.history.replaceState(null, "", window.location.pathname);
  render();
  showToast("Sample reset");
});

document.querySelector('[data-action="copy-source"]').addEventListener("click", async () => {
  await navigator.clipboard.writeText(source.value);
  showToast("Source copied");
});

document.querySelector('[data-action="download-source"]').addEventListener("click", downloadSource);

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
