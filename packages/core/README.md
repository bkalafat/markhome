# @markhome/core

Parser, AST types, and validation for MarkHome diagrams.

```ts
import { parse } from "@markhome/core";

const ast = parse(`
home "My Apartment" unit cm
room LivingRoom at 0,0 size 420x360
`);
```

Docs: https://github.com/bkalafat/markhome
