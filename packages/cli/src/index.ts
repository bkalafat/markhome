#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { render } from "markhome";

type CliOptions = {
  input?: string;
  output?: string;
  help: boolean;
};

function usage(): string {
  return `Usage:
  markhome input.markhome -o output.svg
  markhome input.markhome > output.svg

Options:
  -o, --output   Write SVG to a file
  -h, --help     Show this help message`;
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (arg === "-o" || arg === "--output") {
      options.output = args[index + 1];
      index += 1;
      continue;
    }

    if (!options.input) {
      options.input = arg;
      continue;
    }

    throw new Error(`Unexpected argument '${arg}'.`);
  }

  return options;
}

function defaultOutputPath(input: string): string {
  const extension = extname(input);
  const name = extension ? basename(input, extension) : basename(input);
  return join(dirname(input), `${name}.svg`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }

  if (!options.input) {
    throw new Error("Missing input file.\n\n" + usage());
  }

  const source = await readFile(options.input, "utf8");
  const svg = render(source);

  if (options.output) {
    await writeFile(options.output, `${svg}\n`, "utf8");
    return;
  }

  if (process.stdout.isTTY) {
    await writeFile(defaultOutputPath(options.input), `${svg}\n`, "utf8");
    return;
  }

  process.stdout.write(`${svg}\n`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
