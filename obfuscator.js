import _ from 'lodash';
// import { highlight } from 'cli-highlight';
import jsesc from 'jsesc';
import punycode from 'punycode';
import Chance from 'chance';
import seedrandom from 'seedrandom';
import fs from 'fs';

const text = fs.readFileSync('./core/test.txt', 'utf8');
const gv = '_';

/**
 * This would be our cipher that we would use to access properties of
 * the global object.
 *
 * The alphabet used is a two-character cipher.
 *
 * The first character is assigned if the character is lowercase or uppercase.
 * The second character is the corresponding symbol for each character.
 *
 * J, Q, X and Z are assigned escaped characters, since they are the least used letters.
 * while E and T are assigned the underscore and dollar sign since
 * they are the most commonly used letters.
 */
const LETTERS = `abcdefghijklmnopqrstuvwxyz`;
const SYMBOLS = `;.!:_-,?/'*+#%&^"|~$=<>\`@\\`;
const RE =
  /(?<lower>[a-z\d]+)|(?<upper>[A-Z\d]+)|(?<symbol>[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+)|(?<space> )|(?<other>[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\w]+)/g;
const { keys, values, entries, fromEntries } = Object;
const { stringify, parse } = JSON;

const SIGILS = {
  true: `!''`,
  false: `![]`,
  undefined: `[][[]]`,
  Infinity: `!''/![]`,
  NaN: `+{}`,
  '[object Object]': `{}`,
  Array: `[]`,
  Object: `{}`,
  String: `''`,
  Number: `(~[])`,
  Boolean: `(![])`,
  RegExp: `/./`,
  Function: `(()=>{})`,
  concat: '+',
  call: '!',
  join: '%',
  slice: '/',
  return: ';',
  constructor: '$',
  filter: "'",
  map: '"',
  name: '?',
  replace: '-',
  repeat: '*',
  prototype: '`',
  eval: '|',
  escape: '\\',
  parseInt: '~',
  toUpperCase: '^',
  Date: '@',
  Buffer: '#',
  space: '_',
  toString: ':',
};

// Checks if a letter is uppercase.
function isUpperCase(x: string): string {
  return x === x.toUpperCase();
}

// Checks if a letter is lowercase.
function isLowerCase(x: string): string {
  return x === x.toLowerCase();
}

// Encodes letters using the substitution cipher above.
function encodeLetter(char: string): string {
  return (
    (isUpperCase(char) ? '$' : '_') +
    SYMBOLS[LETTERS.indexOf(char.toLowerCase())]
    |> JSON.stringify(#)
  );
}

// Encodes a single letter as a property of the global object.
function encodeString(key: string, globalVar = '$'): string {
  return key
    .split('')
    .map((char: string): string =>
      char |> encodeLetter(#) |> (!'$_'.includes(#)
        ? `\${${globalVar}[${encodeLetter(char, globalVar)}]}`
        : `\${${globalVar}.${encodeLetter(char, globalVar).replace('"', '')}}`)
    )
    .join('');
}

// Encodes a numeric value as a property.
function encodeNumber(num: number | string): string {
  return (
    parseInt(num).toString(2).padStart(3, 0)
    |> #.replace(/(?<$0>0)|(?<$1>1)/g, ($0, $1) => ($0 == 1 ? '$' : '_'))
  );
}

function generateHeader(globalVar = '$') {
  // By default, the separator is a semicolon.
  const SEP = ';';

  /**
   * STEP 1: BASIC NUMBERS AND DIGITS
   *
   * We start by assigning the value of the global variable "$" to -1
   * and simultaneously incrementing it by 1.
   *
   * We would use the current value of the global variable to extract
   * single characters from stringified representations of the constants.
   */

  const CONSTANTS = {
    true: `!''`,
    false: `![]`,
    undefined: `[][[]]`,
    Infinity: `_${globalVar}`,
    NaN: `+{}`,
    '[object Object]': `{}`,
  };

  const STEP1 = () => {
    const CHARMAP = {};

    for (const [constant, expression] of CONSTANTS |> entries(#))
      for (const char of constant)
        if (!(char in CHARMAP) && /[a-z]/i.test(char))
          CHARMAP[char] = [expression, constant.indexOf(char)];

    return {
      CHARMAP,
      RESULT:
        _.range(10)
        |> #.map((num: number) => [
          `${encodeNumber(num)}:++${globalVar}+[]`,
          `${CHARMAP
          |> entries(#)
          |> #.filter(([, [, val]]) => (val: number) == num)
          |> #.map(
            ([char, [lit]]) =>
              `${encodeLetter(char)}:\`\${${lit}}\`[${globalVar}]`
          )
          }`,
        ])
        |> #.flat()
        |> #.join()
        |> #.replace(/,+/g, ','),
    };
  };

  /**
   * STEP 2: LITERALS AND CONSTRUCTORS
   *
   * Now that we have the basic characters, we now can use these
   * letters to form some words, such as "concat", "call", "join",
   * "slice", and even the longer word "constructor".
   *
   * We would use the constructors to retrieve some more letters,
   * such as v, g, m and some capitals such as A, S, N, R, E, and F.
   *
   * v is extracted from the word `native`, which is gotten from
   * the stringified version of any one of these constructors.
   *
   * @example
   * 'function Array() { [native code] }';
   * @end
   */

  // These are the words we would have to make:
  const SET1 = {
    concat: '+',
    call: '!',
    join: '%',
    slice: '/',
    return: ';',
    constructor: '$',
    filter: "'",
  };

  // And these are what we would achieve from there:
  const LITERALS = {
    Array: `[]`,
    Object: `{}`,
    String: `''`,
    Number: `(~[])`,
    Boolean: `(![])`,
    RegExp: `/./`,
    Function: `(()=>{})`,
  };

  var SIGILS = { ...SET1, ...LITERALS, space: '_' };

  const STEP2 = () => {
    const { CHARMAP } = STEP1(),
      CHARMAP1: { [key: string]: any } = {};

    for (const expr of LITERALS |> values(#)) {
      const constructor = expr |> `(${#})` |> eval(#) |> #.constructor |> String(#);

      for (const char of constructor)
        if (
          !(char in CHARMAP) &&
          !(char in CHARMAP1) &&
          /[a-z]/i.test(char, globalVar)
        )
          CHARMAP1[char] = [expr, constructor.indexOf(char, globalVar)];
    }

    for (const [char, [expr, index]] of CHARMAP1 |> entries(#)) {
      CHARMAP1[char] =
        `\`\${${expr}[${globalVar}.$]}\`[\`` +
        `${index
        |> #.toString()
        |> #.split('')
        |> #.map((digit) => `\${${`${globalVar}.${encodeNumber(digit)}`}}`)
        |> #.join('')
        }\`]`;
    }

    return {
      CHARMAP: { ...CHARMAP, ...CHARMAP1 },
      RESULT:
        CHARMAP1
        |> entries(#)
        |> #.map(([key, val]) => `${globalVar}[${encodeLetter(key)}]=${val}`)
        |> #.join(SEP),
    };
  };

  /**
   * STEP 3: FUNCTIONS
   *
   * Now that we have gotten even more letters, we can form even
   * more words, such as `eval`, `escape`, `name`, `replace` and
   * `repeat`, useful functions for us to retrieve even more letters.
   *
   * We would need to retrieve the useful `eval` function for us to
   * invoke and convert Unicode strings into arbitrary Unicode code
   * points as escapes.
   *
   * The `escape` function would help us retrieve the characters C and D
   * from the code points of our palette of ASCII symbols.
   *
   * We would need to get the method `toString` by getting the `name`
   * of the `String` constructor, for us to retrieve the rest of the
   * alphabet, and use to retrieve words from 64-bit float numbers.
   *
   * `U` is created from calling `toString` prototype on an empty object.
   *
   * ```js
   * 'function Array() { [native code] }';
   * ```
   */

  const SET2 = {
    name: '?',
    map: '"',
    replace: '-',
    repeat: '*',
    prototype: '`',
  };

  const FUNCTIONS1 = {
    eval: '|',
    escape: '\\',
    parseInt: '~',
  };

  var SIGILS = {
    ...SET1,
    ...SET2,
    ...FUNCTIONS1,
    space: '_',
    toString: ':',
  };

  const encodeWords = (words) =>
    entries(words)
      .map(([key, val]) => [val, encodeString(key, globalVar)])
      .map(([key, val]) => `${globalVar}[${stringify(key)}]=\`${val}\``)
      .join(SEP);

  const STEP3 = () => ({
    RESULT:
      FUNCTIONS1
      |> entries(#)
      |> #.map(
        ([name, sigil]) =>
          // Function constructor
          globalVar +
          `[${stringify(sigil)}]` +
          '=' +
          LITERALS.Function +
          `[${globalVar}.${SIGILS.constructor}]` + // Function calls
          `(\`${`\${${globalVar}[${stringify(SIGILS.return)}]}` +
          `\${${globalVar}.${SIGILS.space}}` +
          `\${${globalVar}[${stringify(sigil)}]}`
          }\`)` +
          '()'
      )
      |> #.join(SEP),
  });

  /**
   * STEP 4: CAPITAL LETTERS C, D and U.
   *
   * We would only use the `escape` function to retrieve the two
   * characters `C` and `D` from the symbols `<` and `=`.
   *
   * U is retrieved from the following formula:
   *
   * ```js
   * Object.toString.call().toString()
   * ```
   *
   * We would use `U` and `C` to form the method name `toUpperCase`,
   * to retrieve the remaining uppercase letters.
   *
   * We would also form the `Date` and `Buffer` constructors here for
   * future use.
   */

  const SET3 = {
    toUpperCase: '^',
    Date: '@',
    Buffer: '#',
  };

  var SIGILS = {
    ...SET1,
    ...SET2,
    ...SET3,
    ...FUNCTIONS1,
    space: '_',
    toString: ':',
  };

  const STEP4 = () => {
    const second = "[-~!'']";
    const eighth = "[-~!''<<-~!'']";

    const CHARS = {
      C:
        globalVar +
        `[${stringify(SIGILS.escape)}]` +
        `(${stringify(',')})` +
        second,
      D:
        globalVar +
        `[${stringify(SIGILS.escape)}]` +
        `(${stringify('=')})` +
        second,
      U:
        '`${{}' +
        `[${globalVar}[${stringify(SIGILS.toString)}]]` +
        `[${globalVar}[${stringify(SIGILS.call)}]]` +
        '()}`' +
        eighth,
    };

    return {
      RESULT:
        CHARS
        |> entries(#)
        |> #.map(
          ([key, val]) => globalVar + `[${encodeLetter(key)}]` + '=' + val
        )
        |> #.join(SEP),
    };
  };

  /**
   * STEP 5: REMAINING LETTERS
   */

  const STEP5 = () => {
    let RESULT = {};
    let CHARMAP = { ...STEP2().CHARMAP, C: '', D: '', U: '' };
    CHARMAP = keys(CHARMAP)
      .sort((a, b) => a.localeCompare(b))
      .join('');

    const REMAINING = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      .split('')
      .filter((char, globalVar) => !CHARMAP.includes(char, globalVar))
      .sort((a, b) => a.localeCompare(b))
      .join('')
      .match(/(.)\1*/gi);

    for (const char of REMAINING) {
      switch (char.length) {
        // Lowercase
        case 2: {
          // Index of letter in alphabet
          let index =
            LETTERS.indexOf(char[0].toLowerCase()) + 10
            |> [...`${#}`]
            |> #.map((x) => '${' + `${globalVar + '.' + encodeNumber(x)}` + '}')
            |> #.join('')
            |> '(+`' + # + '`)';

          index = `${index}[${globalVar}[${stringify(
            SIGILS.toString
          )}]](_${globalVar})`;

          const letterCode = `${globalVar}[${encodeLetter(
            char[0].toLowerCase()
          )}]`;

          let expression = `${letterCode}=${index}`;
          RESULT[char[0].toLowerCase()] = expression;
        }

        // Uppercase
        case 1: {
          // Letter Code
          const letterCode = `${globalVar}[${encodeLetter(
            char[0].toUpperCase()
          )}]`;

          // Uppercase modifier
          const upperCase =
            `${globalVar}[${encodeLetter(char[0].toLowerCase())}]` +
            `[${globalVar}[${stringify(SIGILS.toUpperCase)}]]()`;

          const expression = `${letterCode}=${upperCase}`;
          RESULT[char[0].toUpperCase()] = expression;
        }
      }
    }

    RESULT = Object.values(RESULT).join(SEP);

    return { RESULT };
  };

  let HEADER = [
    // Set two variables: Infinity and -1
    `var[${globalVar},_${globalVar}]=[~[],!''/![]]`,

    // Core letters
    `${globalVar}={${STEP1().RESULT}}`,

    // Setting secondary variable to 36
    `_${globalVar}=(-~-~!''<<!'')**-~!''`,

    // Space
    `${globalVar}._=\`\${{}}\`[~-[]>>>~-~-~[]]`,

    // First set of words
    encodeWords(SET1),

    // Constructors from literals
    STEP2().RESULT,

    // Second set of words
    encodeWords({ ...SET2, ...FUNCTIONS1 }),

    // Built-in functions and more words
    STEP3().RESULT,

    // toString method
    globalVar +
    `[${stringify(SIGILS.toString)}]` +
    '=' +
    `\`${encodeString('to', globalVar)}\${''[${globalVar}.${SIGILS.constructor
    }][${globalVar}[${stringify(SIGILS.name)}]]}\``,

    // C, D, and U
    STEP4().RESULT,

    // Third set of words
    encodeWords(SET3),

    // Rest of alphabet
    // STEP5().RESULT,

    /** MACROS */

    // x => x.map(y => y.toString(36)).join('')
    globalVar +
    `[${globalVar}.${SIGILS.space}]` +
    '=' +
    `$${globalVar}=>$${globalVar}` +
    `[${globalVar}[${stringify(SIGILS.map)}]]($_${globalVar}=>` +
    `$_${globalVar}[${globalVar}` +
    `[${stringify(SIGILS.toString)}]](_${globalVar}))` +
    `[${globalVar}[${stringify(SIGILS.join)}]]('')`,
  ].join(SEP);

  /** POSTPROCESSING
   * - Replacing all valid identifier properties by shortening them
   */
  HEADER = HEADER.replace(
    /\["([_$]+)"\]/g,
    (p1) => '.' + p1.replace(/["\[\]]/g, '')
  );

  return HEADER + ';'; // + globalVar + "['`'](" + globalVar + ')'
}

function parseText(text: string, globalVar = '$') {
  const GROUPS = text.matchAll(RE);
  let RESULT: string[] = [];

  for (const { groups: GROUP } of GROUPS) {
    let [[group, value]] = GROUP |> entries(#) |> #.filter(([, v]) => v != null);

    switch (group) {
      case 'lower': {
        let encoded =
          value.match(/.{5}|.+/g)
          |> Array.from(#)
          |> #.map(
            (x) =>
              parseInt(x, 36)
              |> `${#}`.split('')
              |> #.map((x) => x |> encodeNumber(#) |> `\${${globalVar}.${#}}`)
              |> #.join('')
              |> `+\`${#}\``
          )
          |> #.join();

        encoded = `${globalVar}[${globalVar}.${SIGILS.space}]([${encoded}])`;
        RESULT.push(encoded);
        break;
      }

      case 'upper': {
        let encoded =
          value.match(/.{5}|.+/g)
          |> Array.from(#)
          |> #.map(
            (x) =>
              parseInt(x, 36)
              |> `${#}`.split('')
              |> #.map((x) => x |> encodeNumber(#) |> `\${${globalVar}.${#}}`)
              |> #.join('')
              |> `+\`${#}\``
          )
          |> #.join();

        encoded = `${globalVar}[${globalVar}.${SIGILS.space}]([${encoded}])`;
        encoded += encoded = `[${globalVar}[${stringify(
          SIGILS.toUpperCase
        )}]]()`;

        RESULT.push(encoded);
        break;
      }

      case 'other': {
        const codePoints =
          value
          |> jsesc(#, { quotes: 'double' })
          |> `"${#}"`.toLowerCase()
          |> parseText(#, globalVar)
          |> `${globalVar}[${stringify(SIGILS.eval)}](${#})`;
        RESULT.push(codePoints);
        break;
      }

      case 'symbol': {
        RESULT.push(JSON.stringify(value));
        break;
      }

      case 'space': {
        RESULT.push(globalVar + '._');
        break;
      }
    }
  }

  RESULT = RESULT.map((x) => `\${${x}}`).join('') |> `\`${#}\``;
  return RESULT;
}

// obfuscate(text, gv) |> console.log(#);
// // |> highlight(#, { language: 'js' })

export function obfuscate(text: string, globalVar = ''): string {
  return (
    generateHeader(globalVar) +
    `console.log([${parseText(text, globalVar)}]` +
    `[${globalVar}[${stringify(SIGILS.join)}]]` +
    `(${globalVar}.${SIGILS.space}))`
  );
}

fs.writeFileSync('./core/console.js', obfuscate(text, gv))
