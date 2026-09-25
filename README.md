# tree-sitter-actus

Tree-sitter grammar and editor query suite for Actus.

The repository is intentionally independent from the Actus compiler. It owns
incremental syntax parsing, syntax highlighting, folding, local-scope queries,
and editor indentation. Semantic validation remains in `actus lsp`.

## Development

```sh
npm install
npm run generate
npm test
```

The grammar is not included yet. `docs/SPEC.md` defines the contract that the
grammar, queries, and corpus must implement before the first generated parser
is accepted.
