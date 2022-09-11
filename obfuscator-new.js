import UglifyJS from 'uglify-js'
import V from 'voca'
import _ from 'lodash'
import fs from 'fs'
import isValidIdentifier from 'is-valid-identifier'
import jsesc from 'jsesc'
import prettier from 'prettier'
import punycode from 'punycode'
import type {Lowercase, Uppercase} from './types'

const print = console.log

// CONSTANTS
const REGEXES = {
  space: / +/,
  constant: /true|false|undefined|NaN|Infinity|\w/,
  number: /\b\d+\b/,
  lower: /[a-z\d]+/,
  upper: /[A-Z\d]+/,
  symbol: /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/,
  default: /[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~\w ]/,
}

/**
 * This regular expression is used to split the text
 * into smaller chunks of the same type.
 *
 * The literal space is ignored since it is the most used
 * character in plain text.
 *
 */
const REGEX = RegExp(
  _.entries(REGEXES)
  |> %.map(([key: string, {source}]) => `(?<${key}>${source})`)
  |> %.join`|`
)

/**
 * DEBUG
 * @example
 * print(RE)
 */

/**
 * The file starts with a _header_ declaration.
 */

function generateHeader(GLOBAL_VAR = '$', {STRICT_MODE = false} = {}) {
  /**
   * Encase a string in literal quotes; finding the shortest
   * ASCII stringified representation of the original string.
   *
   * @example
   * print(quote`"'"`)
   * print(quote`\xff"\xad\n`)
   * print(quote`'json`)
   */

  const quote = string => do {
    let choice = /'.*"|".*'/.test(string)
      ? 'backtick'
      : /'/.test(string)
      ? 'double'
      : 'single'
    jsesc(string, {quotes: choice, wrap: true})
  }

  /**
   * We have 32 characters: `` ;.!:_-,?/'*+#%&^"|~$=<>`@\()[]{} ``
   * and out of these, subtracting the brackets, we now have
   * 26 characters, enough for the alphabet.
   *
   * So, we would use a cipher of our own, assigning a pair of
   * symbols to each letter of the English alphabet.
   * The first symbol, `$` or `_` determines if the symbol is uppercase or lowercase.
   * The second is assigned an arbitrary symbol. `_` and `$` are reserved for the two most common letters E and T. X and Z are rarely used and therefore get comm
   */
  const LETTERS = `abcdefghijklmnopqrstuvwxyz`
  const CIPHER = `;.!:_-,?/'*+#%&^"|~$=<>\`@\\`

  const encodeLetter = (char: Lowercase | Uppercase) =>
    (V.isUpperCase(char) ? '$' : '_') +
    (char.toLowerCase() |> LETTERS.indexOf(%) |> CIPHER[%])

  const encodeDigit = (number: string | number) =>
    +number
    |> %.toString(2).padStart(3, 0)
    |> %.replace(/(?<_0>0)|(?<_1>1)/g, (_0, _1) => (_0 == 1 ? '$' : '_'))

  /**
   * DEBUG
   * @example
   * print(encodeDigit(314))
   * print(encodeLetter('x'))
   */

  const CONSTANTS = {
    true: "!''", // ''==false
    false: '![]', // []==true
    undefined: '[][[]]', // [][[]] doesn't exist
    Infinity: "!''/![]", // true/false==1/0
    NaN: '+{}', // It makes sense
    '[object Object]': '{}', // y e s
  }

  /**
   * STEP 1: BASIC NUMBERS AND DIGITS
   *
   * We start by assigning the value of the global variable "$" to -1
   * and simultaneously incrementing it by 1.
   *
   * We would use the current value of the global variable to extract
   * single characters from stringified representations of the constants.
   */

  // By default, the separator is a semicolon.
  let RESULT = (STRICT_MODE ? '"use strict";let ' : '') + GLOBAL_VAR + '=~[];'

  // STEP 1
  const CHARSET_1 = {}

  for (const [constant, expression] of _.entries(CONSTANTS))
    for (const char of constant)
      if (/\w/.test(char) && !(char in CHARSET_1))
        CHARSET_1[char] = [expression, constant.indexOf(char)]

  const RES_CHARSET_1 =
    _.range(0, 10)
    |> %.map((digit: number) => [
      encodeDigit(digit) + ':`${++' + GLOBAL_VAR + '}`',
      _.entries(CHARSET_1)
      |> %.filter(([, [, val: number]]) => val == digit)
      |> %.map(([char, [lit]]) => {
        const key = quote(encodeLetter(char))
        return key + ':`${' + lit + '}`[' + GLOBAL_VAR + ']'
      }),
    ])
    |> %.flat().join`,`
    |> %.replace(/,$/, '').replace(/,+/g, ',')
    |> [GLOBAL_VAR + '={' + % + '}'][0]

  RESULT += RES_CHARSET_1

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
   * v is extracted from the word "native", which is gotten from
   * the stringified version of any one of these constructors.
   *
   * @example
   * Array.constructor.toString() ==
   * 'function Array() { [native code] }';
   * @end
   */

  // These will be explained later in the next section.
  const IDENT_SET1 = {
    concat: '+',
    call: '!',
    join: '%',
    slice: '/',
    return: '_',
    constructor: '$',
  }

  // And these are what we would achieve from there:
  const LITERALS = {
    Array: '[]',
    Object: '{}',
    String: '""',
    Number: '(~[])',
    Boolean: '(![])',
    RegExp: '/./',
    Function: '(()=>{})',
  }

  const SIGILS = {...IDENT_SET1, ...LITERALS, space: '_'}
  const CHARSET_2 = {...CHARSET_1}

  for (const [key, expression] of _.entries(LITERALS)) {
    let index
    const constructor = eval(key).toString()
    for (const char of constructor)
      if (/\w/.test(char) && !(char in CHARSET_2))
        CHARSET_2[char] = [expression, (index = constructor.indexOf(char))]
  }

  for (const value of _.entries(CHARSET_2)) {
    const [char, [expression, index]] = value

    const expansion =
      '`${' +
      expression +
      '[' +
      GLOBAL_VAR +
      '.$]}`[' +
      (index.toString().split``
      |> %.map(digit => GLOBAL_VAR + '.' + encodeDigit(digit))
      |> %.join`+`) +
      ']'

    if (!(char in CHARSET_1)) CHARSET_2[char] = [expression, index, expansion]
  }

  const objectDifference = (x: {[val]: any}, y: {[val]: any}) =>
    _.fromPairs(_.difference(_.keys(x), _.keys(y)).map(z => [z, x[z]]))
  const CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1)

  const RES_CHARSET_2 = _.entries(CHARSET_2_DIFF).map(
    ([letter, [expression, index, expansion]]) =>
      GLOBAL_VAR + '[' + quote(encodeLetter(letter)) + ']=' + expansion
  ).join`;`

  /**
   * STEP 2.1: FORMING WORDS
   *
   * From here on out, we are going to form multiple identifier
   * strings by encoding each character in the identifier using
   * the cipher we have previously defined.
   *
   * We will use the cipher to access their corresponding single
   * character entries in the global object, while *also* assigning
   * those constant strings to the global object as well, this time
   * with single character keys.
   *
   * The strings `constructor` is so common and therefore would have
   * the least expansion.
   *
   * @example
   * 'constructor' ==
   *    $['_!'] +
   *    $['_&'] +
   *    $['_%'] +
   *    $['_~'] +
   *    $._$ +
   *    $['_|'] * +$['_='] +
   *    $['_!'] +
   *    $._$ +
   *    $['_&'] +
   *    $['_|']
   */

  // String encoding
  const encodeString = (str: string = ''): string =>
    [...str.replace(/\W/g, '')].map(
      char => do {
        const encoded = encodeLetter(char)
        ;/[$_]/.test(char)
          ? quote(char)
          : isValidIdentifier(encoded)
          ? GLOBAL_VAR + '.' + encoded
          : GLOBAL_VAR + '[' + quote(encoded) + ']'
      }
    ).join`+`

  const encodeIdentifiers = (identifiers: {[ident]: string}): string =>
    _.entries(identifiers)
    |> %.map(([ident, key]) => [key, encodeString(ident)])
    |> %.map(
      ([key, expansion]) =>
        (isValidIdentifier(key)
          ? GLOBAL_VAR + '.' + key
          : GLOBAL_VAR + '[' + quote(key) + ']') +
        '=' +
        expansion
    )
    |> %.join`;`

  RESULT += ';' + encodeIdentifiers(IDENT_SET1)
  RESULT += ';' + RES_CHARSET_2

  const IDENT_SET2 = {
    name: '?',
    map: '^',
    replace: ':',
    repeat: '*',
  }

  RESULT += ';' + encodeIdentifiers(IDENT_SET2)

  /*DEBUG*/ RESULT += ';console.log(' + GLOBAL_VAR + ')'

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
   * @example
   * Object.toString.call().toString()
   * @end
   *
   * We would use `U` and `C` to form the method name `toUpperCase`,
   * to retrieve the remaining uppercase letters.
   *
   * We would also form the `Date` and `Buffer` constructors here for
   * future use.
   */

  const FUNCTIONS_SET1 = {
    eval: '=',
    escape: '>',
    unescape: '<',
    parseInt: '~',
  }

  return RESULT
}

print(generateHeader('_'))
