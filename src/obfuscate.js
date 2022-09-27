import V from "voca";
import _ from "lodash";
import fs from "fs";
import isValidIdentifier from "is-valid-identifier";
import jsesc from "jsesc";
import XRegExp from "xregexp";

const print = console.log;
const text = fs.readFileSync("./input.txt", "utf8");

/**
 * PunkScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 */

function encodeText(
  code,
  globalVar,
  {strictMode = false, quoteStyle = "", variable = "var", threshold = 1} = {}
) {
  const BUILTINS =
    /^(Array|ArrayBuffer|AsyncFunction|AsyncGenerator|AsyncGeneratorFunction|Atomics|BigInt|BigInt64Array|BigUint64Array|Boolean|DataView|Date|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|exports|Float32Array|Float64Array|Function|Generator|GeneratorFunction|globalThis|Infinity|Int16Array|Int32Array|Int8Array|Intl|isFinite|isNaN|JSON|Map|Math|module|NaN|Number|Object|parseFloat|parseInt|Promise|Proxy|Reflect|RegExp|Set|SharedArrayBuffer|String|Symbol|this|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|undefined|unescape|WeakMap|WeakSet|WebAssembly)$/;

  const REGEXPS = {
    word: XRegExp(String.raw`[\pL\pN]+|[\0-\x1f\x7f]+`, "g"),
    symbol: /[!-\/:-@[-`{-~]+/g,
    unicode: /[^ -~]+/g,
  };

  /**
   * This regular expression splits the text into runs.
   * The literal space is ignored since it is the most used
   * character in plain text.
   */

  const REGEXP = RegExp(
    Object.entries(REGEXPS).map(([key, {source}]) => `(?<${key}>${source})`).join`|`,
    "g"
  );

  // Test whether an identifier can be made into a variable
  const checkIdentifier = (ident: string): boolean =>
    (ident = ident.trim()) && isValidIdentifier(ident) && !BUILTINS.test(ident);
  if (!checkIdentifier(globalVar)) throw new Error(`Invalid global variable: ${quote(globalVar)}`);

  // Reject strings above the length of 2^29 to avoid going over the max string limit
  const MAX_STRING_LENGTH = 536870888,
    enUS = Intl.NumberFormat("en-us");
  if (code.length > MAX_STRING_LENGTH)
    throw new Error(
      `Input string can only be up to ${enUS.format(NODE_MAX_LENGTH)} characters long`
    );

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

  const quoteSequence = quoteStyle.match(/\b(single|double|backtick)\b/g) || ["single"],
    quoteMode = quoteStyle.match(/\b(cycle|only|smart|random)\b/g)[0] || "smart";

  const quote = string => {
    const single = jsesc(string, {quotes: "single", wrap: true}),
      double = jsesc(string, {quotes: "double", wrap: true}),
      backtick = jsesc(string, {quotes: "backtick", wrap: true});

    let current;
    switch (quoteMode) {
      case "only":
        current = quoteSequence[0];
        break;
      case "cycle":
        current = quoteSequence[count++ % quoteSequence.length];
        break;
      case "random":
        current = quoteSequence[~~(Math.random() * quoteSequence.length)];
        break;
      case "smart": {
        let chosen;
        current = quoteSequence[0];
        const lengthMap = {single: single.length, double: double.length, backtick: backtick.length},
          lengthSorted = Object.entries(lengthMap).sort(([, a], [, b]) => a - b),
          [short, mid] = lengthSorted;
        switch (new Set(Object.values(lengthMap)).size) {
          case 3:
            chosen = short[0];
            break;
          case 2:
            chosen = short[0] == current || mid[0] == current ? current : short[0];
            break;
          case 1:
            chosen = current || short[0];
            break;
        }
        current = chosen;
      }
    }

    return jsesc(string, {quotes: current, wrap: true});
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
   * The second is assigned an arbitrary symbol. `_` and `$` are reserved
   * for the two most common letters E and T.
   * X and Z are rarely used and therefore get the escape sequences which
   * are slightly longer.
   */

  const LETTERS = "abcdefghijklmnopqrstuvwxyz";
  const CIPHER = ";.!:_-,?/'*+#%&^\"|~$=<>`@\\";
  const SPACE = "-";

  const encodeLetter = (char: Lower | Upper) =>
    (V.isUpperCase(char) ? "$" : "_") + CIPHER[LETTERS.indexOf(char.toLowerCase())];

  const encodeDigit = (number: string | number) =>
    (+number).toString(2).padStart(3, 0).split``.map(x => (x == 1 ? "$" : "_")).join``;

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
    "[object Object]": "{}", // [object objectLiteral]
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

  const quoteKey = string => {
    const single = jsesc(string, {quotes: "single", wrap: true}),
      double = jsesc(string, {quotes: "double", wrap: true}),
      backtick = jsesc(string, {quotes: "backtick", wrap: true});

    let current;
    switch (quoteMode) {
      case "only":
        current = quoteSequence[0];
        if (current == "backtick") return `[${backtick}]`;
        break;
      case "cycle":
        current = quoteSequence[count++ % quoteSequence.length];
        if (current == "backtick") return `[${backtick}]`;
        break;
      case "random":
        current = quoteSequence[~~(Math.random() * quoteSequence.length)];
        if (current == "backtick") return `[${backtick}]`;
        break;
      case "smart": {
        if (isValidIdentifier(string)) return string;
        let chosen;
        current = quoteSequence[0];
        const lengthMap = {single: single.length, double: double.length},
          lengthSorted = Object.entries(lengthMap).sort(([, a], [, b]) => a - b),
          [short, mid] = lengthSorted;
        switch (new Set(Object.values(lengthMap)).size) {
          case 2:
            chosen = short[0];
            break;
          case 1:
            chosen = current == "backtick" ? "single" : current || short[0];
            break;
        }
        current = chosen;
      }
    }

    return jsesc(string, {quotes: current, wrap: true});
  };

  // The separator is a semicolon, not a comma.
  let output =
    (strictMode
      ? `${variable.trim().toLowerCase() == "var" ? "var" : "let"}` + ` ${globalVar},_${globalVar};`
      : "") + `${globalVar}=~[];`;

  // STEP 1
  const CHARSET_1 = {};

  for (const [constant, expression] of Object.entries(CONSTANTS))
    for (const char of constant)
      if (/[\w\s]/.test(char) && !(char in CHARSET_1))
        CHARSET_1[char] = [expression, constant.indexOf(char)];

  const RES_CHARSET_1 =
    `${globalVar}={` +
    [...Array(10)].map(($, digit) => [
      `${encodeDigit(digit)}:\`\${++${globalVar}}\``,
      ...Object.entries(CHARSET_1)
        .filter(([, [, value]]) => value == digit)
        .map(
          ([char, [literal]]) =>
            `${quoteKey(char == " " ? "-" : encodeLetter(char))}:\`\${${literal}}\`[${globalVar}]`
        ),
    ]) +
    "}";

  output += RES_CHARSET_1;

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
    call: "!",
    concat: "+",
    constructor: "$",
    join: "%",
    return: "_",
    slice: "/",
    source: ",",
  };

  // And these are what we would achieve from there:
  const CONSTRUCTORS = {
    Array: "[]",
    Boolean: "(![])",
    Function: "(()=>{})",
    Number: "(~[])",
    RegExp: "/./",
    String: quote(""),
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
    const expansion = `\`\${${expression}[${globalVar}.$]}\`[${`${index}`.split``.map(
      digit => `${globalVar}.${encodeDigit(digit)}`
    ).join`+`}]`;
    if (!(char in CHARSET_1)) CHARSET_2[char] = [expression, index, expansion];
  }

  const objectDifference = (x: object, y: object) =>
    Object.fromEntries(_.difference(_.keys(x), _.keys(y)).map(z => [z, x[z]]));
  const CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1);

  const RES_CHARSET_2 =
    `${globalVar}={...${globalVar},` +
    Object.entries(CHARSET_2_DIFF).map(
      ([letter, [, , expansion]]) => `${quoteKey(encodeLetter(letter))}:${expansion}`
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
    [...`${str}`.replace(/\W/g, "")].map(
      char => do {
        if (/[$_]/.test(char)) {
          quote(char);
        } else if (/\d/.test(char)) {
          `${globalVar}.${encodeDigit(char)}`;
        } else {
          const encoded = encodeLetter(char);
          if (isValidIdentifier(encoded)) `${globalVar}.${encoded}`;
          else globalVar + `[${quote(encoded)}]`;
        }
      }
    ).join`+`;

  const encodeIdentifiers = (identifiers: {[ident]: string}) =>
    `${globalVar}={...${globalVar},` +
    Object.entries(identifiers)
      .map(([ident, key]) => [key, encodeString(ident)])
      .map(([key, expr]) => `${quoteKey(key)}:${expr}`) +
    "}";

  output += ";" + encodeIdentifiers(IDENT_SET1);
  output += ";" + RES_CHARSET_2;

  const IDENT_SET2 = {
    entries: ";",
    fromEntries: "<",
    indexOf: "#",
    map: "^",
    name: "?",
    repeat: "*",
    replace: ":",
    split: "|",
  };

  output += ";" + encodeIdentifiers(IDENT_SET2);

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
    escape: ">",
    eval: "=",
    parseInt: "~",
  };

  const RES_FUNCTIONS_1 =
    `${globalVar}={...${globalVar},` +
    Object.entries(GLOBAL_FUNC).map(
      ([ident, shortcut]) =>
        `${quoteKey(shortcut)}:` +
        "(()=>{})" +
        `[${globalVar}.$]` +
        "(" +
        `${globalVar}._+${globalVar}[${quote("-")}]+${encodeString(ident)}` +
        ")" +
        "()"
    ) +
    "}";

  output += ";" + RES_FUNCTIONS_1;

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
   */

  output +=
    ";" +
    `${globalVar}={...${globalVar},` +
    [
      [
        quoteKey("'"), // toString
        `${encodeString("to")}+` + `${quote("")}[${globalVar}.$]` + `[${globalVar}[${quote("?")}]]`,
      ],
      [
        quoteKey(encodeLetter("C")), // C
        `${globalVar}[${quote(">")}]` + `(${quote("<")})` + `[${globalVar}.${encodeDigit(2)}]`,
      ],
      [
        quoteKey(encodeLetter("D")), // D
        `${globalVar}[${quote(">")}]` + `(${quote("=")})` + `[${globalVar}.${encodeDigit(2)}]`,
      ],
    ].map(x => x.join`:`) +
    "}";

  /**
   * `U` is created from calling `toString` prototype on an empty object.
   *
   * @example
   * Object.toString.call().toString()[8]
   * `${{}.toString.call()}`[8]
   * @end
   *
   * We would use `U` and `C` to form the method name `toUpperCase`,
   * to retrieve the remaining uppercase letters. We would also form the
   * `Date` and `Buffer` constructors here for future use.
   *
   * The four other letters we would need to generate are the five
   * lowercase letters h, k, q, w and z, also using the toString
   * method, but this time they are converted from numbers.
   */

  const CIPHER_FROM = "0123456789abcdefghijklmnopqrstuvwxyz";

  output +=
    ";" +
    `${globalVar}={...${globalVar},` +
    [
      [
        quoteKey(encodeLetter("U")), // C
        `\`\${{}[${globalVar}[${quote("'")}]]` +
          `[${globalVar}[${quote("!")}]]()}\`` +
          `[${globalVar}.${encodeDigit(8)}]`,
      ],
      ...[..."hkqwz"].map(letter => [
        quoteKey(encodeLetter(letter)),
        `(+(${encodeString(CIPHER_FROM.indexOf(letter))}))` +
          `[${globalVar}[${quote("'")}]](${encodeString(36)})`,
      ]),
    ].map(x => x.join`:`) +
    "}";

  const IDENT_SET3 = {
    fromCharCode: "@",
    keys: "&",
    raw: "`",
    toUpperCase: '"',
  };

  output += ";" + encodeIdentifiers(IDENT_SET3);

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

  const CIPHER_TO = "_.:;!?*+^-=<>~'\"`/|#$%&@{}()[]\\";
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

  const alnumBase31 = (s: string) =>
    `${(s.match(/[a-z\d]{9}|[a-z\d]+/g) || []).map(
      x => [...`${parseInt(x, 36).toString(31)}`].map(x => CIPHER_FROM[CIPHER_TO.indexOf(x)]).join``
    )}`;

  const alnumBase31Decode = (s: string) =>
    s.split`,`
      .map(x =>
        parseInt([...x].map(x => CIPHER_TO[CIPHER_FROM.indexOf(x)]).join``, 31).toString(36)
      )
      .join(``);

  const uniBase31 = (s: string) =>
    `${[...Array(s.length)].map(
      (x, i) => [...s.charCodeAt(i).toString(31)].map(c => CIPHER_TO[CIPHER_FROM.indexOf(c)]).join``
    )}`;

  const uniBase31Decode = b =>
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

  const UNICODE_MACRO =
    "a=>a.split`,`.map(a=>parseInt([...a].map(a=>[...Array(+(31)).keys()].map(a=>a.toString(31))[CIPHER_TO.indexOf(a)]).join``,31)).map(a=>String.fromCharCode(a)).join``"
      .replace("CIPHER_TO", quote(CIPHER_TO))
      .replace(/\.toString\b/g, ident => `[${globalVar}[${quote("'")}]]`)
      .replace(/\b\d+\b/g, match => encodeString(match))
      .replace("parseInt", `${globalVar}[${quote("~")}]`)
      .replace(/\ba\b/g, "_" + globalVar)
      .replace(
        /\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g,
        p1 => `[${globalVar}[${quote(IDENT_SET[p1.slice(1)])}]]`
      )
      .replace(/\b(Array|String)\b/g, match => `${CONSTRUCTORS[match]}[${globalVar}.$]`);

  output += ";" + `${globalVar}[+![]]=${UNICODE_MACRO}`;

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
   * The comma syntactically used to separate array elements,
   * which are the ciphered digit substrings. When `.toString`
   * is called, the commas magically appear, therefore
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
   * We will now encode the string by matching all word patterns in the
   * string, ranking them by their frequency and then assigning symbol keys
   * to these values in base 32, skipping over all the keys which have been
   * already defined.
   *
   * These strings are referenced later on when we begin assembling the
   * string.
   */

  const keyGen = (function* () {
    const digitsTo = CIPHER_TO,
      digitsFrom = "0123456789abcdefghijklmnopqrstuvwxyz";

    /**
     * Convert an integer to bijective notation.
     * https://stackoverflow.com/questions/8603480/how-to-create-a-function-that-converts-a-number-to-a-bijective-hexavigesimal
     *
     * @param {Number} int - A positive integer above zero
     * @return {String} The number's value expressed in uppercase bijective base-26
     */

    const bijective = (int: number, sequence: string | string[]): string => {
      const length = sequence.length;
      if (!int) return "";
      if (int <= 0) return bijective(-int, sequence);
      if (int <= length) return sequence[int - 1];
      let index = int % length || length;
      let result = [sequence[index - 1]];
      while ((int = Math.floor((int - 1) / length)) > 0) {
        index = int % length || length;
        result.push(sequence[index - 1]);
      }
      return result.reverse().join``;
    };

    const existingKeys = new Set(
      [
        "'", // toString
        "-", // space
        Object.values(IDENT_SET),
        Object.values(GLOBAL_FUNC),
        [..."abcdefghijklmnopqrstuvwxyz"].map(encodeLetter),
        [..."ABCDEFINORSU"].map(encodeLetter),
        [..."0123456789"].map(encodeDigit),
      ].flat()
    );

    for (let i = 1; i <= Number.MAX_SAFE_INTEGER; i++) {
      const key = bijective(i, digitsTo);
      if (!existingKeys.has(key)) yield key;
    }

    return;
  })();

  const WORD_LIST =
    code.match(REGEXPS.word) ?? []
    |> Object.entries(_.countBy(%))
      .filter(([word, frequency]) => {
        const alreadyDefined = [
          ...Object.keys({...IDENT_SET, ...CONSTRUCTORS, ...CONSTANTS}),
          ...(CIPHER_FROM + "ABCDEFINORSU"),
        ];
        return !alreadyDefined.includes(word) && frequency > threshold;
      })
      .sort(([c, a], [d, b]) => b - a || c.length - d.length)
      .map(([word]) => [word, keyGen.next().value])
    |> Object.fromEntries(%);

  output +=
    ";" +
    `${globalVar}={...${globalVar},[~[]]:{` +
    Object.entries(WORD_LIST).map(([word, key]) => `${quoteKey(key)}:${quote(uniBase31(word))}`) +
    "}}";

  const WORD_LIST_EXPR =
    "globalVar[1]=Object.fromEntries(Object.entries(WORD_LIST).map(([k,v])=>[k,globalVar[0](v)]))"
      .replace(/\b(v)\b/g, match => "_" + globalVar)
      .replace(/\b(k)\b/g, match => "$" + globalVar)
      .replace(/\b(0)\b/g, match => "+![]")
      .replace(/\b(1)\b/g, match => `+!${quote("")}`)
      .replace(/\b(WORD_LIST)\b/g, `${globalVar}[~[]]`)
      .replace(/\b(globalVar)\b/g, globalVar)
      .replace(/\b(Object)\b/g, match => `{}[${globalVar}.$]`)
      .replace(
        /\.\b(map|entries|fromEntries)\b/g,
        p1 => `[${globalVar}[${quote(IDENT_SET[p1.slice(1)])}]]`
      );

  output += ";" + WORD_LIST_EXPR;
  output += ";" + `${globalVar}={...${globalVar},...${globalVar}[+!${quote("")}]}`;

  /**
   * PART 5: SUBSTITUTION
   *
   * We would first split up the text into spaces so we can join
   * the result into a string later on. Spaces are represented
   * with empty elements in an array and returned with joins.
   */

  const testRawString = string => {
    try {
      if (/(?<!\\)\$\{/.test(string)) throw new Error();
      eval(`(\`${string}\`)`);
      return true;
    } catch {
      return false;
    }
  };

  const transform = substring =>
    [...substring.matchAll(REGEXP)].map(match => {
      const [group, substring] = Object.entries(match.groups).filter(([, val]) => !!val)[0];
      switch (group) {
        case "unicode":
          const encoded = uniBase31(substring);
          return `${globalVar}[+![]](${quote(encoded)})`;
        case "word":
          switch (true) {
            case /\b[\da-zA-FINORSU]\b/.test(substring):
              return encodeString(substring);
            case typeof CONSTANTS[substring] == "string":
              return `\`\${${CONSTANTS[substring]}}\``;
            case typeof CONSTRUCTORS[substring] == "string":
              return `${CONSTRUCTORS[substring]}[${globalVar}.$][${globalVar}[${quote("?")}]]`;
            case typeof IDENT_SET[substring] == "string":
              if (isValidIdentifier(IDENT_SET[substring]))
                return globalVar + "." + IDENT_SET[substring];
              else return globalVar + `[${quote(IDENT_SET[substring])}]`;
            case typeof WORD_LIST[substring] == "string":
              return `${globalVar}[${quote(WORD_LIST[substring])}]`;
            default:
              const encoded = uniBase31(substring);
              return `${globalVar}[+![]](${quote(encoded)})`;
          }
        default: {
          if (substring.includes("\\") && testRawString(substring))
            return `${quote("")}[${globalVar}.$][${globalVar}[${quote("`")}]]\`${substring}\``;
          else return quote(substring);
        }
      }
    }).join`+`;

  const expression =
    "[" +
    code.split` `.map(transform) +
    "]" +
    `[${globalVar}[${quote("%")}]]` +
    `(${globalVar}[${quote("-")}])`;

  output += ";" + `_${globalVar}=${expression}`;

  // Export
  output += ";" + "module.exports.result=_" + globalVar;

  return {
    result: output,
    stats: `=====
STATS
=====
Input length: ${enUS.format(code.length)}
Expression length: ${enUS.format(expression.length)}
Ratio: ${expression.length / code.length}
Output length: ${enUS.format(output.length)}`,
  };
}

const {result, stats} = encodeText(text, "$", {
  strictMode: true,
  quoteStyle: "smart backtick",
});

print(stats);

fs.writeFileSync("./output.js", result);
