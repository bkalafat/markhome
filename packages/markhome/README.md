# markhome

Markdown-style syntax and renderer for simple 2D home layout diagrams.

```ts
import { parse, render, renderSvg } from "markhome";

const source = `
home "My Apartment" unit cm
room LivingRoom at 0,0 size 420x360
`;

const ast = parse(source);
const svg = renderSvg(ast);
const sameSvg = render(source);
```

Browser auto-render:

```ts
import markhome from "markhome";

markhome.initialize({
  startOnLoad: true
});
```

Docs: https://github.com/bkalafat/markhome
