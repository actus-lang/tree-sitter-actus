; Fold complete declaration and control-flow bodies.
(block) @fold
(field_block) @fold
(verb_declaration (block) @fold)
(external_verb_declaration) @fold
(struct_declaration (field_block) @fold)
(enum_declaration) @fold
(role_declaration) @fold
(perform_declaration) @fold
(pack_declaration) @fold
(pack_fields) @fold
(case_statement) @fold
(case_expression) @fold
(case_branch (block) @fold)
(loop_statement) @fold
