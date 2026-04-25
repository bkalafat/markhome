export type MarkHomeSide = "north" | "south" | "east" | "west";

export type MarkHomeRoomRelation = "right_of" | "left_of" | "below" | "above";

export type MarkHomeHome = {
  name: string;
  unit: string;
};

export type MarkHomeRoom = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  relation?: MarkHomeRoomRelation;
  refId?: string;
  gap?: number;
};

export type MarkHomeDoor = {
  roomId: string;
  side: MarkHomeSide;
  at: number;
  size: number;
  swing?: string;
};

export type MarkHomeWindow = {
  roomId: string;
  side: MarkHomeSide;
  at: number;
  size: number;
};

export type MarkHomeItem = {
  type: string;
  roomId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
};

export type MarkHomeNote = {
  roomId: string;
  text: string;
};

export type MarkHomeError = {
  line?: number;
  message: string;
};

export type MarkHomeAst = {
  home: MarkHomeHome;
  rooms: MarkHomeRoom[];
  doors: MarkHomeDoor[];
  windows: MarkHomeWindow[];
  items: MarkHomeItem[];
  notes: MarkHomeNote[];
  errors: MarkHomeError[];
};

export type MarkHomePoint = {
  x: number;
  y: number;
};

export type MarkHomeSize = {
  w: number;
  h: number;
};
