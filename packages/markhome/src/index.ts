import { parse } from "@bkalafat/markhome-core";
import { renderSvg } from "@bkalafat/markhome-svg";
import type { MarkHomeAst } from "@bkalafat/markhome-core";
import type { RenderOptions } from "@bkalafat/markhome-svg";

export type InitializeOptions = {
  startOnLoad?: boolean;
  selector?: string;
  renderOptions?: RenderOptions;
};

export type { MarkHomeAst, MarkHomeDoor, MarkHomeError, MarkHomeHome, MarkHomeItem, MarkHomeNote, MarkHomeRoom, MarkHomeWindow } from "@bkalafat/markhome-core";
export type { RenderOptions } from "@bkalafat/markhome-svg";
export { parse, renderSvg };

export function render(source: string, options?: RenderOptions): string {
  return renderSvg(parse(source), options);
}

function renderElement(element: Element, options?: RenderOptions): void {
  const source = element.textContent ?? "";
  const ast = parse(source);
  element.innerHTML = renderSvg(ast, options);
  element.setAttribute("data-markhome-processed", "true");
}

function renderAll(options: InitializeOptions = {}): void {
  const selector = options.selector ?? ".markhome";
  document.querySelectorAll(selector).forEach((element) => {
    if (element.getAttribute("data-markhome-processed") === "true") return;
    renderElement(element, options.renderOptions);
  });
}

export function initialize(options: InitializeOptions = {}): void {
  if (!options.startOnLoad) return;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => renderAll(options), { once: true });
    return;
  }

  renderAll(options);
}

const markhome = {
  initialize,
  parse,
  render,
  renderSvg
};

export default markhome;
