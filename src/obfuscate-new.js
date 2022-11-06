let fs = require("fs");
let V = require("voca");
let _ = require("lodash");
let jsesc = require("jsesc");
let XRegExp = require("xregexp");
let isValidIdent = require("is-valid-identifier");
let uglify = require("uglify-js");
let genex = require("genex");

let text = fs.readFileSync("./input.txt", "utf8");

function encode(text, globalVar = "$") {
  // CONSTANTS

  let letters = "etaoinshrdlucmfwypvbgkqjxz";
  let cipher = "_$-,;:!?.@*/&#%^+<=>|~'\"`\\";
  let alnum = "0123456789abcdefghijklmnopqrstuvwxyz";

  let constantExprs = {
    "-1": /[+~]\[]/,
    0: /\+(\[]|""|''|``)/,
    1: /\+!(""|''|``)|-~\[]/,
    true: /!(""|''|``)/,
    false: /!({}|\[])/,
    NaN: /\+{}/,
    "[object Object]": /{}/,
    Infinity: /!(""|''|``)\/(!({}|\[])|\+(\[]|""|''|``))/,
    undefined: /(""|''|``|\[])\[(""|''|``|\[]|{})\]/,
  };

  constantExprs = _.mapValues(constantExprs, x => genex(x).generate());

  let constructorExprs = {
    Array: /\[]/,
    Boolean: /\(!(""|''|``|{}|\[])\)/,
    Function: /\([_$]=>(""|''|``|{}|\[])\)/,
    Number: /\([+~](""|''|``|{}|\[])\)/,
    String: /""|''|``/,
    RegExp: /\/[!-',-.:->@\]-`{-~]\//,
    Object: /{}/,
  };

  constructorExprs = _.mapValues(constructorExprs, x => genex(x).generate());

  let wordCipher1 = {
    constructor: "$",
    return: "_",
    slice: "/",
    sort: ">",
    join: "+",
    filter: "%",

    for: "*_",
    if: "!_",
  };

  let wordCipher2 = {
    indexOf: "#",
    map: "^",
    name: "?",
    repeat: "*",
    replace: '"',
    reverse: "<",
    split: "|",

    BigInt: "++",
    Set: "--",

    var: "=_",
  };

  let globalFunctions = {
    escape: "\\",
    eval: "=",
  };

  let wordCipher3 = {
    keys: "&",
    length: ":",
    new: "+_",
    raw: "`",

    toUpperCase: "@",
  };

  let wordCiphers = {
    ...wordCipher1,
    ...wordCipher2,
    ...wordCipher3,
  };

  let functionCiphers = {
    encodeBijective: "+[]",
    decodeBijective: "~[]",
    compressRange: "![]",
    expandRange: "!''",
  };

  // HELPER FUNCTIONS

  function cycle(arr) {
    return arr[arrCount++ % arr.length];
  }

  let quoteCount = 0;
  let arrCount = 0;

  function quoteKey(string) {
    return quote(string, true);
  }

  function quote(string, key = false) {
    if (key && isValidIdent(string)) return string;

    let quoteSequence = ["single", "double", "backtick"];
    if (key) quoteSequence.splice(2, 1);
    let quotedStrings = quoteSequence.map(quotes => [quotes, jsesc(string, {quotes, wrap: true})]);
    quotedStrings = _.fromPairs(quotedStrings);

    let lengthMap = _.mapValues(quotedStrings, x => x.length);

    let lengthSorted = _.toPairs(lengthMap).sort(([, a], [, b]) => a - b);
    let [short, mid] = lengthSorted;
    let lengthSet = new Set(_.values(lengthMap));
    let quotes = quoteSequence[quoteCount++ % quoteSequence.length];

    if ((key && lengthSet.size == 2) || (!key && lengthSet.size == 3)) {
      quotes = short[0];
    } else if (!key && lengthSet.size == 2) {
      quotes = [short[0], mid[0]].includes(quotes) ? quotes : short[0];
    } else {
      quotes = quotes || short[0];
    }

    return jsesc(string, {quotes, wrap: true});
  }

  function encodeCharKey(char) {
    char = String(char);
    let key;

    if (/[a-zA-Z]/.test(char)) {
      key = (V.isUpperCase(char) ? "$" : "_") + cipher[letters.indexOf(char.toLowerCase())];
    }

    if (/\d/.test(char)) {
      key = [...(+char).toString(2).padStart(3, 0)].map(x => (+x ? "$" : "_")).join``;
    }

    if (char == " ") key = "-";

    return quoteKey(key);
  }

  function encodeChar(char) {
    let letters = "etaoinshrdlucmfwypvbgkqjxz";
    let cipher = "_$-,;:!?.@*/&#%^+<=>|~'\"`\\";

    if (/[a-zA-FINORSU]/.test(char)) {
      let key = (V.isUpperCase(char) ? "$" : "_") + cipher[letters.indexOf(char.toLowerCase())];
      if (isValidIdent(key)) return `${globalVar}.${key}`;
      else return `${globalVar}[${quote(key)}]`;
    }

    if (/[GHJ-MPQTV-Z]/.test(char))
      return `${encodeChar(char.toLowerCase())}[${globalVar}[${quote("@")}]]()`;

    if (/\d/.test(char)) {
      let key = [...(+char).toString(2).padStart(3, 0)].map(x => (+x ? "$" : "_")).join``;
      return `${globalVar}.${key}`;
    }

    if (char == " ") return `${globalVar}[${quote("-")}]`;

    return quote(char);
  }

  function encodeString(string) {
    return [...string].map(char => encodeChar(char, globalVar)).join`+`;
  }

  function encodeProps(props) {
    return (
      `${globalVar}={...${globalVar},` +
      _.entries(props)
        .map(([prop, key]) => [key, encodeString(prop)])
        .map(([key, expr]) => `${quoteKey(key)}:${expr}`) +
      "};"
    );
  }

  function encodeFunction(func) {
    let count = 1,
      digits = "_$";

    let code = uglify
      .minify(`${func}`, {compress: {reduce_funcs: true}})
      .code.replace(/^function \w+/, "")
      .replace("){", ")=>{");

    let variables = [...new Set(code.match(/\b[a-z]\b/g))];
    variables = _.fromPairs(variables.map(v => [v, encodeBijective(count++, digits) + globalVar]));

    let result = code
      .replace(RegExp(`\\b(${_.keys(variables).join`|`})\\b`, "g"), match => variables[match])
      .replace(
        RegExp(`\\b(${_.keys(functionCiphers).join`|`})\\b`, "g"),
        match => `${globalVar}[${functionCiphers[match]}]`
      )
      .match(/ |[\da-z]+|[^ \da-z]+/gi)
      .map(match =>
        match in constructorExprs
          ? `${cycle(constructorExprs[match])}[${globalVar}.$][${globalVar}[${quote("?")}]]`
          : match in wordCiphers
          ? `${globalVar}[${quote(wordCiphers[match])}]`
          : /[^\s\da-z]+/i.test(match)
          ? quote(match)
          : encodeString(match)
      ).join`+`;

    // DEBUG
    return result;

    // return `${globalVar}[${quote("=")}](${result})`;
  }

  // HEADER

  let header = `${globalVar}=~[];`;

  let charMap1 = {};

  for (let [constant, expr] of _.entries(constantExprs))
    for (let char of constant)
      if (/[a-zA-Z ]/.test(char) && !(char in charMap1))
        charMap1[char] = [expr, constant.indexOf(char)];

  let charMap1Expr =
    `${globalVar}={` +
    _.range(0, 10).map(($, digit) => [
      `${encodeCharKey(digit)}:\`\${++${globalVar}}\``,
      ..._.entries(charMap1)
        .filter(([, [, value]]) => value == digit)
        .map(([char, [exprs]]) => `${encodeCharKey(char)}:\`\${${cycle(exprs)}}\`[${globalVar}]`),
    ]) +
    "};";

  header += charMap1Expr;

  let charMap2 = {};

  for (let [key, exprs] of _.entries(constructorExprs)) {
    let constructor = eval(key).toString();
    for (let char of constructor) {
      if (/[a-zA-Z ]/.test(char) && !(char in charMap1) && !(char in charMap2)) {
        let index = constructor.indexOf(char);
        let expansion =
          `\`\${${cycle(exprs)}[${globalVar}.$]}\`` + `[${encodeString(String(index))}]`;
        charMap2[char] = [expansion, index];
      }
    }
  }

  let charMap2Expr =
    `${globalVar}={...${globalVar},` +
    _.entries(charMap2).map(([letter, [expansion]]) => `${encodeCharKey(letter)}:${expansion}`) +
    "};";

  header += encodeProps(wordCipher1);

  header += charMap2Expr;

  header += encodeProps(wordCipher2);

  let globalFunctionsExpr =
    `${globalVar}={...${globalVar},` +
    _.entries(globalFunctions).map(
      ([ident, shortcut]) =>
        `${quoteKey(shortcut)}:${cycle(constructorExprs.Function)}[${globalVar}.$]` +
        `(${[`${globalVar}._`, `${globalVar}[${quote("-")}]`, encodeString(ident)].join`+`})()`
    ) +
    "};";

  header += globalFunctionsExpr;

  header +=
    `${globalVar}={...${globalVar},` +
    [
      [
        quoteKey("'"),
        `${encodeString("to")}+${quote("")}[${globalVar}.$][${globalVar}[${quote("?")}]]`,
      ],
      [encodeCharKey("C"), `${globalVar}[${quote("\\")}](${quote("<")})[${encodeString("2")}]`],
      [encodeCharKey("D"), `${globalVar}[${quote("\\")}](${quote("=")})[${encodeString("2")}]`],
    ].map(x => x.join`:`) +
    "};";

  header +=
    `${globalVar}={...${globalVar},` +
    [
      [
        encodeCharKey("U"),
        `\`\${{}[${globalVar}[${quote("'")}]]` +
          `[${encodeString("call")}]()}\`` +
          `[${encodeString("8")}]`,
      ],
    ].map(x => x.join`:`) +
    "};";

  let lowercase = [..."hkqwz"];
  let lowercaseExpr =
    `[${lowercase.map(encodeString)}]=` +
    `[${lowercase.map(letter => encodeString(String(alnum.indexOf(letter))))}]` +
    `[${globalVar}[${quote("^")}]]` +
    `(_=>(+_)[${globalVar}[${quote("'")}]](${encodeString("36")}));`;

  header += lowercaseExpr;

  header += encodeProps(wordCipher3);

  header +=
    `${globalVar}={...${globalVar},` +
    [
      ...[encodeBijective, decodeBijective, compressRange, expandRange].map(func => [
        `[${functionCiphers[func.name]}]`,
        encodeFunction(func),
      ]),
    ].map(x => x.join`:`) +
    "};";

  console.log(
    header +
      `console.log(Object.fromEntries(Object.entries(${globalVar}).sort(([,x],[,y])=>String(x).localeCompare(String(y)))))`
  );

  // ENCODING FUNCTIONS

  function encodeBijective(int, chars) {
    chars = [...new Set(chars)];
    var b = BigInt;
    var base = b(chars.length);
    var index = (int = b(int)) % base || base;
    var result = chars[index - 1n];
    if (int <= 0n) return "";
    else
      while ((int = (int - 1n) / base) > 0n)
        result = chars[(index = int % base || base) - 1n] + result;
    return result;
  }

  function decodeBijective(str, chars) {
    chars = [...new Set(chars)];
    str = [...str];
    var b = BigInt;
    var result = 0n;
    var base = b(chars.length);
    var strLen = str.length;
    for (var index = 0; index < strLen; index++)
      result += b(chars.indexOf(str[index]) + 1) * base ** b(strLen - index - 1);
    return result;
  }

  function compressRange(chars, digits, sep = ",", sub = ".") {
    digits = [...new Set(digits)].filter(digit => digit != sep && digit != sub).join``;

    return [...new Set(chars)]
      .map(char => char.codePointAt())
      .sort((x, y) => x - y)
      .reduce((acc, cur, idx, src) => {
        var prev = src[idx - 1];
        var diff = cur - prev;
        if (idx > 0 && diff == prev - src[idx - 2]) {
          var last = acc.length - 1;
          acc[last][1] = cur;
          if (diff > 1) acc[last][2] = diff;
        } else acc.push([cur]);
        return acc;
      }, [])
      .map(num => num.map(x => encodeBijective(x, digits)).join(sub))
      .join(sep);
  }

  function expandRange(run, digits, sep = ",", sub = ".") {
    function range(start, end, step = 1, offset = 0) {
      var direction = start < end ? 1 : -1;
      return [...Array((Math.abs(end - start) + offset * 2) / step + 1)].map(
        ($, index) => start - direction * offset + direction * step * index
      );
    }

    digits = [...new Set(digits)].filter(digit => digit != sep && digit != sub).join``;

    return run
      .split(sep)
      .map(end => {
        var res = end.split(sub).map(num => +`${decodeBijective(num, digits)}`);
        return res.length == 1 ? res : range(...res);
      })
      .flat()
      .map(p => String.fromCodePoint(p)).join``;
  }

  let expression = "";

  // TOKENIZATION

  let regExps = {
    alnum: /[a-zA-Z]+/giu,
    digit: /\d+/giu,
    latin: /[\p{Script=Latin}]+/giu,
    letter: /[\p{L}\p{M}\p{N}]+/giu,
    punct: /[!-\/:-@[-`{-~]+/giu,
    unicode: /[\0-\uffff]+/giu,
    astral: /[\u{10000}-\u{10ffff}]+/giu,
    space: / +/giu,
  };

  let bigRegExp = RegExp(
    _.entries(regExps).map(([key, {source}]) => `(?<${key}>${source})`).join`|`,
    "giu"
  );

  let punct = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";

  let charset = [...new Set(text)]
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0))
    .filter(x => punct.includes(x)).join``;

  console.log(charset);

  let existingKeys = [
    "'", // toString
    "-", // space
    _.values(wordCiphers),
    _.values(globalFunctions),
    [..." abcdefghijklmnopqrstuvwxyzABCDEFINORSU0123456789"].map(x =>
      encodeCharKey(x)
        .replace(/^['"`]|['"`]$/g, "")
        .replace(/\\(.)/g, "$1")
    ),
  ].flat();

  console.log(existingKeys);

  let keyGen = (function* () {
    for (let i = 1; ; i++) {
      let key = encodeBijective(i, punct);
      if (!existingKeys.includes(key)) yield key;
    }
  })();

  for (let i = 0; i < 100; i++) console.log(keyGen.next().value);

  function testRawString(string) {
    try {
      if (/(?<!\\)\$\{/.test(string)) throw new Error();
      eval(`(\`${string}\`)`);
      return true;
    } catch {
      return false;
    }
  }

  let wordMap = (() => {
    let words = text.match(regExps.alnum) ?? [];

    let wordMap = Object.entries(_.countBy(words))
      .filter(([word, frequency]) => {})
      .sort(([c, a], [d, b]) => b - a || c.length - d.length)
      .map(([word]) => [word, keyGen.next().value]);

    return _.fromPairs(wordMap);
  })();

  function encodeText(substring) {
    return [...substring.matchAll(bigRegExp)].map(match => {
      let [group, substring] = _.entries(match.groups).filter(([, val]) => !!val)[0];
      switch (group) {
        case "alnum":
          /[a-zA-Z]+/giu;
          break;
        case "digit":
          /\d+/giu;
          break;
        case "latin":
          /[\p{Script=Latin}]+/giu;
          break;
        case "letter":
          /[\p{L}\p{M}\p{N}]+/giu;
          break;
        case "punct":
          /[!-\/:-@[-`{-~]+/giu;
          break;
        case "unicode":
          /[\0-\uffff]+/giu;
          break;
        case "astral":
          /[\u{10000}-\u{10ffff}]+/giu;
          break;
        case "space":
          / +/giu;
          break;
      }
    }).join`+`;
  }

  expression = "[" + text.split` `.map(encodeText) + "]";

  expression += ";" + `_${globalVar}=${expression}`;

  // Export
  expression += ";" + "module.exports.result=_" + globalVar;

  console.log("Script complete!");

  let enUS = new Intl.NumberFormat("en-us");

  return {
    result: expression,
    stats: ``,
  };
}

console.log(encode(text));
