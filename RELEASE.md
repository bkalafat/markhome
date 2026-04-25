# Release Process

## v0.1.0

1. Verify package names on npm:

   ```bash
   npm view markhome version
   npm view @bkalafat/markhome-core version
   npm view @bkalafat/markhome-svg version
   npm view @bkalafat/markhome-cli version
   ```

   `E404` means the package name is available or not visible to the current account.

2. Run local checks:

   ```bash
   corepack pnpm install
   corepack pnpm check
   corepack pnpm build
   corepack pnpm release:dry-run
   ```

3. Commit and push:

   ```bash
   git push origin main
   ```

4. Configure npm trusted publishing for these packages:

   - `@bkalafat/markhome-core`
   - `@bkalafat/markhome-svg`
   - `markhome`
   - `@bkalafat/markhome-cli`

   Use repository `bkalafat/markhome` and workflow `.github/workflows/publish.yml`.

5. Publish by pushing a tag:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

6. Create a GitHub release from tag `v0.1.0`.

## GitHub Release Notes

````md
First public release of MarkHome.

MarkHome is Markdown for simple 2D home layout diagrams.

Included in v0.1:

- MarkHome text syntax
- Parser and AST types
- SVG renderer
- Browser auto-render API
- CLI renderer
- Playground
- Documentation site
- Initial language specification

Install:

```bash
npm install markhome
npm install -D @bkalafat/markhome-cli
```

CLI:

```bash
npx markhome room.markhome -o room.svg
```
````
