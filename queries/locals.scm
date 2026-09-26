; Lexical scopes
(source_file) @local.scope
(block) @local.scope
(case_branch) @local.scope
(case_statement) @local.scope
(case_expression) @local.scope
(loop_statement) @local.scope

; Declaration definitions
(verb_declaration name: (identifier) @local.definition)
(external_verb_declaration name: (identifier) @local.definition)
(struct_declaration name: (identifier) @local.definition)
(enum_declaration name: (identifier) @local.definition)
(role_declaration name: (identifier) @local.definition)
(generic_parameter (identifier) @local.definition)
(parameter_name (identifier) @local.definition)
(owner_declaration (identifier) @local.definition)

; Pattern bindings are branch-local definitions
(pattern_binding (identifier) @local.definition)
(named_pattern_binding (identifier) @local.definition)
(parameter (parameter_name (identifier) @local.definition))
(argument (expression (primary_expression (identifier) @local.reference)))

; Lexical references. Declaration-specific captures above take precedence in
; editor clients that support local query definitions.
(primary_expression (identifier) @local.reference)
(field_access (expression (primary_expression (identifier) @local.reference)))
(argument (expression (primary_expression (identifier) @local.reference)))
(case_branch (expression (primary_expression (identifier) @local.reference)))
