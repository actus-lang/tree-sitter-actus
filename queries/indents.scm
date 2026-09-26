; Delimited bodies and lists begin a nested indentation level.
"{" @indent.begin
"}" @indent.end
"(" @indent.begin
")" @indent.end
"[" @indent.begin
"]" @indent.end

; Align continuation items with the first item in a list.
(parameter_list "," @indent.align)
(type_arguments "," @indent.align)
(generic_parameters "," @indent.align)
(struct_field "," @indent.align)
(enum_variant "," @indent.align)
(case_branch "," @indent.align)
(case_branch "=>" @indent.align)

; Field separators close the continuation alignment.
(struct_field "," @indent.end)
