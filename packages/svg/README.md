# @bkalafat/markhome-svg

SVG renderer for MarkHome AST objects.

```ts
import { parse } from "@bkalafat/markhome-core";
import { renderSvg } from "@bkalafat/markhome-svg";

const ast = parse(`
home "My Apartment" unit cm
room LivingRoom at 0,0 size 420x360
`);

const svg = renderSvg(ast);
```

Docs: https://github.com/bkalafat/markhome
