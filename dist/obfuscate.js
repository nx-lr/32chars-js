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

var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var print = console.log;

var text = _fs["default"].readFileSync("./input.txt", "utf8");
/**
 * PunkScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 */


function encodeText(code, globalVar) {
  var _code$match, _ref36, _ref37;

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$strictMode = _ref.strictMode,
      strictMode = _ref$strictMode === void 0 ? false : _ref$strictMode,
      _ref$quoteStyle = _ref.quoteStyle,
      quoteStyle = _ref$quoteStyle === void 0 ? "" : _ref$quoteStyle,
      _ref$accessor = _ref.accessor,
      accessor = _ref$accessor === void 0 ? false : _ref$accessor;

  var BUILTINS = RegExp("^\\b(" + ["Array", "ArrayBuffer", "AsyncFunction", "AsyncGenerator", "AsyncGeneratorFunction", "Atomics", "BigInt", "BigInt64Array", "BigUint64Array", "Boolean", "DataView", "Date", "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent", "escape", "eval", "exports", "Float32Array", "Float64Array", "Function", "Generator", "GeneratorFunction", "globalThis", "Infinity", "Int16Array", "Int32Array", "Int8Array", "Intl", "isFinite", "isNaN", "JSON", "Map", "Math", "module", "NaN", "Number", "Object", "parseFloat", "parseInt", "Promise", "Proxy", "Reflect", "RegExp", "Set", "SharedArrayBuffer", "String", "Symbol", "this", "Uint16Array", "Uint32Array", "Uint8Array", "Uint8ClampedArray", "undefined", "unescape", "WeakMap", "WeakSet", "WebAssembly"].join(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["|"]))) + ")\\b$");
  var REGEXPS = {
    word: (0, _xregexp["default"])(String.raw(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["[pLpN]+"], ["[\\pL\\pN]+"]))), "g"),
    symbol: /[!-\/:-@[-`{-~]+/g,
    unicode: /[^ -~]+/g
  };
  /**
   * This regular expression splits the text into runs.
   * The literal space is ignored since it is the most used
   * character in plain text.
   */

  var REGEXP = RegExp(Object.entries(REGEXPS).map(function (_ref2) {
    var _ref3 = (0, _slicedToArray2["default"])(_ref2, 2),
        key = _ref3[0],
        source = _ref3[1].source;

    return "(?<".concat(key, ">").concat(source, ")");
  }).join(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])(["|"]))), "g"); // Test whether an identifier can be made into a variable

  var checkIdentifier = function checkIdentifier(ident) {
    return (ident = ident.trim()) && (0, _isValidIdentifier["default"])(ident) && !BUILTINS.test(ident);
  };

  if (!checkIdentifier(globalVar)) throw new Error("Invalid global variable: ".concat(quote(globalVar))); // Reject strings above the length of 2^29 to avoid going over the max string limit

  var MAX_STRING_LENGTH = 536870888,
      enUS = Intl.NumberFormat("en-us");
  if (code.length > MAX_STRING_LENGTH) throw new Error("Input string can only be up to ".concat(enUS.format(NODE_MAX_LENGTH), " characters long"));
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
    var quotes = quoteStyle.match(/\b(single|double|backtick)\b/g) || ["single"],
        mode = (quoteStyle.match(/\b(cycle|only|smart|random)\b/g) || ["smart"])[0];

    var single = (0, _jsesc["default"])(string, {
      quotes: "single",
      wrap: true
    }),
        _double = (0, _jsesc["default"])(string, {
      quotes: "double",
      wrap: true
    }),
        backtick = (0, _jsesc["default"])(string, {
      quotes: "backtick",
      wrap: true
    });

    switch (mode) {
      case "only":
        {
          var current = quotes[0];
          return (0, _jsesc["default"])(string, {
            quotes: current,
            wrap: true
          });
        }

      case "cycle":
        {
          var _current = quotes[count++ % quotes.length];
          return (0, _jsesc["default"])(string, {
            quotes: _current,
            wrap: true
          });
        }

      case "random":
        {
          var _current2 = Math.random() > 2 / 3 ? "backtick" : Math.random() > 1 / 3 ? "double" : "single";

          return (0, _jsesc["default"])(string, {
            quotes: _current2,
            wrap: true
          });
        }

      case "smart":
        {
          var choice = [["single", single], ["double", _double], ["backtick", backtick]].map(function (_ref4) {
            var _ref5 = (0, _slicedToArray2["default"])(_ref4, 2),
                a = _ref5[0],
                b = _ref5[1];

            return [a, b.length];
          }).sort(function (_ref6, _ref7) {
            var _ref8 = (0, _slicedToArray2["default"])(_ref6, 2),
                a = _ref8[1];

            var _ref9 = (0, _slicedToArray2["default"])(_ref7, 2),
                b = _ref9[1];

            return a - b;
          });

          var _current3 = choice.every(function (v) {
            return v[1] == choice[0][1];
          }) ? quotes[0] : choice[0][0];

          return (0, _jsesc["default"])(string, {
            quotes: _current3,
            wrap: true
          });
        }
    }
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


  var LETTERS = "abcdefghijklmnopqrstuvwxyz";
  var CIPHER = ";.!:_-,?/'*+#%&^\"|~$=<>`@\\";
  var SPACE = "-";

  var encodeLetter = function encodeLetter(_char) {
    return (_voca["default"].isUpperCase(_char) ? "$" : "_") + CIPHER[LETTERS.indexOf(_char.toLowerCase())];
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
    "[object Object]": "{}" // [object objectLiteral]

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

  var quoteKey = function quoteKey(string) {
    var quotes = quoteStyle.match(/\b(single|double|backtick)\b/g) || ["single"],
        mode = (quoteStyle.match(/\b(cycle|only|smart|random)\b/g) || ["smart"])[0];

    var single = (0, _jsesc["default"])(string, {
      quotes: "single",
      wrap: true
    }),
        _double2 = (0, _jsesc["default"])(string, {
      quotes: "double",
      wrap: true
    }),
        backtick = (0, _jsesc["default"])(string, {
      quotes: "backtick",
      wrap: true
    });

    switch (mode) {
      case "only":
        {
          var current = quotes[0];
          if (current == "backtick") return "[".concat(backtick, "]");else return (0, _jsesc["default"])(string, {
            quotes: current,
            wrap: true
          });
        }

      case "cycle":
        {
          var _current4 = quotes[count++ % quotes.length];
          if (_current4 == "backtick") return "[".concat(backtick, "]");else return (0, _jsesc["default"])(string, {
            quotes: _current4,
            wrap: true
          });
        }

      case "random":
        {
          var _current5 = Math.random() > 2 / 3 ? "backtick" : Math.random() > 1 / 3 ? "double" : "single";

          if (_current5 == "backtick") return "[".concat(backtick, "]");else return (0, _jsesc["default"])(string, {
            quotes: _current5,
            wrap: true
          });
        }

      case "smart":
        {
          if ((0, _isValidIdentifier["default"])(string)) return string;else {
            var choice = [["single", single], ["double", _double2]].map(function (_ref10) {
              var _ref11 = (0, _slicedToArray2["default"])(_ref10, 2),
                  a = _ref11[0],
                  b = _ref11[1];

              return [a, b.length];
            }).sort(function (_ref12, _ref13) {
              var _ref14 = (0, _slicedToArray2["default"])(_ref12, 2),
                  a = _ref14[1];

              var _ref15 = (0, _slicedToArray2["default"])(_ref13, 2),
                  b = _ref15[1];

              return a - b;
            })[0];

            var _current6 = choice.every(function (v) {
              return v[1] == choice[0][1];
            }) ? quotes[0] : choice[0][0];

            return (0, _jsesc["default"])(string, {
              quotes: _current6,
              wrap: true
            });
          }
        }
    }
  }; // The separator is a semicolon, not a comma.


  var output = "".concat(strictMode ? "var ".concat(globalVar, ",_").concat(globalVar).concat(accessor ? ",$".concat(globalVar) : "", ";") : "").concat(globalVar, "=~[];");
  if (accessor) output += "$".concat(globalVar, "=([_").concat(globalVar, "])=>").concat(globalVar, "[_").concat(globalVar, "];"); // STEP 1

  var CHARSET_1 = {};

  for (var _i = 0, _Object$entries = Object.entries(CONSTANTS); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2),
        constant = _Object$entries$_i[0],
        _expression = _Object$entries$_i[1];

    var _iterator = _createForOfIteratorHelper(constant),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _char2 = _step.value;
        if (/[\w\s]/.test(_char2) && !(_char2 in CHARSET_1)) CHARSET_1[_char2] = [_expression, constant.indexOf(_char2)];
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  var RES_CHARSET_1 = "".concat(globalVar, "={") + (0, _toConsumableArray2["default"])(Array(10)).map(function ($, digit) {
    return ["".concat(encodeDigit(digit), ":`${++").concat(globalVar, "}`")].concat((0, _toConsumableArray2["default"])(Object.entries(CHARSET_1).filter(function (_ref16) {
      var _ref17 = (0, _slicedToArray2["default"])(_ref16, 2),
          _ref17$ = (0, _slicedToArray2["default"])(_ref17[1], 2),
          value = _ref17$[1];

      return value == digit;
    }).map(function (_ref18) {
      var _ref19 = (0, _slicedToArray2["default"])(_ref18, 2),
          _char3 = _ref19[0],
          _ref19$ = (0, _slicedToArray2["default"])(_ref19[1], 1),
          literal = _ref19$[0];

      return "".concat(quoteKey(_char3 == " " ? "-" : encodeLetter(_char3)), ":`${").concat(literal, "}`[").concat(globalVar, "]");
    })));
  }) + "}";
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

  var IDENT_SET1 = {
    concat: "+",
    call: "!",
    join: "%",
    slice: "/",
    "return": "_",
    constructor: "$",
    source: ","
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
        _expression2 = _Object$entries2$_i[1];

    var index = void 0;

    var _constructor = eval(key).toString();

    var _iterator2 = _createForOfIteratorHelper(_constructor),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var _char4 = _step2.value;
        if (/[\w\s]/.test(_char4) && !(_char4 in CHARSET_2)) CHARSET_2[_char4] = [_expression2, index = _constructor.indexOf(_char4)];
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
        _expression3 = _value$[0],
        _index = _value$[1];

    var expansion = "`${".concat(_expression3, "[").concat(globalVar, ".$]}`[").concat("".concat(_index).split(_templateObject6 || (_templateObject6 = (0, _taggedTemplateLiteral2["default"])([""]))).map(function (digit) {
      return "".concat(globalVar, ".").concat(encodeDigit(digit));
    }).join(_templateObject5 || (_templateObject5 = (0, _taggedTemplateLiteral2["default"])(["+"]))), "]");
    if (!(_char5 in CHARSET_1)) CHARSET_2[_char5] = [_expression3, _index, expansion];
  }

  var objectDifference = function objectDifference(x, y) {
    return Object.fromEntries(_lodash["default"].difference(_lodash["default"].keys(x), _lodash["default"].keys(y)).map(function (z) {
      return [z, x[z]];
    }));
  };

  var CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1);
  var RES_CHARSET_2 = "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(CHARSET_2_DIFF).map(function (_ref20) {
    var _ref21 = (0, _slicedToArray2["default"])(_ref20, 2),
        letter = _ref21[0],
        _ref21$ = (0, _slicedToArray2["default"])(_ref21[1], 3),
        expansion = _ref21$[2];

    return "".concat(quoteKey(encodeLetter(letter)), ":").concat(expansion);
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
        return "".concat(globalVar, ".").concat(encodeDigit(_char6));
      } else {
        var encoded = encodeLetter(_char6);
        return (0, _isValidIdentifier["default"])(encoded) ? "".concat(globalVar, ".").concat(encoded) : "".concat(globalVar, "[").concat(quote(encoded), "]");
      }
    }).join(_templateObject7 || (_templateObject7 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  };

  var encodeIdentifiers = function encodeIdentifiers(identifiers) {
    return "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(identifiers).map(function (_ref22) {
      var _ref23 = (0, _slicedToArray2["default"])(_ref22, 2),
          ident = _ref23[0],
          key = _ref23[1];

      return [key, encodeString(ident)];
    }).map(function (_ref24) {
      var _ref25 = (0, _slicedToArray2["default"])(_ref24, 2),
          key = _ref25[0],
          expr = _ref25[1];

      return "".concat(quoteKey(key), ":").concat(expr);
    }) + "}";
  };

  output += ";" + encodeIdentifiers(IDENT_SET1);
  output += ";" + RES_CHARSET_2;
  var IDENT_SET2 = {
    name: "?",
    map: "^",
    replace: ":",
    repeat: "*",
    split: "|",
    indexOf: "#",
    source: "`"
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

  var GLOBAL_FUNC = {
    eval: "=",
    escape: ">",
    unescape: "<",
    parseInt: "~",
    parseFloat: "."
  };
  var RES_FUNCTIONS_1 = "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(GLOBAL_FUNC).map(function (_ref26) {
    var _ref27 = (0, _slicedToArray2["default"])(_ref26, 2),
        ident = _ref27[0],
        shortcut = _ref27[1];

    return "".concat(quoteKey(shortcut), ":") + "(()=>{})" + "[".concat(globalVar, ".$]") + "(" + "".concat(globalVar, "._+").concat(globalVar, "[").concat(quote("-"), "]+").concat(encodeString(ident)) + ")" + "()";
  }) + "}";
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

  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",") + [[quoteKey("'"), // toString
  "".concat(encodeString("to"), "+") + "".concat(quote(""), "[").concat(globalVar, ".$]") + "[".concat(globalVar, "[").concat(quote("?"), "]]")], [quoteKey(encodeLetter("C")), // C
  "".concat(globalVar, "[").concat(quote(">"), "]") + "(".concat(quote("<"), ")") + "[".concat(globalVar, ".").concat(encodeDigit(2), "]")], [quoteKey(encodeLetter("D")), // D
  "".concat(globalVar, "[").concat(quote(">"), "]") + "(".concat(quote("="), ")") + "[".concat(globalVar, ".").concat(encodeDigit(2), "]")]].map(function (x) {
    return x.join(_templateObject8 || (_templateObject8 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
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

  var CIPHER_FROM = "0123456789abcdefghijklmnopqrstuvwxyz";
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",") + [[quoteKey(encodeLetter("U")), // C
  "`${{}[".concat(globalVar, "[").concat(quote("'"), "]]") + "[".concat(globalVar, "[").concat(quote("!"), "]]()}`") + "[".concat(globalVar, ".").concat(encodeDigit(8), "]")]].concat((0, _toConsumableArray2["default"])((0, _toConsumableArray2["default"])("hkqwz").map(function (letter) {
    return [quoteKey(encodeLetter(letter)), "(+(".concat(encodeString(CIPHER_FROM.indexOf(letter)), "))") + "[".concat(globalVar, "[").concat(quote("'"), "]](").concat(encodeString(36), ")")];
  }))).map(function (x) {
    return x.join(_templateObject9 || (_templateObject9 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
  var IDENT_SET3 = {
    fromCharCode: "@",
    keys: "&",
    toUpperCase: '"'
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
      }).join(_templateObject10 || (_templateObject10 = (0, _taggedTemplateLiteral2["default"])([""])));
    }));
  };

  var base31Decode = function base31Decode(b) {
    return String.fromCharCode.apply(String, (0, _toConsumableArray2["default"])(b.split(_templateObject11 || (_templateObject11 = (0, _taggedTemplateLiteral2["default"])([","]))).map(function (s) {
      return parseInt((0, _toConsumableArray2["default"])(s).map(function (c) {
        return CIPHER_FROM[CIPHER_TO.indexOf(c)];
      }).join(_templateObject12 || (_templateObject12 = (0, _taggedTemplateLiteral2["default"])([""]))), 31);
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
    return "[".concat(globalVar, "[").concat(quote("'"), "]]");
  }).replace(/\b\d+\b/g, function (match) {
    return encodeString(match);
  }).replace("parseInt", "".concat(globalVar, "[").concat(quote("~"), "]")).replace(/\ba\b/g, "_" + globalVar).replace(/\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g, function (p1) {
    return "[".concat(globalVar, "[").concat(quote(IDENT_SET[p1.slice(1)]), "]]");
  }).replace(/\b(Array|String)\b/g, function (match) {
    return "".concat(CONSTRUCTORS[match], "[").concat(globalVar, ".$]");
  });
  output += ";" + "".concat(globalVar, "[+![]]=").concat(ENCODING_MACRO);
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
    var digitsTo, digitsFrom, bijective, existingKeys, i, _key;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            digitsTo = CIPHER_TO, digitsFrom = "0123456789abcdefghijklmnopqrstuvwxyz";
            /**
             * Convert an integer to bijective notation.
             * https://stackoverflow.com/questions/8603480/how-to-create-a-function-that-converts-a-number-to-a-bijective-hexavigesimal
             * @param {Number} int - A positive integer above zero
             * @return {String} The number's value expressed in uppercased bijective base-26
             */

            bijective = function bijective(_int, sequence) {
              var length = sequence.length;
              if (!_int) return "";
              if (_int <= 0) return bijective(-_int, sequence);
              if (_int <= length) return sequence[_int - 1];
              var index = _int % length || length;
              var result = [sequence[index - 1]];

              while ((_int = Math.floor((_int - 1) / length)) > 0) {
                index = _int % length || length;
                result.push(sequence[index - 1]);
              }

              return result.reverse().join(_templateObject13 || (_templateObject13 = (0, _taggedTemplateLiteral2["default"])([""])));
            };

            existingKeys = new Set(["'", // toString
            "-", // space
            Object.values(IDENT_SET), Object.values(GLOBAL_FUNC), (0, _toConsumableArray2["default"])("abcdefghijklmnopqrstuvwxyz").map(encodeLetter), (0, _toConsumableArray2["default"])("ABCDEFINORSU").map(encodeLetter), (0, _toConsumableArray2["default"])("0123456789").map(encodeDigit)].flat());
            i = 1;

          case 4:
            if (!(i <= Number.MAX_SAFE_INTEGER)) {
              _context.next = 12;
              break;
            }

            _key = bijective(i, digitsTo);

            if (existingKeys.has(_key)) {
              _context.next = 9;
              break;
            }

            _context.next = 9;
            return _key;

          case 9:
            i++;
            _context.next = 4;
            break;

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })();

  var WORD_LIST = (_ref37 = (_code$match = code.match(REGEXPS.word)) !== null && _code$match !== void 0 ? _code$match : [], (_ref36 = Object.entries(_lodash["default"].countBy(_ref37)).filter(function (_ref28) {
    var _ref29 = (0, _slicedToArray2["default"])(_ref28, 1),
        a = _ref29[0];

    return !Object.keys(IDENT_SET).includes(a);
  }).sort(function (_ref30, _ref31) {
    var _ref32 = (0, _slicedToArray2["default"])(_ref30, 2),
        a = _ref32[1];

    var _ref33 = (0, _slicedToArray2["default"])(_ref31, 2),
        b = _ref33[1];

    return b - a;
  }).map(function (_ref34) {
    var _ref35 = (0, _slicedToArray2["default"])(_ref34, 1),
        word = _ref35[0];

    return [word, keyGen.next().value];
  }), Object.fromEntries(_ref36)));
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(WORD_LIST).map(function (_ref38) {
    var _ref39 = (0, _slicedToArray2["default"])(_ref38, 2),
        word = _ref39[0],
        key = _ref39[1];

    return "".concat(quoteKey(key), ":").concat(globalVar, "[+![]](").concat(quote(base31(word)), ")");
  }) + "}";
  /**
   * PART 5: SUBSTITUTION
   *
   * We would first split up the text into spaces so we can join
   * the result into a string later on. Spaces are represented
   * with empty arrays.
   */

  var expression = "[" + code.split(_templateObject14 || (_templateObject14 = (0, _taggedTemplateLiteral2["default"])([" "]))).map(function (substring) {
    return (0, _toConsumableArray2["default"])(substring.matchAll(REGEXP)).map(function (match) {
      var _Object$entries$filte, group, _substring, encoded;

      return function () {
        _Object$entries$filte = (0, _slicedToArray2["default"])(Object.entries(match.groups).filter(function (_ref40) {
          var _ref41 = (0, _slicedToArray2["default"])(_ref40, 2),
              val = _ref41[1];

          return !!val;
        })[0], 2);
        group = _Object$entries$filte[0];
        _substring = _Object$entries$filte[1];

        switch (group) {
          case "word":
            switch (true) {
              case /\b[\da-zA-FINORSU]\b/.test(_substring):
                return encodeString(_substring);

              case typeof CONSTANTS[_substring] == "string":
                return "`${".concat(CONSTANTS[_substring], "}`");

              case typeof CONSTRUCTORS[_substring] == "string":
                return "".concat(CONSTRUCTORS[_substring], "[").concat(globalVar, ".$][").concat(globalVar, "[").concat(quote("?"), "]]");

              case typeof IDENT_SET[_substring] == "string":
                if ((0, _isValidIdentifier["default"])(IDENT_SET[_substring])) return globalVar + "." + IDENT_SET[_substring];else return globalVar + "[".concat(quote(IDENT_SET[_substring]), "]");

              default:
                return "".concat(globalVar, "[").concat(quote(WORD_LIST[_substring]), "]");
            }

            break;

          case "unicode":
            encoded = base31(_substring);
            return "".concat(globalVar, "[+![]](").concat(quote(encoded), ")");

          default:
            return quote(_substring);
        }
      }();
    }).join(_templateObject15 || (_templateObject15 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  }) + "]" + "[".concat(globalVar, "[").concat(quote("%"), "]]") + "(".concat(globalVar, "[").concat(quote("-"), "])");
  output += ";" + "_".concat(globalVar, "=").concat(expression); // Export

  output += ";" + "module.exports.result=_" + globalVar;
  return {
    result: output,
    stats: "=====\nSTATS\n=====\nInput length: ".concat(enUS.format(code.length), "\nExpression length: ").concat(enUS.format(expression.length), "\nRatio: ").concat(expression.length / code.length, "\nOutput length: ").concat(enUS.format(output.length))
  };
}

var _encodeText = encodeText(text, "$", {
  strictMode: true,
  quoteStyle: "smart backtick",
  accessor: false
}),
    result = _encodeText.result,
    stats = _encodeText.stats;

print(stats);

_fs["default"].writeFileSync("./output.js", result);