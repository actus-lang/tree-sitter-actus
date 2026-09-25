# Actus Tree-sitter Specification

Status: grammar design and test infrastructure phase.

This repository provides the editor syntax engine for Actus. It must remain a
loss-tolerant, incremental parser: malformed source is expected while a file
is being edited. It does not perform type checking, ownership validation,
module resolution, code generation, or formatter decisions. Those contracts
belong to the Actus compiler and `actus lsp`.

## 1. Architectural boundaries

The pipeline is split deliberately:

```text
source text -> tree-sitter-actus CST -> editor queries
           \-> Actus compiler frontend -> semantic diagnostics
```

The grammar should preserve named nodes for every construct that an editor
needs to inspect. Anonymous punctuation may still be used for compact syntax,
but delimiters required by folding and indentation must remain structurally
visible.

The canonical language spelling is used throughout this specification:

- `verb` declares functions and methods;
- `struct`, `enum`, `role`, and `perform` declare types and contracts;
- `import` loads modules and `open <sibling>;` exposes a sibling facade;
- `erg`, `abs`, and `dat` express ownership roles;
- `case` is exhaustive pattern matching and literal switching;
- `meta` introduces declarative compile-time metadata;
- `dynamic` marks explicit runtime role dispatch;
- `else if` is the conditional spelling; `match`, `fn`, `impl`, and Rust-style
  `@attributes` are not Actus syntax.

## 2. AST and lexical hierarchy

The grammar must expose the following hierarchy. Names in parentheses are
recommended node names, not a promise that every punctuation token receives a
named node.

### 2.1 Source and modules

```text
source_file
  declaration*
    import_declaration
    sibling_open_declaration
    metadata_declaration
    verb_declaration
    external_verb_declaration
    struct_declaration
    enum_declaration
    role_declaration
    perform_declaration
```

`import driver::gpio;` is a module import. `open registers;` is a facade
export declaration and is distinct from `open struct`, `open enum`, `open role`,
or `open verb`. The grammar must retain the path segments and the sibling name
as separate identifiers.

### 2.2 Declarations and visibility

Every declaration that supports external visibility may begin with `open`.
Metadata uses `meta name(...)` or the metadata forms accepted by the compiler;
the grammar must not reintroduce `@repr(C)` as an alternative spelling.

```text
verb_declaration
  open? verb identifier generic_parameters? parameter_list return_type? block

struct_declaration
  open? struct identifier generic_parameters? field_block

enum_declaration
  open? enum identifier generic_parameters? variant_block

role_declaration
  open? role identifier generic_parameters? role_body

perform_declaration
  open? perform identifier for type_name perform_body
```

### 2.3 Roles, parameters, and types

Parameters use an explicit role and optional dynamic dispatch:

```text
parameter       = erg|abs|dat identifier : dynamic? type_name
receiver        = erg|abs|dat self
type_name       = identifier type_arguments?
type_arguments  = [ type_name ( , type_name )* ]
generic_parameters = [ generic_parameter ( , generic_parameter )* ]
generic_parameter  = identifier ( : role_bound ( + role_bound )* )?
```

The lexer must distinguish role keywords from identifiers and preserve `self`,
`dynamic`, and type-application brackets. `*const T`, `*mut T`, `unsafe`, and
inline assembly are lexical constructs that must remain parseable inside their
declared unsafe boundaries when added to the grammar.

Struct fields permit value fields and `erg` resource fields. `abs` and `dat`
are not valid struct-field roles. Enum variants support unit, positional, and
named payloads.

### 2.4 Statements and expressions

The statement family includes:

```text
block
owner_declaration       // erg/abs/dat name = expression
assignment
field_assignment
return_statement
loop_statement
break_statement
continue_statement
drop_statement
expression_statement
```

Expressions include identifiers, literals, calls, method calls, struct
literals, field access, unary/binary operations, and `case` expressions.
`case` branches have the shape:

```text
case abs subject {
  Pattern if guard => expression_or_block,
  _ => expression_or_block,
}
```

The grammar must keep `case_mode`, `pattern`, `guard`, `case_branch`, and
`case_body` nodes separate. It must reject or recover from C-style fallthrough
and standalone `break` inside case branches without inventing a Tree-sitter
node that suggests those semantics exist.

Patterns include unit and payload variant patterns, literal patterns, and `_`.

### 2.5 Precedence

The grammar must encode precedence from tightest to loosest:

1. primary expressions: identifiers, literals, grouped expressions, struct
   literals, and case expressions;
2. postfix expressions: field access, calls, and method calls;
3. unary operators;
4. multiplicative arithmetic: `*`, `/`;
5. additive arithmetic: `+`, `-`;
6. comparisons: `<`, `<=`, `>`, `>=`, `==`, `!=`;
7. logical operators when introduced by the compiler grammar;
8. assignment, which is a statement-level construct rather than an
   expression-level value.

`=>` and `->` are distinct multi-character tokens and must never be split into
an ordinary comparison or assignment token sequence by the scanner.

## 3. Query suite architecture

Queries are versioned editor contracts. Each query file must have corpus
coverage and should avoid matching anonymous punctuation unless the editor API
requires it.

### 3.1 `queries/highlights.scm`

The complete highlighting query will classify:

- keywords (`verb`, `struct`, `enum`, `role`, `perform`, `case`, `return`,
  `import`, `open`, `meta`, `unsafe`, and loop/control-flow words);
- ownership roles (`erg`, `abs`, `dat`) and receivers (`self`);
- declaration names, type names, enum variants, fields, parameters, and
  generic parameters;
- built-in types and literals;
- operators, delimiters, comments, and strings;
- metadata names and dynamic dispatch markers.

Capture names must follow common editor scopes (`@keyword`, `@type`,
`@function`, `@variable`, `@property`, `@constant`, `@operator`, `@punctuation`,
`@comment`, `@string`, `@number`, and `@attribute`) so Neovim and VS Code
consumers do not require Actus-specific theme adapters.

### 3.2 `queries/locals.scm`

The locals query must identify lexical scopes for source files, declarations,
blocks, loops, and case branches. It must mark definitions for:

- verb and method names;
- parameters and receivers;
- `erg`, `abs`, and `dat` bindings;
- generic parameters;
- pattern payload bindings.

References must include identifier expressions, field bases, call sites, and
pattern guard references. The query reports lexical definitions only; ownership
validity and visibility remain compiler diagnostics.

### 3.3 `queries/folds.scm`

Fold regions must cover:

- struct, enum, role, and perform bodies;
- verb and external-verb bodies;
- blocks, loops, and case expressions;
- named payload blocks and metadata groups where useful.

Single-line constructs should not produce noisy zero-value folds.

### 3.4 `queries/indents.scm`

Indent rules must increase indentation after `{`, struct/enum payload starts,
and case branches; align continuation parameters and payload fields; and
decrease indentation before `}`, `)`, `]`, and branch terminators. The query
must not attempt to format whitespace inside strings or comments.

Indent behavior is intentionally syntax-only. Canonical whitespace remains the
responsibility of `actus fmt`.

## 4. Corpus test strategy

Every grammar feature is accepted only with a corpus fixture under
`test/corpus/`. Each fixture contains a focused example and expected named
tree. Fixtures must be small enough that a failed node is obvious.

The corpus is organized by responsibility:

```text
test/corpus/
  declarations.txt
  modules.txt
  roles-and-parameters.txt
  structs-and-enums.txt
  expressions-and-precedence.txt
  control-flow.txt
  patterns-and-case.txt
  metadata-and-unsafe.txt
  malformed-recovery.txt
```

Each corpus file must include positive examples and recovery cases. Required
coverage includes:

1. every active keyword and punctuation token;
2. all declaration forms and `open` placements;
3. generic parameters, bounds, and nested type applications;
4. `erg`, `abs`, `dat`, `self`, and `abs dynamic Role`;
5. struct resource fields, enum unit/tuple/named payloads;
6. calls, field access, comparisons, and precedence boundaries;
7. `case abs` and `case dat`, all pattern forms, guards, and `_`;
8. imports and facade `open sibling;` declarations;
9. comments, Unicode text, escaped strings, and multiline source;
10. incomplete braces, missing delimiters, bad fallthrough, and malformed
    declarations with stable error recovery.

Query tests must also verify that each capture is attached to the intended
named node. Highlight, locals, fold, and indent snapshots should be reviewed
alongside parser corpus changes so query drift cannot silently pass.

## 5. Acceptance gates

Before grammar generation is accepted:

- `tree-sitter generate` succeeds without warnings;
- `tree-sitter test` passes the complete corpus;
- representative Actus files parse with no unexpected `ERROR` nodes;
- malformed fixtures recover without swallowing following declarations;
- every query has at least one positive corpus assertion;
- generated parser artifacts are reproducible;
- node names and capture names are documented when they form an editor API;
- repository checks (`npm test`, formatting, and package metadata validation)
  pass in CI.

The next implementation step is to translate this specification into
`grammar.js`, then add the corpus in dependency order: lexical/declarations,
types and roles, expressions, control flow, patterns, and recovery.
