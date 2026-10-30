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

Notes (each of these tripped us up — don't skip them):

- the repository URL must include the `.git` suffix — Zed compares it exactly against `git remote get-url origin` (run with `GIT_CONFIG_GLOBAL=/dev/null`)
- for dev extension installs, `grammars/idf` inside the extension must be a real git clone of this repository — Zed refuses a plain tracked directory ("already exists, but is not a git clone")
- the grammar directory must **not** be committed to the extension repository: when packaging (CI `package` job), Zed's builder downloads the grammar itself from `repository`/`rev` (git init + fetch + checkout) and fails if the directory exists without being a git clone
- highlight queries are loaded by Zed from the language directory (`languages/<lang>/highlights.scm`), **not** from this repo's `queries/` and not from `tree-sitter.json`'s `highlights` field — that field is only used by other tree-sitter tooling

## Cloning for dev extension installs

```sh
git clone https://github.com/bbrangeo/tree-sitter-idf grammars/idf
```

Run inside the extension repository, then install the dev extension in Zed (`zed: install dev extension`).

## Standalone build

Requires Node.js and the tree-sitter CLI:

```sh
cd grammars/idf
npm install                  # tree-sitter-cli
npx tree-sitter generate     # regenerate src/parser.c from grammar.js
npx tree-sitter parse your-model.idf
```

Note: `src/parser.c` is generated and committed so that Zed's builder only has to compile it to WASM; re-run `tree-sitter generate` after editing `grammar.js`.

## Used by

- [bbrangeo/zed-idfkit](https://github.com/bbrangeo/zed-idfkit) — Zed extension: syntax highlighting + idfkit-lsp language server for `.idf`
- [bbrangeo/zed-idfkit-mcp](https://github.com/bbrangeo/zed-idfkit-mcp) — Zed extension: MCP server for AI-assisted EnergyPlus modeling in the Agent Panel

## License

MIT — see [LICENSE](LICENSE).
