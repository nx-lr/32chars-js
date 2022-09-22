"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _voca = _interopRequireDefault(require("voca"));

var _lodash = _interopRequireDefault(require("lodash"));

var _fs = _interopRequireDefault(require("fs"));

var _isValidIdentifier = _interopRequireDefault(require("is-valid-identifier"));

var _jsesc = _interopRequireDefault(require("jsesc"));

var _xregexp = _interopRequireDefault(require("xregexp"));

var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var print = console.log;

var text = _fs["default"].readFileSync("./input.txt", "utf8");
/**
 * VoidScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 * - Execution, where the constructed code is evaluated and executed.
 */


function encodeText(TEXT, GLOBAL_VAR) {
  var _TEXT$match, _ref25, _ref26;

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$STRICT_MODE = _ref.STRICT_MODE,
      STRICT_MODE = _ref$STRICT_MODE === void 0 ? false : _ref$STRICT_MODE,
      _ref$QUOTE_STYLE = _ref.QUOTE_STYLE,
      QUOTE_STYLE = _ref$QUOTE_STYLE === void 0 ? "" : _ref$QUOTE_STYLE;

  var BUILTINS = RegExp("^\\b(" + ["module", "exports", "Infinity", "NaN", "undefined", "globalThis", "this", "eval", "isFinite", "isNaN", "parseFloat", "parseInt", "encodeURI", "encodeURIComponent", "decodeURI", "decodeURIComponent", "escape", "unescape", "Object", "Function", "Boolean", "Symbol", "Number", "BigInt", "Math", "Date", "String", "RegExp", "Array", "Int8Array", "Uint8Array", "Uint8ClampedArray", "Int16Array", "Uint16Array", "Int32Array", "Uint32Array", "Float32Array", "Float64Array", "BigInt64Array", "BigUint64Array", "Map", "Set", "WeakMap", "WeakSet", "ArrayBuffer", "SharedArrayBuffer", "Atomics", "DataView", "JSON", "Promise", "Generator", "GeneratorFunction", "AsyncFunction", "AsyncGenerator", "AsyncGeneratorFunction", "Reflect", "Proxy", "Intl", "WebAssembly"].sort().join(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["|"]))) + ")\\b$");
  var REGEXPS = {
    constant: /\b(true|false|Infinity|NaN|undefined)\b/g,
    constructor: /\b(Array|Object|String|Number|Boolean|RegExp|Function)\b/g,
    word: (0, _xregexp["default"])(String.raw(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["\b([GHJ-MPQTV-Z]|[pLpN]{2,})\b"], ["\\b([GHJ-MPQTV-Z]|[\\pL\\pN]{2,})\\b"]))), "g"),
    letter: /\b[\da-zA-FINORSU]\b/g,
    symbol: /[!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~]+/g,
    unicode: /[^!"#$%&'()*+,\-./:;<=>?@\[\\\]^_`{|}~ ]+/g
  };
  /**
   * This regular expression splits the text into runs.
   * The literal space is ignored since it is the most used
   * character in plain text.
   */

  var REGEXP = Object.entries(REGEXPS).map(function (_ref2) {
    var _ref3 = (0, _slicedToArray2["default"])(_ref2, 2),
        key = _ref3[0],
        source = _ref3[1].source;

    return "(?<".concat(key, ">").concat(source, ")");
  }).join(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])(["|"])));
  REGEXP = RegExp(REGEXP, "g"); // Test whether an identifier can be made into a variable

  var checkIdentifier = function checkIdentifier(ident) {
    return (ident = ident.trim()) && (0, _isValidIdentifier["default"])(ident) && !BUILTINS.test(ident);
  };

  if (!checkIdentifier(GLOBAL_VAR)) throw new Error("Invalid global variable: ".concat(quote(GLOBAL_VAR))); // Reject strings above the length of 2^29 to avoid going over the max string limit

  var MAX_STRING_LENGTH = 536870888,
      enUS = Intl.NumberFormat("en-us");
  if (TEXT.length > MAX_STRING_LENGTH) throw new Error("Input string can only be up to ".concat(enUS.format(NODE_MAX_LENGTH), " characters long"));
  /**
   * Encase a string in literal quotes; finding the shortest
   * ASCII stringified representation of the original string.
   *
   * @example
   * print(quote`"'"`)
   * print(quote`\xff"\xad\n`)
   * print(quote`'json`)
   */

  var count = 0;

  var quote = function quote(string) {
    var _string$match, _string$match2, singleOrDouble, single, _double, backtick, choice;

    return single = ((_string$match = string.match(/'/g)) === null || _string$match === void 0 ? void 0 : _string$match.length) || 0, _double = ((_string$match2 = string.match(/"/g)) === null || _string$match2 === void 0 ? void 0 : _string$match2.length) || 0, backtick = !/\$\{|`/.test(string) && /['"]/.test(string), choice = (singleOrDouble = /\b(single|double)\b/i.test(QUOTE_STYLE), singleOrDouble && /\bbonly\b/i.test(QUOTE_STYLE) ? QUOTE_STYLE.match(/\b(single|double)\b/i)[0].toLowerCase() : /\bcycle\b/i.test(QUOTE_STYLE) ? /\bsingle\b/i.test(QUOTE_STYLE) ? ["single", "double"][count++ % 2] : ["double", "single"][count++ % 2] : singleOrDouble ? single < _double ? "single" : single > _double ? "double" : QUOTE_STYLE.toLowerCase().trim() : Math.random() > 0.5 ? "double" : "single"), (0, _jsesc["default"])(string, {
      quotes: choice,
      wrap: true
    });
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


  var LETTERS = "abcdefghijklmnopqrstuvwxyz";
  var CIPHER = ";.!:_-,?/'*+#%&^\"|~$=<>`@\\";
  var SPACE = "-";

  var encodeLetter = function encodeLetter(_char) {
    var _ref4;

    return (_voca["default"].isUpperCase(_char) ? "$" : "_") + (_ref4 = _char.toLowerCase(), CIPHER[LETTERS.indexOf(_ref4)]);
  };

  var encodeDigit = function encodeDigit(number) {
    return (0, _toConsumableArray2["default"])((+number).toString(2).padStart(3, 0)).map(function (match) {
      return match == 1 ? "$" : "_";
    }).join(_templateObject4 || (_templateObject4 = (0, _taggedTemplateLiteral2["default"])([""])));
  };
  /**
   * @example
   * print(encodeDigit(314))
   * print(encodeLetter('x'))
   */


  var CONSTANTS = {
    "true": "!".concat(quote("")),
    // ''==false
    "false": "![]",
    // []==true
    undefined: "[][[]]",
    // [][[]] doesn't exist
    Infinity: "!".concat(quote(""), "/![]"),
    // true/false==1/0
    NaN: "+{}",
    // It makes sense
    "[object Object]": "{}" // y e s

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

  var RESULT = "".concat(STRICT_MODE ? "var _".concat(GLOBAL_VAR, ",") : "").concat(GLOBAL_VAR, "=~[];"); // STEP 1

  var CHARSET_1 = {};

  for (var _i = 0, _Object$entries = Object.entries(CONSTANTS); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2),
        constant = _Object$entries$_i[0],
        expression = _Object$entries$_i[1];

    var _iterator = _createForOfIteratorHelper(constant),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _char2 = _step.value;
        if (/[\w\s]/.test(_char2) && !(_char2 in CHARSET_1)) CHARSET_1[_char2] = [expression, constant.indexOf(_char2)];
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  var RES_CHARSET_1 = (GLOBAL_VAR + "={" + _lodash["default"].range(0, 10).map(function (digit) {
    return ["".concat(encodeDigit(digit), ":`${++").concat(GLOBAL_VAR, "}`"), Object.entries(CHARSET_1).filter(function (_ref5) {
      var _ref6 = (0, _slicedToArray2["default"])(_ref5, 2),
          _ref6$ = (0, _slicedToArray2["default"])(_ref6[1], 2),
          val = _ref6$[1];

      return val == digit;
    }).map(function (_ref7) {
      var _ref8 = (0, _slicedToArray2["default"])(_ref7, 2),
          _char3 = _ref8[0],
          _ref8$ = (0, _slicedToArray2["default"])(_ref8[1], 1),
          lit = _ref8$[0];

      var key = quote(encodeLetter(_char3));
      return "".concat(key, ":`${").concat(lit, "}`[").concat(GLOBAL_VAR, "]");
    })];
  }).flat().join(_templateObject5 || (_templateObject5 = (0, _taggedTemplateLiteral2["default"])([","]))).replace(/,$/, "").replace(/,+/g, ",") + "}").replace("_undefined", SPACE); // Replace space

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

  var IDENT_SET1 = {
    concat: "+",
    call: "!",
    join: "%",
    slice: "/",
    "return": "_",
    constructor: "$"
  }; // And these are what we would achieve from there:

  var CONSTRUCTORS = {
    Array: "[]",
    Object: "{}",
    String: quote(""),
    Number: "(~[])",
    Boolean: "(![])",
    RegExp: "/./",
    Function: "(()=>{})"
  };

  var CHARSET_2 = _objectSpread({}, CHARSET_1);

  for (var _i2 = 0, _Object$entries2 = Object.entries(CONSTRUCTORS); _i2 < _Object$entries2.length; _i2++) {
    var _Object$entries2$_i = (0, _slicedToArray2["default"])(_Object$entries2[_i2], 2),
        key = _Object$entries2$_i[0],
        _expression = _Object$entries2$_i[1];

    var index = void 0;

    var _constructor = eval(key).toString();

    var _iterator2 = _createForOfIteratorHelper(_constructor),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _char4 = _step2.value;
        if (/[\w\s]/.test(_char4) && !(_char4 in CHARSET_2)) CHARSET_2[_char4] = [_expression, index = _constructor.indexOf(_char4)];
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }

  for (var _i3 = 0, _Object$entries3 = Object.entries(CHARSET_2); _i3 < _Object$entries3.length; _i3++) {
    var value = _Object$entries3[_i3];

    var _value = (0, _slicedToArray2["default"])(value, 2),
        _char5 = _value[0],
        _value$ = (0, _slicedToArray2["default"])(_value[1], 2),
        _expression2 = _value$[0],
        _index = _value$[1];

    var expansion = "`${".concat(_expression2, "[").concat(GLOBAL_VAR, ".$]}`[").concat("".concat(_index).split(_templateObject7 || (_templateObject7 = (0, _taggedTemplateLiteral2["default"])([""]))).map(function (digit) {
      return "".concat(GLOBAL_VAR, ".").concat(encodeDigit(digit));
    }).join(_templateObject6 || (_templateObject6 = (0, _taggedTemplateLiteral2["default"])(["+"]))), "]");
    if (!(_char5 in CHARSET_1)) CHARSET_2[_char5] = [_expression2, _index, expansion];
  }

  var objectDifference = function objectDifference(x, y) {
    return Object.fromEntries(_lodash["default"].difference(_lodash["default"].keys(x), _lodash["default"].keys(y)).map(function (z) {
      return [z, x[z]];
    }));
  };

  var CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1);
  var RES_CHARSET_2 = "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + Object.entries(CHARSET_2_DIFF).map(function (_ref9) {
    var _ref10 = (0, _slicedToArray2["default"])(_ref9, 2),
        letter = _ref10[0],
        _ref10$ = (0, _slicedToArray2["default"])(_ref10[1], 3),
        expansion = _ref10$[2];

    return "".concat(quote(encodeLetter(letter)), ":").concat(expansion);
  }) + "}";
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

  var encodeString = function encodeString() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return (0, _toConsumableArray2["default"])("".concat(str).replace(/\W/g, "")).map(function (_char6) {
      if (/[$_]/.test(_char6)) {
        return quote(_char6);
      } else if (/\d/.test(_char6)) {
        return "".concat(GLOBAL_VAR, ".").concat(encodeDigit(_char6));
      } else {
        var encoded = encodeLetter(_char6);
        return (0, _isValidIdentifier["default"])(encoded) ? "".concat(GLOBAL_VAR, ".").concat(encoded) : "".concat(GLOBAL_VAR, "[").concat(quote(encoded), "]");
      }
    }).join(_templateObject8 || (_templateObject8 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  };

  var encodeIdentifiers = function encodeIdentifiers(identifiers) {
    return "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + Object.entries(identifiers).map(function (_ref11) {
      var _ref12 = (0, _slicedToArray2["default"])(_ref11, 2),
          ident = _ref12[0],
          key = _ref12[1];

      return [key, encodeString(ident)];
    }).map(function (_ref13) {
      var _ref14 = (0, _slicedToArray2["default"])(_ref13, 2),
          key = _ref14[0],
          expr = _ref14[1];

      return "".concat((0, _isValidIdentifier["default"])(key) ? key : quote(key), ":").concat(expr);
    }) + "}";
  };

  RESULT += ";" + encodeIdentifiers(IDENT_SET1);
  RESULT += ";" + RES_CHARSET_2;
  var IDENT_SET2 = {
    name: "?",
    map: "^",
    replace: ":",
    repeat: "*",
    split: "|",
    indexOf: "#",
    source: "`"
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

  var GLOBAL_FUNC = {
    eval: "=",
    escape: ">",
    unescape: "<",
    parseInt: "~"
  };
  var RES_FUNCTIONS_1 = "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + Object.entries(GLOBAL_FUNC).map(function (_ref15) {
    var _ref16 = (0, _slicedToArray2["default"])(_ref15, 2),
        ident = _ref16[0],
        shortcut = _ref16[1];

    return "".concat(quote(shortcut), ":") + "(()=>{})" + "[".concat(GLOBAL_VAR, ".$]") + "(" + "".concat(GLOBAL_VAR, "._+").concat(GLOBAL_VAR, "[").concat(quote("-"), "]+").concat(encodeString(ident)) + ")" + "()";
  }) + "}";
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
   */

  RESULT += ";" + "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + [[quote("'"), // toString
  "".concat(encodeString("to"), "+") + "".concat(quote(""), "[").concat(GLOBAL_VAR, ".$]") + "[".concat(GLOBAL_VAR, "[").concat(quote("?"), "]]")], [quote(encodeLetter("C")), // C
  "".concat(GLOBAL_VAR, "[").concat(quote(">"), "]") + "(".concat(quote("<"), ")") + "[".concat(GLOBAL_VAR, ".").concat(encodeDigit(2), "]")], [quote(encodeLetter("D")), // D
  "".concat(GLOBAL_VAR, "[").concat(quote(">"), "]") + "(".concat(quote("="), ")") + "[".concat(GLOBAL_VAR, ".").concat(encodeDigit(2), "]")]].map(function (x) {
    return x.join(_templateObject9 || (_templateObject9 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
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

  var CIPHER_FROM = "0123456789abcdefghijklmnopqrstuvwxyz";
  RESULT += ";" + "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + [[quote(encodeLetter("U")), // C
  "`${{}[".concat(GLOBAL_VAR, "[").concat(quote("'"), "]]") + "[".concat(GLOBAL_VAR, "[").concat(quote("!"), "]]()}`") + "[".concat(GLOBAL_VAR, ".").concat(encodeDigit(8), "]")]].concat((0, _toConsumableArray2["default"])((0, _toConsumableArray2["default"])("hkqwz").map(function (letter) {
    return [quote(encodeLetter(letter)), "(+(".concat(encodeString(CIPHER_FROM.indexOf(letter)), "))") + "[".concat(GLOBAL_VAR, "[").concat(quote("'"), "]](").concat(encodeString(36), ")")];
  }))).map(function (x) {
    return x.join(_templateObject10 || (_templateObject10 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
  var IDENT_SET3 = {
    fromCharCode: "@",
    keys: "&",
    toUpperCase: '"'
  };
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

  var CIPHER_TO = "_.:;!?*+^-=<>~'\"/|#$%&@{}()[]`\\";

  var IDENT_SET = _objectSpread(_objectSpread(_objectSpread({}, IDENT_SET1), IDENT_SET2), IDENT_SET3);
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


  var base31 = function base31(s) {
    return "".concat((0, _toConsumableArray2["default"])(Array(s.length)).map(function (x, i) {
      return (0, _toConsumableArray2["default"])(s.charCodeAt(i).toString(31)).map(function (c) {
        return CIPHER_TO[CIPHER_FROM.indexOf(c)];
      }).join(_templateObject11 || (_templateObject11 = (0, _taggedTemplateLiteral2["default"])([""])));
    }));
  };

  var base31Decode = function base31Decode(b) {
    return String.fromCharCode.apply(String, (0, _toConsumableArray2["default"])(b.split(_templateObject12 || (_templateObject12 = (0, _taggedTemplateLiteral2["default"])([","]))).map(function (s) {
      return parseInt((0, _toConsumableArray2["default"])(s).map(function (c) {
        return CIPHER_FROM[CIPHER_TO.indexOf(c)];
      }).join(_templateObject13 || (_templateObject13 = (0, _taggedTemplateLiteral2["default"])([""]))), 31);
    })));
  };
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


  var ENCODING_MACRO = "a=>a.split`,`.map(a=>parseInt([...a].map\
(a=>[...Array(+(31)).keys()].map(a=>a.toString(31))\
[CIPHER_TO.indexOf(a)]).join``,31))\
.map(a=>String.fromCharCode(a)).join``".replace("CIPHER_TO", quote(CIPHER_TO)).replace(/\.toString\b/g, function (ident) {
    return "[".concat(GLOBAL_VAR, "[").concat(quote("'"), "]]");
  }).replace("Array", "[][".concat(GLOBAL_VAR, ".$]")).replace("String", "".concat(quote(""), "[").concat(GLOBAL_VAR, ".$]")).replace(/\b\d+\b/g, function (match) {
    return encodeString(match);
  }).replace("parseInt", "".concat(GLOBAL_VAR, "[").concat(quote("~"), "]")).replace(/\ba\b/g, "_" + GLOBAL_VAR).replace(/\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g, function (p1) {
    return "[".concat(GLOBAL_VAR, "[").concat(quote(IDENT_SET[p1.slice(1)]), "]]");
  });
  RESULT += ";" + "".concat(GLOBAL_VAR, "[+![]]=").concat(ENCODING_MACRO);
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

  var RE_CONSTANTS = ["true", "false", "Infinity", "NaN", "undefined", Object.keys(IDENT_SET)].flat();
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

  var keyGen = /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var digitsTo, digitsFrom, _iterator3, _step3, _key, i;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            digitsTo = ".,:;!?*+^-=<>~'\"`/|\\#%&@()[]{}", digitsFrom = "0123456789abcdefghijklmnopqrstuvwxyz"; // yield brackets first since we didn't use them as keys yet

            _iterator3 = _createForOfIteratorHelper("()[]{}");
            _context.prev = 2;

            _iterator3.s();

          case 4:
            if ((_step3 = _iterator3.n()).done) {
              _context.next = 10;
              break;
            }

            _key = _step3.value;
            _context.next = 8;
            return _key;

          case 8:
            _context.next = 4;
            break;

          case 10:
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](2);

            _iterator3.e(_context.t0);

          case 15:
            _context.prev = 15;

            _iterator3.f();

            return _context.finish(15);

          case 18:
            i = 0;

          case 19:
            if (!(i <= Number.MAX_SAFE_INTEGER)) {
              _context.next = 25;
              break;
            }

            _context.next = 22;
            return i.toString(digitsTo.length).padStart(2, 0).split(_templateObject14 || (_templateObject14 = (0, _taggedTemplateLiteral2["default"])([""]))).map(function (a) {
              return digitsTo[digitsFrom.indexOf(a)];
            }).join(_templateObject15 || (_templateObject15 = (0, _taggedTemplateLiteral2["default"])([""])));

          case 22:
            i++;
            _context.next = 19;
            break;

          case 25:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2, 12, 15, 18]]);
  })();

  var WORD_LIST = (_ref26 = (_TEXT$match = TEXT.match(REGEXPS.word)) !== null && _TEXT$match !== void 0 ? _TEXT$match : [], (_ref25 = Object.entries(_lodash["default"].countBy(_ref26)).filter(function (_ref17) {
    var _ref18 = (0, _slicedToArray2["default"])(_ref17, 1),
        a = _ref18[0];

    return !Object.keys(IDENT_SET).includes(a);
  }).sort(function (_ref19, _ref20) {
    var _ref21 = (0, _slicedToArray2["default"])(_ref19, 2),
        a = _ref21[1];

    var _ref22 = (0, _slicedToArray2["default"])(_ref20, 2),
        b = _ref22[1];

    return b - a;
  }).map(function (_ref23) {
    var _ref24 = (0, _slicedToArray2["default"])(_ref23, 1),
        word = _ref24[0];

    return [word, keyGen.next().value];
  }), Object.fromEntries(_ref25)));
  RESULT += ";" + "".concat(GLOBAL_VAR, "={...").concat(GLOBAL_VAR, ",") + Object.entries(WORD_LIST).map(function (_ref27) {
    var _ref28 = (0, _slicedToArray2["default"])(_ref27, 2),
        word = _ref28[0],
        key = _ref28[1];

    return "".concat(quote(key), ":").concat(GLOBAL_VAR, "[+![]](").concat(quote(base31(word)), ")");
  }) + "}";
  /**
   * PART 5: SUBSTITUTION
   *
   * We would first split up the text into spaces so we can join
   * the result into a string later on. Spaces are represented
   * with empty arrays.
   */

  var EXPRESSION = "[".concat(TEXT.split(_templateObject16 || (_templateObject16 = (0, _taggedTemplateLiteral2["default"])([" "]))).map(function (substring) {
    return (0, _toConsumableArray2["default"])(substring.matchAll(REGEXP)).map(function (match) {
      var _Object$entries$filte = (0, _slicedToArray2["default"])(Object.entries(match.groups).filter(function (_ref29) {
        var _ref30 = (0, _slicedToArray2["default"])(_ref29, 2),
            val = _ref30[1];

        return val != null;
      })[0], 2),
          group = _Object$entries$filte[0],
          substring = _Object$entries$filte[1];

      switch (group) {
        case "constant":
          return "`${".concat(CONSTANTS[substring], "}`");

        case "constructor":
          return "".concat(CONSTRUCTORS[substring], "[").concat(GLOBAL_VAR, ".$][").concat(GLOBAL_VAR, "[").concat(quote("?"), "]]");

        case "letter":
          return encodeString(substring);

        case "word":
          var _key2 = WORD_LIST[substring];
          if (typeof IDENT_SET[substring] == "string") _key2 = IDENT_SET[substring];
          return "".concat(GLOBAL_VAR, "[").concat(quote(_key2), "]");

        case "unicode":
          var encoded = base31(substring);
          return "".concat(GLOBAL_VAR, "[+![]](").concat(quote(encoded), ")");

        default:
          return quote(substring);
      }
    }).join(_templateObject17 || (_templateObject17 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  }), "][").concat(GLOBAL_VAR, "[").concat(quote("%"), "]](").concat(GLOBAL_VAR, "[").concat(quote("-"), "])");
  RESULT += ";" + "_".concat(GLOBAL_VAR, "=").concat(EXPRESSION); // Export

  RESULT += ";" + "module" + "[".concat(quote("exports"), "]") + "[".concat(quote("result"), "]=_") + GLOBAL_VAR;
  return {
    result: RESULT,
    stats: "=====\nSTATS\n=====\nInput length: ".concat(enUS.format(TEXT.length), "\nExpression length: ").concat(enUS.format(EXPRESSION.length), "\nRatio: ").concat(EXPRESSION.length / TEXT.length, "\nOutput length: ").concat(enUS.format(RESULT.length))
  };
}

var _encodeText = encodeText(text, "_", {
  STRICT_MODE: true,
  QUOTE_STYLE: "single"
}),
    result = _encodeText.result,
    stats = _encodeText.stats;

print(stats);

_fs["default"].writeFileSync("./output.js", result);