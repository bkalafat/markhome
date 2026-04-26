# MarkHome Specification v0.1

MarkHome is a text-based notation for simple 2D home layout diagrams.

## Goals

- Human-readable
- AI-editable
- Git-friendly
- Renderable to SVG
- Simple enough to learn in one day

## Non-goals

- 3D rendering
- CAD precision
- BIM replacement
- Building permit drawings
- Photorealistic interior design

## Processing Model

The v0.1 pipeline is:

```txt
Text -> Parser -> AST -> SVG 2D diagram
```

Implementations should keep parsing deterministic and preserve best-effort rendering when recoverable errors are present.

## Objects

MarkHome v0.1 supports:

```txt
home
room
door
window
item
note
```

## Grammar

```txt
home "Name" unit cm

room RoomId at x,y size wxh label "Label"
room RoomId at x,y size wxh cutout northwest|northeast|southeast|southwest wxh label "Label"
room RoomId right_of OtherRoom gap 20 size wxh label "Label"
room RoomId left_of OtherRoom gap 20 size wxh label "Label"
room RoomId below OtherRoom gap 20 size wxh label "Label"
room RoomId above OtherRoom gap 20 size wxh label "Label"

door RoomId north|south|east|west at number size number
window RoomId north|south|east|west at number size number

item type in RoomId at x,y size wxh label "Label"

note RoomId "Text"
```

`cutout` removes a rectangular corner from a room. This is the v0.1 way to draw a simple L-shaped room without introducing freeform CAD geometry.

## Coordinates

Room coordinates are absolute in the home coordinate system. Item coordinates are relative to their containing room. Door and window `at` values are offsets along the selected side.

Room definitions can appear in any order. Relative room references are resolved after all `room` lines are parsed, so a room may reference another room that appears later in the file.

## Version

This document describes MarkHome Specification v0.1.
