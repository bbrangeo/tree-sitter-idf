# tree-sitter-idf

A [tree-sitter](https://tree-sitter.github.io/) grammar for [EnergyPlus](https://energyplus.net/) IDF files.

Built for [idfkit](https://idfkit.com/) — EnergyPlus modeling tools — and used by the Zed editor extensions [bbrangeo/zed-idfkit](https://github.com/bbrangeo/zed-idfkit) (LSP + syntax highlighting) and [bbrangeo/zed-idfkit-mcp](https://github.com/bbrangeo/zed-idfkit-mcp) (MCP server for AI-assisted modeling).

## What it parses

IDF is a simple line-oriented data format:

- comments start with `!` and run to end of line (`!- ...` doc comments after fields are distinguished from plain comments in the highlight queries)
- objects are an object type (`Type` or `Type:SubType`), followed by a comma-separated field list, terminated by `;`
- fields are numbers (int / float / scientific), alphanumeric values, reserved keywords (`Yes`, `Autosize`, …), or empty

The grammar is deliberately tolerant so real-world (multi-megabyte) IDF files parse without error nodes:

- comments are `extras` (valid anywhere, never break a parse)
- a catch-all token handles any unexpected characters in values
- the BOM is skipped

Validated against a real 14k-line EnergyPlus model: 100% parse, zero `ERROR` nodes.

## Repository layout

The grammar lives at `grammars/idf/` — the `<repo>/grammars/<name>/` layout expected by Zed's extension builder when an extension references it via `[grammars.idf]`.

## Use with Zed

In an extension's `extension.toml`:

```toml
[grammars.idf]
path = "grammars/idf"
rev = "main"
repository = "https://github.com/bbrangeo/tree-sitter-idf.git"
```

Notes:

- the repository URL must include the `.git` suffix — Zed compares it exactly against `git remote get-url origin`
- for dev extension installs, `grammars/idf` inside the extension must be a real git clone of this repository
- highlight queries are loaded by Zed from the language directory (`languages/<lang>/highlights.scm`), not from this repo's `queries/`

## Standalone build

```sh
cd grammars/idf
npm install        # tree-sitter-cli
npx tree-sitter generate
npx tree-sitter parse your-model.idf
```

## License

MIT
