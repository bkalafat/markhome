import type { MarkHomeAst, MarkHomeDoor, MarkHomeRoom } from "@bkalafat/markhome-core";

export type RenderOptions = {
  width?: number | string;
  height?: number | string;
  padding?: number;
  showGrid?: boolean;
  ariaLabel?: string;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type SideLine = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function roomBounds(rooms: MarkHomeRoom[]): Bounds {
  if (!rooms.length) return { minX: 0, minY: 0, maxX: 800, maxY: 500 };
  const minX = Math.min(...rooms.map((room) => room.x));
  const minY = Math.min(...rooms.map((room) => room.y));
  const maxX = Math.max(...rooms.map((room) => room.x + room.w));
  const maxY = Math.max(...rooms.map((room) => room.y + room.h));
  return { minX, minY, maxX, maxY };
}

function getRoom(rooms: MarkHomeRoom[], id: string): MarkHomeRoom | undefined {
  return rooms.find((room) => room.id === id);
}

function sideLine(room: MarkHomeRoom, entity: { side: string; at: number; size: number }): SideLine {
  const { side, at, size } = entity;
  if (side === "north") return { x1: room.x + at, y1: room.y, x2: room.x + at + size, y2: room.y };
  if (side === "south") return { x1: room.x + at, y1: room.y + room.h, x2: room.x + at + size, y2: room.y + room.h };
  if (side === "east") return { x1: room.x + room.w, y1: room.y + at, x2: room.x + room.w, y2: room.y + at + size };
  return { x1: room.x, y1: room.y + at, x2: room.x, y2: room.y + at + size };
}

function itemFill(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes("sofa")) return "#d8c3a5";
  if (normalized.includes("tv")) return "#2f2f2f";
  if (normalized.includes("crib")) return "#f6d6d6";
  if (normalized.includes("rug")) return "#d7e8d4";
  if (normalized.includes("wardrobe")) return "#c9d6df";
  return "#e8e0d0";
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function sizeAttribute(value: number | string | undefined, fallback: number | string): string {
  return String(value ?? fallback);
}

function doorArc(door: MarkHomeDoor, line: SideLine): string {
  const horizontal = door.side === "north" || door.side === "south";
  const cx = line.x1;
  const cy = line.y1;
  if (horizontal) {
    const controlY = cy + (door.side === "north" ? -45 : 45);
    return `M ${cx} ${cy} Q ${cx + door.size / 2} ${controlY} ${cx + door.size} ${cy}`;
  }

  const controlX = cx + (door.side === "west" ? -45 : 45);
  return `M ${cx} ${cy} Q ${controlX} ${cy + door.size / 2} ${cx} ${cy + door.size}`;
}

function roomPolygonPoints(room: MarkHomeRoom): string | null {
  if (!room.cutout) return null;

  const x = room.x;
  const y = room.y;
  const w = room.w;
  const h = room.h;
  const cw = room.cutout.w;
  const ch = room.cutout.h;

  const points =
    room.cutout.corner === "northwest"
      ? [
          [x + cw, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
          [x, y + ch],
          [x + cw, y + ch]
        ]
      : room.cutout.corner === "northeast"
        ? [
            [x, y],
            [x + w - cw, y],
            [x + w - cw, y + ch],
            [x + w, y + ch],
            [x + w, y + h],
            [x, y + h]
          ]
        : room.cutout.corner === "southeast"
          ? [
              [x, y],
              [x + w, y],
              [x + w, y + h - ch],
              [x + w - cw, y + h - ch],
              [x + w - cw, y + h],
              [x, y + h]
            ]
          : [
              [x, y],
              [x + w, y],
              [x + w, y + h],
              [x + cw, y + h],
              [x + cw, y + h - ch],
              [x, y + h - ch]
            ];

  return points.map(([px, py]) => `${px},${py}`).join(" ");
}

function roomShape(room: MarkHomeRoom): string {
  const points = roomPolygonPoints(room);
  if (points) {
    return `<polygon points="${points}" fill="#fffaf0" stroke="#1f2937" stroke-width="5" />`;
  }

  return `<rect x="${room.x}" y="${room.y}" width="${room.w}" height="${room.h}" fill="#fffaf0" stroke="#1f2937" stroke-width="5" rx="2" />`;
}

export function renderSvg(ast: MarkHomeAst, options: RenderOptions = {}): string {
  const bounds = roomBounds(ast.rooms);
  const padding = options.padding ?? 70;
  const viewBoxX = bounds.minX - padding;
  const viewBoxY = bounds.minY - padding;
  const viewBoxW = bounds.maxX - bounds.minX + padding * 2;
  const viewBoxH = bounds.maxY - bounds.minY + padding * 2;
  const viewBox = `${viewBoxX} ${viewBoxY} ${viewBoxW} ${viewBoxH}`;
  const width = sizeAttribute(options.width, "100%");
  const height = sizeAttribute(options.height, 520);
  const ariaLabel = escapeXml(options.ariaLabel ?? `${ast.home.name} MarkHome layout`);
  const notesByRoom = new Map<string, number>();
  const svg: string[] = [];

  svg.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}" role="img" aria-label="${ariaLabel}">`);
  svg.push("<defs>");
  svg.push('<pattern id="markhome-grid" width="20" height="20" patternUnits="userSpaceOnUse">');
  svg.push('<path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1" />');
  svg.push("</pattern>");
  svg.push("</defs>");
  svg.push(`<rect x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxW}" height="${viewBoxH}" fill="#f8f4ec" />`);

  if (options.showGrid !== false) {
    svg.push(`<rect x="${viewBoxX}" y="${viewBoxY}" width="${viewBoxW}" height="${viewBoxH}" fill="url(#markhome-grid)" />`);
  }

  ast.rooms.forEach((room) => {
    svg.push("<g>");
    svg.push(roomShape(room));
    svg.push(`<text x="${room.x + 14}" y="${room.y + 26}" font-size="18" font-weight="700" fill="#111827">${escapeXml(room.label)}</text>`);
    svg.push(`<text x="${room.x + 14}" y="${room.y + 48}" font-size="12" fill="#6b7280">${room.w}x${room.h} ${escapeXml(ast.home.unit)}</text>`);
    svg.push("</g>");
  });

  ast.windows.forEach((windowEntity) => {
    const room = getRoom(ast.rooms, windowEntity.roomId);
    if (!room) return;
    const line = sideLine(room, windowEntity);
    svg.push("<g>");
    svg.push(`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#38bdf8" stroke-width="9" stroke-linecap="round" />`);
    svg.push(`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round" />`);
    svg.push("</g>");
  });

  ast.doors.forEach((door) => {
    const room = getRoom(ast.rooms, door.roomId);
    if (!room) return;
    const line = sideLine(room, door);
    svg.push("<g>");
    svg.push(`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#f8f4ec" stroke-width="12" stroke-linecap="round" />`);
    svg.push(`<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#92400e" stroke-width="4" stroke-linecap="round" />`);
    svg.push(`<path d="${doorArc(door, line)}" fill="none" stroke="#b45309" stroke-width="2" stroke-dasharray="4 4" />`);
    svg.push("</g>");
  });

  ast.items.forEach((item) => {
    const room = getRoom(ast.rooms, item.roomId);
    if (!room) return;
    const x = room.x + item.x;
    const y = room.y + item.y;
    const textFill = item.type.toLowerCase().includes("tv") ? "#f9fafb" : "#111827";
    svg.push("<g>");
    svg.push(`<rect x="${x}" y="${y}" width="${item.w}" height="${item.h}" rx="10" fill="${itemFill(item.type)}" stroke="#374151" stroke-width="2" />`);
    svg.push(`<text x="${x + item.w / 2}" y="${y + item.h / 2 + 4}" text-anchor="middle" font-size="13" font-weight="700" fill="${textFill}">${escapeXml(item.label)}</text>`);
    svg.push("</g>");
  });

  ast.notes.forEach((note) => {
    const room = getRoom(ast.rooms, note.roomId);
    if (!room) return;
    const roomNoteIndex = notesByRoom.get(note.roomId) ?? 0;
    notesByRoom.set(note.roomId, roomNoteIndex + 1);
    const width = Math.min(260, note.text.length * 7 + 30);
    const y = room.y + room.h - 38 - roomNoteIndex * 24;
    svg.push("<g>");
    svg.push(`<rect x="${room.x + 12}" y="${y}" width="${width}" height="22" rx="11" fill="#fef3c7" stroke="#f59e0b" />`);
    svg.push(`<text x="${room.x + 25}" y="${y + 16}" font-size="11" fill="#78350f">${escapeXml(note.text)}</text>`);
    svg.push("</g>");
  });

  svg.push("</svg>");
  return svg.join("");
}
