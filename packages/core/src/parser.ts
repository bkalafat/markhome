import type {
  MarkHomeAst,
  MarkHomeDoor,
  MarkHomeError,
  MarkHomePoint,
  MarkHomeRoom,
  MarkHomeRoomCutout,
  MarkHomeRoomCutoutCorner,
  MarkHomeRoomRelation,
  MarkHomeSide,
  MarkHomeSize,
  MarkHomeWindow
} from "./ast.js";

const ROOM_RELATIONS: MarkHomeRoomRelation[] = ["right_of", "left_of", "below", "above"];
const CUTOUT_CORNERS: MarkHomeRoomCutoutCorner[] = ["northwest", "northeast", "southeast", "southwest"];
const SIDES: MarkHomeSide[] = ["north", "south", "east", "west"];

function parsePair(value: string): MarkHomePoint | null {
  const match = value.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

function parseSize(value: string): MarkHomeSize | null {
  const match = value.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (!match) return null;
  return { w: Number(match[1]), h: Number(match[2]) };
}

function getQuoted(line: string): string | null {
  const match = line.match(/"([^"]*)"/);
  return match ? match[1] : null;
}

function tokenize(line: string): string[] {
  const tokens: string[] = [];
  const regex = /"[^"]*"|\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line))) {
    tokens.push(match[0]);
  }
  return tokens;
}

function stripQuotes(value: string): string {
  return value.replace(/^"|"$/g, "");
}

function tokenValue(tokens: string[], key: string): string | null {
  const index = tokens.indexOf(key);
  if (index === -1 || index + 1 >= tokens.length) return null;
  return stripQuotes(tokens[index + 1]);
}

function tokenNumber(tokens: string[], key: string): number | null {
  const raw = tokenValue(tokens, key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function parseCutout(tokens: string[], roomSize: MarkHomeSize, lineNumber: number, errors: MarkHomeError[]): MarkHomeRoomCutout | null {
  const index = tokens.indexOf("cutout");
  if (index === -1) return null;

  const corner = tokens[index + 1] as MarkHomeRoomCutoutCorner | undefined;
  const sizeToken = tokens[index + 2];
  const size = sizeToken ? parseSize(sizeToken) : null;

  if (!corner || !CUTOUT_CORNERS.includes(corner) || !size) {
    error(errors, lineNumber, "room cutout syntax: 'cutout southeast 160x140'.");
    return null;
  }

  if (size.w >= roomSize.w || size.h >= roomSize.h) {
    error(errors, lineNumber, "room cutout must be smaller than the room size.");
    return null;
  }

  return { corner, w: size.w, h: size.h };
}

function error(errors: MarkHomeError[], line: number, message: string): void {
  errors.push({ line, message });
}

function referenceError(errors: MarkHomeError[], message: string): void {
  errors.push({ message });
}

function applyRelation(room: MarkHomeRoom, ref: MarkHomeRoom): void {
  const gap = room.gap ?? 20;
  if (room.relation === "right_of") {
    room.x = ref.x + ref.w + gap;
    room.y = ref.y;
  }
  if (room.relation === "left_of") {
    room.x = ref.x - room.w - gap;
    room.y = ref.y;
  }
  if (room.relation === "below") {
    room.x = ref.x;
    room.y = ref.y + ref.h + gap;
  }
  if (room.relation === "above") {
    room.x = ref.x;
    room.y = ref.y - room.h - gap;
  }
}

type RoomResolutionState = "unvisited" | "visiting" | "resolved" | "failed";

type ParsedRoom = MarkHomeRoom & {
  lineNumber: number;
  resolutionState: RoomResolutionState;
  cycleReported?: boolean;
};

function failRoom(room: ParsedRoom): void {
  room.x = 0;
  room.y = 0;
  room.resolutionState = "failed";
}

function reportCycle(stack: ParsedRoom[], refId: string, errors: MarkHomeError[]): void {
  const cycleStart = stack.findIndex((room) => room.id === refId);
  const cycleRooms = cycleStart === -1 ? stack : stack.slice(cycleStart);
  const cyclePath = [...cycleRooms.map((room) => room.id), refId].join(" -> ");

  cycleRooms.forEach((room) => {
    if (!room.cycleReported) {
      error(errors, room.lineNumber, `circular room reference: ${cyclePath}.`);
      room.cycleReported = true;
    }
    failRoom(room);
  });
}

function resolveRoom(room: ParsedRoom, byId: Map<string, ParsedRoom>, errors: MarkHomeError[], stack: ParsedRoom[]): boolean {
  if (room.resolutionState === "resolved") return true;
  if (room.resolutionState === "failed") return false;
  if (room.resolutionState === "visiting") {
    reportCycle([...stack, room], room.id, errors);
    return false;
  }

  if (!room.relation) {
    room.resolutionState = "resolved";
    return true;
  }

  const refId = room.refId;
  if (!refId) {
    failRoom(room);
    return false;
  }

  room.resolutionState = "visiting";
  const ref = byId.get(refId);
  if (!ref) {
    error(errors, room.lineNumber, `reference room '${refId}' was not found.`);
    failRoom(room);
    return false;
  }

  if (ref.resolutionState === "visiting") {
    reportCycle([...stack, room], ref.id, errors);
    return false;
  }

  if (!resolveRoom(ref, byId, errors, [...stack, room])) {
    if (!room.cycleReported) {
      error(errors, room.lineNumber, `could not resolve room '${room.id}' because reference room '${ref.id}' could not be resolved.`);
      failRoom(room);
    }
    return false;
  }

  applyRelation(room, ref);
  room.resolutionState = "resolved";
  return true;
}

function resolveRoomPositions(parsedRooms: ParsedRoom[], errors: MarkHomeError[]): MarkHomeRoom[] {
  const byId = new Map<string, ParsedRoom>();
  for (const room of parsedRooms) byId.set(room.id, room);

  for (const room of parsedRooms) {
    resolveRoom(room, byId, errors, []);
  }

  return parsedRooms.map(({ lineNumber, resolutionState, cycleReported, ...room }) => room);
}

function parseRoom(tokens: string[], lineNumber: number, errors: MarkHomeError[]): ParsedRoom | null {
  const id = tokens[1];
  const sizeToken = tokenValue(tokens, "size");
  const size = sizeToken ? parseSize(sizeToken) : null;
  if (!id || !size) {
    error(errors, lineNumber, "room requires an id and size like 'size 420x360'.");
    return null;
  }

  const label = tokenValue(tokens, "label") || id;
  const cutout = parseCutout(tokens, size, lineNumber, errors);
  let room: ParsedRoom = { id, label, x: 0, y: 0, w: size.w, h: size.h, lineNumber, resolutionState: "unvisited" };
  if (cutout) room.cutout = cutout;

  const atToken = tokenValue(tokens, "at");
  if (atToken) {
    const point = parsePair(atToken);
    if (!point) {
      error(errors, lineNumber, "room position must be like 'at 0,0'.");
      return null;
    }
    room.x = point.x;
    room.y = point.y;
    return room;
  }

  const relation = ROOM_RELATIONS.find((candidate) => tokens.includes(candidate));
  if (!relation) {
    error(errors, lineNumber, "room needs 'at x,y' or relation like 'right_of LivingRoom'.");
    return room;
  }

  const refId = tokenValue(tokens, relation);
  const gap = tokenNumber(tokens, "gap") ?? 20;
  if (!refId) {
    error(errors, lineNumber, `room relation '${relation}' requires a reference room id.`);
    return room;
  }

  room = { ...room, relation, refId, gap };
  return room;
}

function parseOpening(
  command: "door" | "window",
  tokens: string[],
  lineNumber: number,
  errors: MarkHomeError[]
): MarkHomeDoor | MarkHomeWindow | null {
  const roomId = tokens[1];
  const side = tokens[2] as MarkHomeSide | undefined;
  const at = tokenNumber(tokens, "at");
  const size = tokenNumber(tokens, "size");
  const validSide = side ? SIDES.includes(side) : false;

  if (!roomId || !side || !validSide || at === null || size === null) {
    error(errors, lineNumber, `${command} syntax: '${command} RoomId north at 100 size 120'.`);
    return null;
  }

  if (command === "door") {
    return { roomId, side, at, size, swing: tokenValue(tokens, "swing") || "" };
  }

  return { roomId, side, at, size };
}

export function parse(source: string): MarkHomeAst {
  const lines = source.split(/\r?\n/);
  const home = { name: "Untitled Home", unit: "cm" };
  const parsedRooms: ParsedRoom[] = [];
  const doors: MarkHomeDoor[] = [];
  const windows: MarkHomeWindow[] = [];
  const items: MarkHomeAst["items"] = [];
  const notes: MarkHomeAst["notes"] = [];
  const errors: MarkHomeError[] = [];

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) return;

    const tokens = tokenize(line);
    const command = tokens[0];

    try {
      if (command === "home") {
        const quoted = getQuoted(line);
        if (quoted) home.name = quoted;
        const unit = tokenValue(tokens, "unit");
        if (unit) home.unit = unit;
        return;
      }

      if (command === "room") {
        const room = parseRoom(tokens, lineNumber, errors);
        if (room) parsedRooms.push(room);
        return;
      }

      if (command === "door" || command === "window") {
        const opening = parseOpening(command, tokens, lineNumber, errors);
        if (!opening) return;
        if (command === "door") doors.push(opening as MarkHomeDoor);
        else windows.push(opening as MarkHomeWindow);
        return;
      }

      if (command === "item") {
        const type = tokens[1];
        const inIndex = tokens.indexOf("in");
        const roomId = inIndex > -1 ? tokens[inIndex + 1] : null;
        const atToken = tokenValue(tokens, "at");
        const sizeToken = tokenValue(tokens, "size");
        const point = atToken ? parsePair(atToken) : null;
        const size = sizeToken ? parseSize(sizeToken) : null;
        const label = tokenValue(tokens, "label") || type;
        if (!type || !roomId || !point || !size) {
          error(errors, lineNumber, "item syntax: 'item sofa in LivingRoom at 50,240 size 220x80'.");
          return;
        }
        items.push({ type, roomId, x: point.x, y: point.y, w: size.w, h: size.h, label });
        return;
      }

      if (command === "note") {
        const roomId = tokens[1];
        const text = getQuoted(line) || tokens.slice(2).join(" ");
        if (!roomId || !text) {
          error(errors, lineNumber, "note syntax: 'note LivingRoom \"text\"'.");
          return;
        }
        notes.push({ roomId, text });
        return;
      }

      error(errors, lineNumber, `unknown command '${command}'.`);
    } catch {
      error(errors, lineNumber, "could not parse this line.");
    }
  });

  const rooms = resolveRoomPositions(parsedRooms, errors);

  const roomIds = new Set(rooms.map((room) => room.id));
  [...doors, ...windows, ...items, ...notes].forEach((entity) => {
    if (!roomIds.has(entity.roomId)) {
      referenceError(errors, `room '${entity.roomId}' was not found.`);
    }
  });

  return { home, rooms, doors, windows, items, notes, errors };
}
