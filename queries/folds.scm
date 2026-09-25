; Fold complete declaration and control-flow bodies.
(block) @fold
(field_block) @fold
(enum_declaration) @fold
(role_declaration) @fold
(perform_declaration) @fold
(case_statement) @fold
(case_expression) @fold
(if_statement) @fold
(while_statement) @fold
(for_statement) @fold

; Declaration nodes without a separately named body still provide a useful
; fold range through their block child.
(verb_declaration (block) @fold)
