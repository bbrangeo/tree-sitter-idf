/**
 * @file Tree-sitter grammar for EnergyPlus IDF files.
 *
 * IDF is a simple line-oriented data format. An object is an object type
 * (possibly `Type:SubType`), followed by a comma-separated list of fields,
 * terminated by `;`:
 *
 *   Construction,
 *     Exterior Wall,           !- Name
 *     Wall Insulation,         !- Outside Layer
 *     Concrete;                !- Layer 2 {m}
 *
 *  - comments start with `!` and run to end of line. Field annotations
 *    (`!- ...`) and plain comments (`! ...`) are matched by the same token
 *    and only distinguished in the highlight queries.
 *  - fields are numbers (int / float / scientific: `0`, `0.04`, `3.5E-6`,
 *    `-0.4`, multi-dot versions like `9.4.0.002`), alphanumeric values,
 *    reserved keywords (`Yes`, `Autosize`, ...), or empty (just a comma),
 *    each with an optional `!- comment` trailer.
 *
 * Design goal: never fail on real-world (multi-megabyte) IDF files — the
 * grammar is deliberately tolerant:
 *  - comments are `extras` (valid anywhere, never break a parse)
 *  - a low-precedence catch-all token absorbs any unexpected characters
 *    in values
 *  - the BOM is skipped
 *
 * Validated against a real 14k-line whole-building calibration model and
 * the official EnergyPlus test suite (testfiles/: 1ZoneUncontrolled,
 * 1ZoneUncontrolledUTF8, 5ZoneAirCooled, RefBldgMediumOfficeNew2004):
 * 100% parsed, zero ERROR nodes.
 */

module.exports = grammar({
  name: 'idf',

  extras: ($) => [/\s/, /\ufeff/, $.comment],

  rules: {
    source_file: ($) => repeat($.object),

    // `Type` or `Type:SubType`, e.g. `ZoneCapacitanceMultiplier:ResearchSpecial`.
    object: ($) =>
      seq(
        field('type', $.object_type),
        repeat(seq(optional($._value), ',')),
        optional($._value),
        ';',
      ),

    object_type: ($) => $.identifier,

    _value: ($) => choice(prec(1, $.number), $.field_value, $.any_value),

    // Note: reserved keyword values (`Yes`, `Autosize`, `Continuous`, ...) are
    // NOT a grammar node — they are highlighted via `#any-of?` predicates in
    // `queries/highlights.scm`. Tree-sitter lexical precedence would otherwise
    // match them as prefixes of real names (`No` in `NoSun`, `On` in `On/Off`).

    field_value: ($) => $.identifier,

    // Numbers: int, float, multi-dot versions (`9.4.0.002`) and scientific
    // notation (`3.5E-6`, `-0.4`). Floats are matched by the same token —
    // scientific notation takes priority over identifiers via `prec(1)`.
    number: ($) =>
      token(
        seq(
          optional('-'),
          repeat1(/\d/),
          repeat(seq('.', repeat1(/\d/))),
          optional(seq(/[eE]/, optional(/[+\-]/), repeat1(/\d/))),
        ),
      ),

    // Identifiers: letters, digits and the characters common in real IDF
    // names (`:` `-` `_` `.` `/` `\` `+` `*` `&` `%` `#` `(` `)` `$` `'` `"`
    // `=` `[` `]` `<` `>`), plus internal spaces so multi-word names like
    // `Any Number` or `Last Sunday in March` stay a single token. The token
    // never crosses `,` `;` `!` or a newline.
    identifier: ($) =>
      token(
        prec(
          0,
          seq(
            /[^!,;\n\s]/,
            repeat(/[^\n,;!]/),
          ),
        ),
      ),

    // Catch-all for any other characters that may appear inside a value:
    // starts/ends on a non-whitespace char, never crosses a `,` `;` `!` or
    // a newline, so a real file always parses without error nodes.
    any_value: ($) =>
      token(
        prec(
          -1,
          choice(
            /[^\s,;!][^\n,;!]*[^\s,;!]/,
            /[^\s,;!]/,
          ),
        ),
      ),

    // Plain `! ...` comments (block headers, inline notes). `!- ...` doc
    // comments are matched by the same token and distinguished in
    // `queries/highlights.scm` via a `#match?` predicate.
    comment: ($) => token(/![^\n]*/),
  },
});

