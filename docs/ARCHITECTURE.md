# tree-sitter-actus Architecture

`tree-sitter-actus` is the independent syntax engine for Actus editors. Its
public outputs are a concrete syntax tree and query captures. It deliberately
does not duplicate the compiler's semantic model.

## Repository layout

```text
tree-sitter-actus/
├── grammar.js              # added after the design gate
├── package.json             # Tree-sitter CLI and package metadata
├── queries/
│   ├── highlights.scm
│   ├── locals.scm
│   ├── folds.scm
│   └── indents.scm
├── test/corpus/             # focused parser fixtures and expected trees
└── docs/
    ├── SPEC.md
    └── ARCHITECTURE.md
```

## Ownership of concerns

The Tree-sitter grammar owns token boundaries, syntax structure, error
recovery, and incremental parsing. Queries own editor presentation and lexical
scope hints. `actus lsp` owns semantic diagnostics, module-aware navigation,
hover types, and canonical formatting. The compiler remains the authority for
ownership roles, visibility, ABI, and type correctness.

## Implementation order

1. establish the lexical vocabulary and precedence;
2. add declarations, module paths, roles, types, and blocks;
3. add expressions, statements, and `case` patterns;
4. add malformed-source recovery corpus;
5. implement and test all four query suites;
6. generate bindings only after parser and query acceptance gates pass.

This order keeps the generated parser reproducible and prevents editor queries
from becoming an undocumented second grammar.
