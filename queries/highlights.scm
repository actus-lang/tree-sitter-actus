; Actus syntax highlighting captures.

; Comments and literals
(doc_comment) @comment.documentation
(doc_string) @comment.documentation
(line_comment) @comment
(string) @string
(integer) @number
(hex_integer) @number
(float) @number

; Declaration and control-flow keywords
["verb" "struct" "enum" "role" "perform" "pack"] @keyword.function
["layout" "fields" "at"] @keyword
["little" "big"] @storageclass
["import" "open"] @keyword.modifier
["meta" "extern"] @keyword
["case" "if" "return" "break" "continue" "loop"] @keyword
["unsafe" "dynamic"] @keyword.modifier

; Ownership roles and receiver markers
(role) @keyword.modifier
["erg" "abs" "dat" "ins"] @keyword.modifier
"self" @variable.builtin
"dynamic" @keyword.modifier

; Declaration names and callable references
(verb_declaration name: (identifier) @function)
(external_verb_declaration name: (identifier) @function)
(role_method (identifier) @function)
(perform_declaration (identifier) @type)
(struct_declaration name: (identifier) @type)
(enum_declaration name: (identifier) @type)
(role_declaration name: (identifier) @type)
(pack_declaration name: (identifier) @type)
(pack_storage "storage" @storageclass)
(pack_field name: (identifier) @property)
(enum_variant (identifier) @constant)
(field_initializer (identifier) @property)
(field_access (identifier) @property)
(parameter_name (identifier) @variable.parameter)
(generic_parameter (identifier) @type.parameter)
(pattern_binding (identifier) @variable)
(named_pattern_binding (identifier) @property)
(identifier) @variable

; Built-in types, including generic applications
((identifier) @type.builtin
  (#match? @type.builtin "^(Bool|Char|String|Int|I8|I16|I32|I64|U8|U16|U32|U64|Usize|F32|F64|Unit|Option|Result|Buffer|Array|Arena|Map)$"))
(primitive_type) @type.builtin
(type_name (identifier) @type)

; Operators and delimiters
["+" "-" "*" "/" "%" "!" "~" "<" "<=" ">" ">=" "==" "!=" "&&" "||" "&" "|" "^" "<<" ">>" "=" "=>" "->" "as"] @operator
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ":" ";" "." "::"] @punctuation.delimiter
