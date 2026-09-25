// Tree-sitter grammar for Actus. Semantic ownership and visibility checks stay
// in the compiler; this grammar is intentionally error-tolerant and local.
module.exports = grammar({
  name: 'actus',

  extras: $ => [
    /[ \t\r\n]/,
    $.line_comment,
    $.doc_comment,
  ],

  word: $ => $.identifier,

  conflicts: $ => [
    [$.primary_expression, $.struct_literal],
    [$.case_statement, $.case_expression],
  ],

  rules: {
    source_file: $ => repeat($._declaration),

    _declaration: $ => choice(
      $.metadata_declaration,
      $.import_declaration,
      $.sibling_open_declaration,
      $.external_verb_declaration,
      $.verb_declaration,
      $.struct_declaration,
      $.enum_declaration,
      $.role_declaration,
      $.perform_declaration,
    ),

    metadata_declaration: $ => seq('meta', $.identifier, optional($.metadata_arguments), ';'),
    metadata_arguments: $ => seq('(', commaSep1(choice($.identifier, $.literal, $.type_name)), ')'),

    import_declaration: $ => seq('import', $.module_path, ';'),
    module_path: $ => seq($.identifier, repeat(seq('::', $.identifier))),
    sibling_open_declaration: $ => seq('open', $.identifier, ';'),

    verb_declaration: $ => seq(
      optional('open'), 'verb', field('name', $.identifier),
      optional($.generic_parameters), $.parameter_list,
      optional($.return_type), $.block,
    ),
    external_verb_declaration: $ => seq(
      optional('open'), optional('unsafe'), 'extern', $.string,
      'verb', field('name', $.identifier), optional($.generic_parameters),
      $.parameter_list, optional($.return_type), ';',
    ),
    parameter_list: $ => seq('(', commaSep($.parameter), ')'),
    parameter: $ => seq($.role, $.parameter_name, ':', optional($.dynamic_type), $.type_name),
    parameter_name: $ => choice($.identifier, 'self'),
    return_type: $ => seq('->', $.type_name),

    struct_declaration: $ => seq(
      optional('open'), 'struct', field('name', $.identifier),
      optional($.generic_parameters), $.field_block,
    ),
    field_block: $ => seq('{', repeat($.struct_field), '}'),
    struct_field: $ => seq(optional('erg'), $.identifier, ':', $.type_name, optional(',')),

    enum_declaration: $ => seq(
      optional('open'), 'enum', field('name', $.identifier),
      optional($.generic_parameters), '{', repeat($.enum_variant), '}',
    ),
    enum_variant: $ => seq(
      $.identifier,
      optional(choice(
        seq('(', commaSep($.type_name), ')'),
        seq('{', commaSep($.named_payload_field), '}'),
      )),
      optional(','),
    ),
    named_payload_field: $ => seq($.identifier, ':', $.type_name),

    role_declaration: $ => seq(
      optional('open'), 'role', field('name', $.identifier),
      optional($.generic_parameters), '{', repeat($.role_method), '}',
    ),
    role_method: $ => seq('verb', $.identifier, $.parameter_list, optional($.return_type), ';'),
    perform_declaration: $ => seq(
      optional('open'), 'perform', $.identifier, 'for', $.type_name,
      '{', repeat($.verb_declaration), '}',
    ),

    generic_parameters: $ => seq('[', commaSep1($.generic_parameter), ']'),
    generic_parameter: $ => seq(
      $.identifier,
      optional(seq(':', $.role_bound, repeat(seq('+', $.role_bound)))),
    ),
    role_bound: $ => $.type_name,
    type_arguments: $ => seq('[', commaSep1($.type_name), ']'),
    dynamic_type: $ => seq('dynamic', $.type_name),
    type_name: $ => prec(1, seq($.identifier, optional($.type_arguments))),
    role: $ => choice('erg', 'abs', 'dat'),

    block: $ => seq('{', repeat($._statement), '}'),
    _statement: $ => choice(
      $.owner_declaration,
      $.return_statement,
      $.case_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.break_statement,
      $.continue_statement,
      $.drop_statement,
      $.assignment_statement,
      $.expression_statement,
      $.block,
    ),
    owner_declaration: $ => seq($.role, $.identifier, optional(seq(':', $.type_name)), '=', $.expression, ';'),
    return_statement: $ => seq('return', optional($.expression), ';'),
    if_statement: $ => seq('if', $.expression, $.block, optional(seq('else', optional(seq('if', $.expression)), $.block))),
    while_statement: $ => seq('while', $.expression, $.block),
    for_statement: $ => seq('for', $.role, $.identifier, 'in', $.expression, $.block),
    break_statement: $ => seq('break', ';'),
    continue_statement: $ => seq('continue', ';'),
    drop_statement: $ => seq('drop', '(', $.identifier, ')', ';'),
    assignment_statement: $ => seq(choice($.field_access, $.identifier), '=', $.expression, ';'),
    expression_statement: $ => seq($.expression, ';'),

    case_statement: $ => seq(
      'case', choice('abs', 'dat'), $.expression, '{',
      repeat1($.case_branch), '}',
    ),
    case_branch: $ => seq($.pattern, optional(seq('if', $.expression)), '=>', choice($.block, $.expression), optional(',')),
    pattern: $ => choice($.variant_pattern, $.literal_pattern, $.wildcard_pattern),
    variant_pattern: $ => seq(
      optional(seq($.identifier, '.')), $.identifier,
      optional(choice(seq('(', commaSep($.pattern_binding), ')'), seq('{', commaSep($.named_pattern_binding), '}'))),
    ),
    pattern_binding: $ => choice($.identifier, '_'),
    named_pattern_binding: $ => seq($.identifier, ':', $.pattern_binding),
    literal_pattern: $ => $.literal,
    wildcard_pattern: $ => '_',

    expression: $ => choice(
      $.case_expression,
      $.binary_expression,
      $.unary_expression,
      $.postfix_expression,
      $.primary_expression,
    ),
    case_expression: $ => seq('case', choice('abs', 'dat'), $.expression, '{', repeat1($.case_branch), '}'),
    binary_expression: $ => choice(
      prec.left(1, seq($.expression, choice('==', '!=', '<', '<=', '>', '>='), $.expression)),
      prec.left(2, seq($.expression, choice('+', '-'), $.expression)),
      prec.left(3, seq($.expression, choice('*', '/'), $.expression)),
    ),
    unary_expression: $ => prec(4, seq(choice('-', '!'), $.expression)),
    postfix_expression: $ => choice(
      $.field_access,
      prec.left(5, seq($.expression, $.argument_list)),
    ),
    field_access: $ => prec.left(5, seq($.expression, '.', $.identifier)),
    primary_expression: $ => choice(
      $.identifier,
      $.literal,
      $.struct_literal,
      $.grouped_expression,
    ),
    grouped_expression: $ => seq('(', $.expression, ')'),
    argument_list: $ => seq('(', commaSep($.argument), ')'),
    argument: $ => seq(optional(seq($.identifier, ':')), $.expression),
    struct_literal: $ => seq(
      $.identifier, optional($.type_arguments), '{', commaSep($.field_initializer), '}',
    ),
    field_initializer: $ => seq($.identifier, ':', $.expression),

    literal: $ => choice($.integer, $.float, $.string, 'true', 'false'),
    integer: $ => /[0-9]+/,
    float: $ => /[0-9]+\.[0-9]+/,
    string: $ => /"([^"\\]|\\.)*"/,
    identifier: $ => /[A-Za-z_][A-Za-z0-9_]*/,
    doc_comment: $ => token(seq('///', /[^\n]*/)),
    line_comment: $ => token(seq('//', /[^\n]*/)),
  },
});

function commaSep(rule) {
  return optional(commaSep1(rule));
}

function commaSep1(rule) {
  return seq(rule, repeat(seq(',', rule)));
}
