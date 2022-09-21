import V from "voca";
import _ from "lodash";
import fs from "fs";
import isValidIdentifier from "is-valid-identifier";
import jsesc from "jsesc";

const print = console.log;
const text = fs.readFileSync("./input.txt", "utf8");

const BUILTINS =
  /\b(Infinity|NaN|undefined|globalThis|this|eval|isFinite|isNaN|parseFloat|parseInt|encodeURI|encodeURIComponent|decodeURI|decodeURIComponent|escape|unescape|Object|Function|Boolean|Symbol|Number|BigInt|Math|Date|String|RegExp|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array|BigInt64Array|BigUint64Array|Map|Set|WeakMap|WeakSet|ArrayBuffer|SharedArrayBuffer|Atomics|DataView|JSON|Promise|Generator|GeneratorFunction|AsyncFunction|AsyncGenerator|AsyncGeneratorFunction|Reflect|Proxy|Intl|WebAssembly)\b/;

const REGEXPS = {
  space: / +/g,
  constant: /\b(true|false|Infinity|NaN|undefined)\b/g,
  constructor: /\b(Array|Object|String|Number|Boolean|RegExp|Function)\b/g,
  word: /\b([GHJ-MPQTV-Z]|[A-Za-z]{2,})\b/g,
  letter: /\b[a-zA-FINORSU\d]\b/g,
  symbol: /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/g,
  default: /[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]+/g,
};

/**
 * This regular expression splits the text into runs.
 * The literal space is ignored since it is the most used
 * character in plain text.
 */

let REGEXP =
  Object.entries(REGEXPS)
  |> %.map(([key, {source}]) => `(?<${key}>${source})`)
  |> %.join`|`;
REGEXP = RegExp(REGEXP, "g");

module.exports.REGEXP = REGEXP;

/**
 * JinxScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 * - Execution, where the constructed code is evaluated and executed.
 */

function generateDocument(
  TEXT,
  GLOBAL_VAR,
  {STRICT_MODE = false, QUOTE = ""} = {}
) {
  const checkIdentifier = (ident: string): boolean =>
    isValidIdentifier(ident) && !BUILTINS.test(ident);
  if (!checkIdentifier(GLOBAL_VAR))
    throw new Error(`Invalid global variable: ${quote(GLOBAL_VAR)}`);

  /**
   * Encase a string in literal quotes; finding the shortest
   * ASCII stringified representation of the original string.
   *
   * @example
   * print(quote`"'"`)
   * print(quote`\xff"\xad\n`)
   * print(quote`'json`)
   */

  let count = 0;
  const quote = string => do {
    const single = string.match(/'/g)?.length || 0,
      double = string.match(/"/g)?.length || 0,
      backtick = !/\$\{|`/.test(string) && /['"]/.test(string),
      singleOrDouble = /single|double/i.test(QUOTE);
    let choice = do {
      if (/only/.test(QUOTE) && singleOrDouble) choice.split` `[0];
      else if (singleOrDouble) {
        if (single < double) "single";
        else if (single > double) "double";
        else QUOTE.toLowerCase().trim();
      } else ["single", "double"][count++ % 2];
    };
    jsesc(string, {quotes: choice, wrap: true});
  };

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

  const LETTERS = `abcdefghijklmnopqrstuvwxyz`;
  const CIPHER = `;.!:_-,?/'*+#%&^"|~$=<>\`@\\`;
  const SPACE = "-";

  const encodeLetter = (char: Lowercase | Uppercase) =>
    (V.isUpperCase(char) ? "$" : "_") +
    (char.toLowerCase() |> LETTERS.indexOf(%) |> CIPHER[%]);

  const encodeDigit = (number: string | number) =>
    +number
    |> %.toString(2).padStart(3, 0)
    |> %.replace(/(?<$0>0)|(?<$1>1)/g, ($0, $1) => ($0 == 1 ? "$" : "_"));

  /**
   * @example
   * print(encodeDigit(314))
   * print(encodeLetter('x'))
   */

  const CONSTANTS = {
    true: `!${quote("")}`, // ''==false
    false: "![]", // []==true
    undefined: "[][[]]", // [][[]] doesn't exist
    Infinity: `!${quote("")}/![]`, // true/false==1/0
    NaN: "+{}", // It makes sense
    "[object Object]": "{}", // y e s
  };

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
  let RESULT = `${STRICT_MODE ? `let _${GLOBAL_VAR},` : ""}${GLOBAL_VAR}=~[];`;

  // STEP 1
  const CHARSET_1 = {};

  for (const [constant, expression] of Object.entries(CONSTANTS))
    for (const char of constant)
      if (/[\w\s]/.test(char) && !(char in CHARSET_1))
        CHARSET_1[char] = [expression, constant.indexOf(char)];

  const RES_CHARSET_1 =
    _.range(0, 10)
    |> %.map((digit: number) => [
      `${encodeDigit(digit)}:\`\${++${GLOBAL_VAR}}\``,
      Object.entries(CHARSET_1)
      |> %.filter(([, [, val: number]]) => val == digit)
      |> %.map(([char, [lit]]) => {
        const key = quote(encodeLetter(char));
        return `${key}:\`\${${lit}}\`[${GLOBAL_VAR}]`;
      }),
    ])
    |> %.flat().join`,`
    |> %.replace(/,$/, "").replace(/,+/g, ",")
    |> GLOBAL_VAR + "={" + % + "}"
    |> %.replace("_undefined", SPACE); // Replace space

  RESULT += RES_CHARSET_1;

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
    concat: "+",
    call: "!",
    join: "%",
    slice: "/",
    return: "_",
    constructor: "$",
  };

  // And these are what we would achieve from there:
  const CONSTRUCTORS = {
    Array: "[]",
    Object: "{}",
    String: quote(""),
    Number: "(~[])",
    Boolean: "(![])",
    RegExp: "/./",
    Function: "(()=>{})",
  };

  const CHARSET_2 = {...CHARSET_1};

  for (const [key, expression] of Object.entries(CONSTRUCTORS)) {
    let index;
    const constructor = eval(key).toString();
    for (const char of constructor)
      if (/[\w\s]/.test(char) && !(char in CHARSET_2))
        CHARSET_2[char] = [expression, (index = constructor.indexOf(char))];
  }

  for (const value of Object.entries(CHARSET_2)) {
    const [char, [expression, index]] = value;
    const expansion = `\`\${${expression}[${GLOBAL_VAR}.$]}\`[${`${index}`
      .split``.map(digit => `${GLOBAL_VAR}.${encodeDigit(digit)}`).join`+`}]`;
    if (!(char in CHARSET_1)) CHARSET_2[char] = [expression, index, expansion];
  }

  const objectDifference = (x: object, y: object) =>
    Object.fromEntries(
      _.difference(Object.keys(x), Object.keys(y)).map(z => [z, x[z]])
    );
  const CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1);

  const RES_CHARSET_2 =
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    Object.entries(CHARSET_2_DIFF).map(
      ([letter, [, , expansion]]) =>
        `${quote(encodeLetter(letter))}:${expansion}`
    ) +
    "}";

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
  const encodeString = (str: string = ""): string =>
    [...`${str}`.replace(/\W/g, "")].map(char => {
      if (/[$_]/.test(char)) {
        return quote(char);
      } else if (/\d/.test(char)) {
        return `${GLOBAL_VAR}.${encodeDigit(char)}`;
      } else {
        const encoded = encodeLetter(char);
        return isValidIdentifier(encoded)
          ? `${GLOBAL_VAR}.${encoded}`
          : `${GLOBAL_VAR}[${quote(encoded)}]`;
      }
    }).join`+`;

  const encodeIdentifiers = (identifiers: {[ident]: string}) =>
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    Object.entries(identifiers)
      .map(([ident, key]) => [key, encodeString(ident)])
      .map(
        ([key, expr]) => `${isValidIdentifier(key) ? key : quote(key)}:${expr}`
      ) +
    "}";

  RESULT += ";" + encodeIdentifiers(IDENT_SET1);
  RESULT += ";" + RES_CHARSET_2;

  const IDENT_SET2 = {
    name: "?",
    map: "^",
    replace: ":",
    repeat: "*",
    split: "|",
    indexOf: "#",
    source: "`",
  };

  RESULT += ";" + encodeIdentifiers(IDENT_SET2);

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
    eval: "=",
    escape: ">",
    unescape: "<",
    parseInt: "~",
    parseFloat: '"',
  };

  const RES_FUNCTIONS_1 =
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    Object.entries(GLOBAL_FUNC).map(
      ([ident, shortcut]) =>
        `${quote(shortcut)}:` +
        "(()=>{})" +
        `[${GLOBAL_VAR}.$]` +
        "(" +
        `${GLOBAL_VAR}._+${GLOBAL_VAR}[${quote("-")}]+${encodeString(ident)}` +
        ")" +
        "()"
    ) +
    "}";

  RESULT += ";" + RES_FUNCTIONS_1;

  /**
   * We would need to get the method `toString` by getting the `name`
   * of the `String` constructor, for us to retrieve the rest of the
   * alphabet, and use to retrieve words from 64-bit float numbers.
   *
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
   * @end
   *
   */

  RESULT +=
    ";" +
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    [
      [
        quote("'"), // toString
        `${encodeString("to")}+` +
          `${quote("")}[${GLOBAL_VAR}.$]` +
          `[${GLOBAL_VAR}[${quote("?")}]]`,
      ],
      [
        quote(encodeLetter("C")), // C
        `${GLOBAL_VAR}[${quote(">")}]` +
          `(${quote("<")})` +
          `[${GLOBAL_VAR}.${encodeDigit(2)}]`,
      ],
      [
        quote(encodeLetter("D")), // D
        `${GLOBAL_VAR}[${quote(">")}]` +
          `(${quote("=")})` +
          `[${GLOBAL_VAR}.${encodeDigit(2)}]`,
      ],
    ].map(x => x.join`:`) +
    "}";

  /**
   *
   * `U` is created from calling `toString` prototype on an empty object.
   *
   * @example
   * Object.toString.call().toString()[8]
   * `${{}.toString.call()}`[8]
   * @end
   *
   * We would use `U` and `C` to form the method name `toUpperCase`,
   * to retrieve the remaining uppercase letters.
   *
   * We would also form the `Date` and `Buffer` constructors here for
   * future use.
   *
   * The four other letters we would need to generate are the five lowercase
   * letters h, k, q, w and z, also using the toString method, but this
   * time they are converted from numbers.
   */

  const CIPHER_FROM = "0123456789abcdefghijklmnopqrstuvwxyz";

  RESULT +=
    ";" +
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    [
      [
        quote(encodeLetter("U")), // C
        `\`\${{}[${GLOBAL_VAR}[${quote("'")}]]` +
          `[${GLOBAL_VAR}[${quote("!")}]]()}\`` +
          `[${GLOBAL_VAR}.${encodeDigit(8)}]`,
      ],
      ...[..."hkqwz"].map(letter => [
        quote(encodeLetter(letter)),
        `(+(${encodeString(CIPHER_FROM.indexOf(letter))}))` +
          `[${GLOBAL_VAR}[${quote("'")}]](${encodeString(36)})`,
      ]),
    ].map(x => x.join`:`) +
    "}";

  const IDENT_SET3 = {fromCharCode: "@", keys: "&"};
  RESULT += ";" + encodeIdentifiers(IDENT_SET3);

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

  const CIPHER_TO = `_.:;!?*+^-=<>~'"/|#$%&@{}()[]\`\\`;
  const IDENT_SET = {...IDENT_SET1, ...IDENT_SET2, ...IDENT_SET3};

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

  const base31 = (s: string) =>
    `${[...Array(s.length)].map(
      (x, i) =>
        [...s.charCodeAt(i).toString(31)].map(
          c => CIPHER_TO[CIPHER_FROM.indexOf(c)]
        ).join``
    )}`;

  const base31Decode = b =>
    String.fromCharCode(
      ...b.split`,`.map(s =>
        parseInt([...s].map(c => CIPHER_FROM[CIPHER_TO.indexOf(c)]).join``, 31)
      )
    );

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
   *
   * This makes it a heck ton easier to encode expressions with just
   * a few surgical regex substitutions.
   */

  const ENCODING_MACRO =
    "a=>a.split`,`.map(a=>parseInt([...a].map(a=>[...Array(+(31)).keys()].map(a=>a.toString(31))[CIPHER_TO.indexOf(a)]).join``,31)).map(a=>String.fromCharCode(a)).join``"
      .replace("CIPHER_TO", quote(CIPHER_TO))
      .replace(/\.toString\b/g, ident => `[${GLOBAL_VAR}[${quote("'")}]]`)
      .replace("Array", `[][${GLOBAL_VAR}.$]`)
      .replace("String", `${quote("")}[${GLOBAL_VAR}.$]`)
      .replace(/\b\d+\b/g, match => encodeString(match))
      .replace("parseInt", `${GLOBAL_VAR}[${quote("~")}]`)
      .replace(/\ba\b/g, "_" + GLOBAL_VAR)
      .replace(/\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g, p1 => {
        p1 = p1.replace(/^\./, "");
        return `[${GLOBAL_VAR}[${quote(IDENT_SET[p1])}]]`;
      });

  RESULT += ";" + `${GLOBAL_VAR}[+![]]=${ENCODING_MACRO}`;

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
    "true",
    "false",
    "Infinity",
    "NaN",
    "undefined",
    Object.keys(IDENT_SET),
  ].flat();

  /**
   * PART 4: ENCODING
   *
   * What we would now do is encode the string by matching all
   * words in the string, ranking them by their frequency and then
   * assigning symbol keys to these values in base 30, excluding
   * combinations with _ and $ which are valid identifiers
   * and have already been assigned.
   *
   * They would be referenced later on when we assemble the
   * string.
   */

  const keyGen = (function* () {
    const digitsTo = `.,:;!?*+^-=<>~'"\`/|\\#%&@()[]{}`,
      digitsFrom = "0123456789abcdefghijklmnopqrstuvwxyz";
    // yield brackets first since we didn't use them as keys yet
    for (const key of "()[]{}") yield key;
    for (let i = 0; i <= Number.MAX_SAFE_INTEGER; i++)
      yield i.toString(digitsTo.length)
      |> %.padStart(2, 0).split``
      |> %.map(a => digitsTo[digitsFrom.indexOf(a)])
      |> %.join``;
  })();

  const WORD_LIST =
    TEXT.match(REGEXPS.word) ?? []
    |> Object.entries(_.countBy(%))
    |> %.filter(([a]) => !Object.keys(IDENT_SET).includes(a))
    |> %.sort(([, a], [, b]) => b - a)
    |> %.map(([word]) => [word, keyGen.next().value])
    |> Object.fromEntries(%);

  RESULT +=
    ";" +
    `${GLOBAL_VAR}={...${GLOBAL_VAR},` +
    Object.entries(WORD_LIST).map(
      ([word, key]) =>
        `${quote(key)}:${GLOBAL_VAR}[+![]](${quote(base31(word))})`
    ) +
    "}";

  /**
   * PART 5: SUBSTITUTION
   *
   * We would first split up the text into spaces so we can join
   * the result into a string later on. Spaces are represented
   * with empty arrays.
   */

  const GROUPS = [...text.matchAll(REGEXP)]
    .map(({groups}) => Object.entries(groups).filter(([, value]) => !!value))
    .flat(1);

  const EXPRESSION = GROUPS.map(([group, substring]) => {
    switch (group) {
      case "constant":
        return `\`\${${CONSTANTS[substring]}}\``;
      case "constructor":
        return `${
          CONSTRUCTORS[substring]
        }[${GLOBAL_VAR}.$][${GLOBAL_VAR}[${quote("?")}]]`;
      case "letter":
        return encodeString(substring);
      case "word":
        let key = WORD_LIST[substring];
        if (typeof IDENT_SET[substring] == "string") key = IDENT_SET[substring];
        return `${GLOBAL_VAR}[${quote(key)}]`;
      case "default":
        const encoded = base31(substring);
        return `${GLOBAL_VAR}[+![]](${quote(encoded)})`;
      case "space":
        const {length} = substring;
        const encodedLen = encodeString(length);
        return length == 1
          ? `${GLOBAL_VAR}[${quote("-")}]`
          : `${GLOBAL_VAR}[${quote("-")}][${GLOBAL_VAR}[${quote("*")}]]` +
              `(${encodedLen})`;
      case "symbol":
        return quote(substring);
    }
  }).join`+`;

  RESULT += ";" + `_${GLOBAL_VAR}=${EXPRESSION}`;

  // Export
  RESULT +=
    ";" +
    "module" +
    `[${quote("exports")}]` +
    `[${quote("result")}]=_` +
    GLOBAL_VAR;

  return {
    result: RESULT,
    stats: `=====
STATS
=====
Input length: ${TEXT.length}
Expression length: ${EXPRESSION.length}
Ratio: ${EXPRESSION.length / TEXT.length}
Output length: ${RESULT.length}`,
  };
}

const {result, stats} = generateDocument(text, "_", {
  STRICT_MODE: true,
  QUOTE: "single",
});

console.log(stats);

fs.writeFileSync("./output.js", result);
