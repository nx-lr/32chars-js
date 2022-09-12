import UglifyJS from 'uglify-js'
import V from 'voca'
import _ from 'lodash'
import fs from 'fs'
import isValidIdentifier from 'is-valid-identifier'
import jsesc from 'jsesc'
import prettier from 'prettier'
import punycode, { encode } from 'punycode'
import type { Lowercase, Uppercase } from './types'

const print = console.log

const text = fs.readFileSync('./test.txt', 'utf8')

/**
 * JinxScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 * - Execution, where the constructed code is evaluated and executed.
 */

function generateDocument(TEXT, GLOBAL_VAR, { STRICT_MODE = false } = {}) {
  /**
   * Encase a string in literal quotes; finding the shortest
   * ASCII stringified representation of the original string.
   *
   * @example
   * print(quote`"'"`)
   * print(quote`\xff"\xad\n`)
   * print(quote`'json`)
   */

  let count = 0
  const quote = string => do {
    let choice = ['single', 'double'][count++ % 2]
    jsesc(string, { quotes: choice, wrap: true })
  }

  /**
   * We have 32 characters: `` ;.!:_-,?/'*+#%&^"|~$=<>`@\()[]{} ``
   * and out of these, subtracting the bracket pairs, we now have
   * 26 characters, enough for the alphabet.
   *
   * So, we would use a cipher of our own, assigning a pair of
   * symbols to each letter of the English alphabet.
   * The first symbol, `$` or `_` determines if the symbol is uppercase or
   * lowercase.
   * The second is assigned an arbitrary symbol. `_` and `$` are reserved for
   * the two most common letters E and T.
   * X and Z are rarely used and therefore get the escape sequences which are
   * slightly longer.
   */

  const LETTERS = `abcdefghijklmnopqrstuvwxyz`
  const CIPHER = `;.!:_-,?/'*+#%&^"|~$=<>\`@\\`
  const SPACE = '-'

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
    true: '!``', // ''==false
    false: '![]', // []==true
    undefined: '[][[]]', // [][[]] doesn't exist
    Infinity: '!``/![]', // true/false==1/0
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

  // The separator is a semicolon, not a comma.
  let RESULT =
    (STRICT_MODE ? 'let _' + GLOBAL_VAR + ',' : '') + GLOBAL_VAR + '=~[];'

  // STEP 1
  const CHARSET_1 = {}

  for (const [constant, expression] of _.entries(CONSTANTS))
    for (const char of constant)
      if (/[\w\s]/.test(char) && !(char in CHARSET_1))
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
    |> %.replace('_' + void 0, SPACE) // Replace space

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
    String: '``',
    Number: '(~[])',
    Boolean: '(![])',
    RegExp: '/./',
    Function: '(()=>{})',
  }

  const CHARSET_2 = { ...CHARSET_1 }

  for (const [key, expression] of _.entries(LITERALS)) {
    let index
    const constructor = eval(key).toString()
    for (const char of constructor)
      if (/[\w\s]/.test(char) && !(char in CHARSET_2))
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

  const objectDifference = (x: object, y: object) =>
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
    [...('' + str).replace(/\W/g, '')].map(
      char => do {
        if (/[$_]/.test(char)) quote(char)
        else if (/\d/.test(char)) GLOBAL_VAR + '.' + encodeDigit(char)
        else {
          const encoded = encodeLetter(char)
          isValidIdentifier(encoded)
            ? GLOBAL_VAR + '.' + encoded
            : GLOBAL_VAR + '[' + quote(encoded) + ']'
        }
      }
    ).join`+`

  const encodeIdentifiers = (identifiers: { [ident]: string }): string =>
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
    split: '|',
    indexOf: '#',
  }

  RESULT += ';' + encodeIdentifiers(IDENT_SET2)

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
   */

  const GLOBAL_FUNC = {
    eval: '=',
    escape: '>',
    unescape: '<',
    parseInt: '+',
  }

  /**
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

  const RES_FUNCTIONS_1 = _.entries(GLOBAL_FUNC).map(
    ([ident, shortcut]) => do {
      GLOBAL_VAR +
        '[' +
        quote(shortcut) +
        ']=' +
        LITERALS.Function +
        '[' +
        [GLOBAL_VAR + '.$'][0] + // `constructor`
        '](' +
        [GLOBAL_VAR + '._'][0] + // `return`
        '+' +
        [GLOBAL_VAR + '[' + quote(SPACE) + ']'][0] + // space
        '+' +
        encodeString(ident) + // name of function
        ')()'
    }
  ).join`;`

  RESULT += ';' + RES_FUNCTIONS_1

  // toString
  const TO_STRING = "'"
  RESULT +=
    ';' +
    GLOBAL_VAR +
    '[' +
    quote(TO_STRING) +
    ']=' +
    encodeString('to') +
    '+' + // no word breaks
    LITERALS.String +
    // `constructor`
    ['[' + GLOBAL_VAR + '.$' + ']'][0] +
    // `name`
    ['[' + GLOBAL_VAR + '[' + quote(IDENT_SET2.name) + ']]'][0]

  /**
   * We would use the escape function to get the letters C and D
   * by escaping it as a URL and then getting the last digit of
   * the codepoint which is always uppercase.
   *
   * All invalid URL characters are immediately converted to the
   * format `%XX` where `X` is a hexadecimal digit in uppercase.
   *
   * Since `-` is a valid URL character, `=` will be used instead
   * since it has semantic meaning in URLs (key-value pairs).
   *
   * @example
   * $.C = escape(',')[2]
   * $.D = escape(',')[2]
   */

  RESULT +=
    ';' +
    GLOBAL_VAR +
    '[' +
    quote(encodeLetter('C')) +
    ']=' +
    GLOBAL_VAR +
    '[' +
    quote(GLOBAL_FUNC.escape) +
    '](' +
    quote('<') + // U+3C
    ')[' +
    GLOBAL_VAR +
    '.' +
    encodeDigit(2) +
    ']'

  RESULT +=
    ';' +
    GLOBAL_VAR +
    '[' +
    quote(encodeLetter('D')) +
    ']=' +
    GLOBAL_VAR +
    '[' +
    quote(GLOBAL_FUNC.escape) +
    '](' +
    quote('=') + // U+3D
    ')[' +
    GLOBAL_VAR +
    '.' +
    encodeDigit(2) +
    ']'

  /**
   * U is retrieved from the following formula:
   *
   * @example
   * Object.toString.call().toString()
   * @end
   *
   * We would use `U` and `C` to form the method name `toUpperCase`,
   * to retrieve the remaining uppercase letters.
   */

  RESULT +=
    ';' +
    GLOBAL_VAR +
    '[' +
    quote(encodeLetter('U')) +
    ']=' +
    '`${' +
    LITERALS.Object +
    ['[' + GLOBAL_VAR + '[' + quote(TO_STRING) + ']]'][0] +
    ['[' + GLOBAL_VAR + '[' + quote(IDENT_SET1.call) + ']]'][0] +
    '()}`[' +
    GLOBAL_VAR +
    '.' +
    encodeDigit(8) +
    ']'

  /**
   * We will get the remainder of the ASCII alphabet, so to make it
   * vastly easier to form ASCII-based identifiers very soon.
   */

  const CIPHER_FROM =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  // Remaining characters
  const CHARSET_3 = [..._.keys(CHARSET_2), ...'CDU']
    .filter(char => !!char.trim())
    .sort()

  /**
   * We will remove numeric characters as they are already defined
   * in the global object, and add these remaining letters one by
   * one.
   *
   * This makes it a heck ton easier to encode macros with just
   * a few surgical substitutions with regular expressions.
   */

  _.difference(
    [...CIPHER_FROM].filter(x => !V.isNumeric(x)),
    CHARSET_3
  )

  for (const letter of 'hkqwz')
    RESULT +=
      ';' +
      GLOBAL_VAR +
      '[' +
      quote(encodeLetter(letter)) +
      ']=' +
      '(+(' +
      encodeString(CIPHER_FROM.indexOf(letter)) +
      '))[' +
      GLOBAL_VAR +
      '[' +
      quote(TO_STRING) +
      ']](' +
      encodeString(36) +
      ')'

  const IDENT_SET3 = { fromCharCode: '@' }
  RESULT += ';' + encodeIdentifiers(IDENT_SET3)

  /**
   * TRANSFORMATION
   *
   * The transformation stage forms the bulk of the document.
   * The text is split into runs of various sizes, each containing
   * a different set of characters. These include:
   *
   * - Whitespace.
   * - All 32 ASCII punctuation and symbol characters, which are
   *   included literally without change.
   * - All strings already defined in the output document, which are:
   *   - strings used for properties and method names
   *   - constructor names
   *   - constants (except null)
   *   and all substrings, 2 characters or more thereof, all
   *   next to word boundaries.
   * - Runs of all other characters, including Unicode sequences,
   *   ignoring all boundaries.
   */

  const CIPHER_TO = `_.:;!?*+^-=<>~'"/|#$%&@{}()[]\`\\`
  const IDENT_SET = { ...IDENT_SET1, ...IDENT_SET2, ...IDENT_SET3 }

  /**
   * UTF-16 STRINGS
   *
   * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
   * As such, strings can be broken down into their meaningful
   * code points.
   *
   * Every code point is converted into integers, and each is
   * converted into base 31 so that all characters, save for the
   * comma `,`, are used. Every resulting digit is ciphered.
   *
   * The comma is used as it is syntactically used to separate
   * array elements, which are the ciphered digit substrings.
   * When `.toString` is called, the commas come in, therefore
   * there's no need to explicitly write `.join(',')`.
   */

  const utf16toBase31 = (s: string) =>
    `${[...Array(s.length)].map(
      (x, i) =>
        [...s.charCodeAt(i).toString(31)].map(
          c => CIPHER_TO[CIPHER_FROM.indexOf(c)]
        ).join``
    )}`

  const base31toUtf16 = b =>
    String.fromCharCode(
      ...b.split`,`.map(s =>
        parseInt([...s].map(c => CIPHER_FROM[CIPHER_TO.indexOf(c)]).join``, 31)
      )
    )

  /**
   * UTF-16 STRINGS
   *
   * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
   * As such, strings can be broken down into their meaningful
   * code points.
   *
   * Every code point is converted into integers, and each is
   * converted into base 31 so that all characters, save for the
   * comma `,`, are used. Every resulting digit is ciphered.
   *
   * The comma is used as it is syntactically used to separate
   * array elements, which are the ciphered digit substrings.
   * When `.toString` is called, the commas come in, therefore
   * there's no need to explicitly write `.join(',')`.
   */

  const MACRO_B31_UTF16 =
    'a=(a=>a.split`,`.map(a=>parseInt([...a].map(a=>CIPHER_FROM[CIPHER_TO.indexOf(a)]).join``,+(31))).map(a=>String.fromCharCode(a)).join``)'
      .replace(/^\w=|;$/g, '')
      .replace('CIPHER_TO', quote(CIPHER_TO))
      .replace('String', LITERALS.String + '[' + GLOBAL_VAR + '.$]')
      .replace(/\d+/, match => encodeString(match))
      .replace('parseInt', GLOBAL_VAR + '[' + quote(GLOBAL_FUNC.parseInt) + ']')
      .replace(/\ba\b/g, '_' + GLOBAL_VAR)
      .replace(
        /\.(?<ident>split|map|indexOf|join|fromCharCode)\b/g,
        ident => do {
          ident = ident.replace(/^\./, '')
          '[' + GLOBAL_VAR + '[' + quote(IDENT_SET[ident]) + ']]'
        }
      )
      .replace('CIPHER_FROM', GLOBAL_VAR + '[+![]]')
      .replace(/^/, GLOBAL_VAR + '[+!``]=')

  RESULT +=
    ';' + GLOBAL_VAR + '[' + encodeString(0) + ']=' + encodeString(CIPHER_FROM)

  RESULT += ';' + MACRO_B31_UTF16

  /**
   * UTF-16 STRINGS
   *
   * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
   * As such, strings can be broken down into their meaningful
   * code points.
   *
   * Every code point is converted into integers, and each is
   * converted into base 31 so that all characters, save for the
   * comma `,`, are used. Every resulting digit is ciphered.
   *
   * The comma is used as it is syntactically used to separate
   * array elements, which are the ciphered digit substrings.
   * When `.toString` is called, the commas come in, therefore
   * there's no need to explicitly write `.join(',')`.
   */

  // CONSTANTS
  const RE_CONSTANTS = [
    'true',
    'false',
    'Infinity',
    'NaN',
    'undefined',
    _.keys(IDENT_SET),
  ].flat()

  const REGEXPS = {
    constant: /true|false|Infinity|NaN|undefined|\b[a-zA-FINORSU\d]\b/,
    symbol: /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/,
    default: /[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/,
  }

  const REGEXPS_1 = {
    function: RegExp(_.keys(IDENT_SET).join`|`),
    constant: /true|false|Infinity|NaN|undefined|\b[a-zA-FINORSU\d]\b/,
    constructor: RegExp(_.keys(LITERALS).join`|`),
    spaces: / {2,}/,
    space: / /,
    number: /\d+/,
    symbol: /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/,
    default: /[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/,
  }

  /**
   * This regular expression splits the text into runs.
   * The literal space is ignored since it is the most used
   * character in plain text.
   */

  const REGEXP = RegExp(
    _.entries(REGEXPS)
    |> %.map(([key: string, { source }]) => `(?<${key}>${source})`)
    |> %.join`|`,
    'g'
  )

  const GROUPS = [...text.matchAll(REGEXP)]
    .map(({ groups }) => _.entries(groups).filter(([, value]) => value != null))
    .flat(1)

  RESULT += ';' + '_' + GLOBAL_VAR + '=' + GLOBAL_VAR + '[`-`]'

  RESULT +=
    ';' +
    'console.log(' +
    // Map groups
    GROUPS.map(([group, substring]) => {
      switch (group) {
        case 'function':
          // console.log(substring)
          return GLOBAL_VAR + '[' + JSON.stringify(IDENT_SET[substring]) + ']'
        case 'constructor':
          // console.log(substring)
          return (
            '`${' +
            LITERALS[substring] +
            '}`[' +
            GLOBAL_VAR +
            '.$][' +
            GLOBAL_VAR +
            '[`?`]]'
          )
        case 'constant':
          if (/true|false|Infinity|NaN|undefined/.test(substring))
            return '`${' + CONSTANTS[substring] + '}`'
          else return encodeString(substring)
        case 'number':
          return encodeString(substring)
        case 'symbol':
          return quote(substring)
        case 'default':
          return GLOBAL_VAR + '[+!``](' + quote(utf16toBase31(substring)) + ')'
        case 'spaces':
          return (
            GLOBAL_VAR +
            '[`-`][' +
            GLOBAL_VAR +
            '[`*`]](' +
            encodeString(substring.length) +
            ')'
          )
        case 'space':
          return '_' + GLOBAL_VAR
      }
    }).join`+` +
    ')'

  return RESULT
}

fs.writeFileSync('./run.js', generateDocument(text, '$', { STRICT_MODE: true }))
