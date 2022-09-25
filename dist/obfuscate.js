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

var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var print = console.log;

var text = _fs["default"].readFileSync("./input.txt", "utf8");

function encodeText(code, globalVar) {
  var _code$match, _ref32, _ref33;

  var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
      _ref$strictMode = _ref.strictMode,
      strictMode = _ref$strictMode === void 0 ? false : _ref$strictMode,
      _ref$quoteStyle = _ref.quoteStyle,
      quoteStyle = _ref$quoteStyle === void 0 ? "" : _ref$quoteStyle,
      _ref$threshold = _ref.threshold,
      threshold = _ref$threshold === void 0 ? 1 : _ref$threshold;

  var BUILTINS = /^(Array|ArrayBuffer|AsyncFunction|AsyncGenerator|AsyncGeneratorFunction|Atomics|BigInt|BigInt64Array|BigUint64Array|Boolean|DataView|Date|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|exports|Float32Array|Float64Array|Function|Generator|GeneratorFunction|globalThis|Infinity|Int16Array|Int32Array|Int8Array|Intl|isFinite|isNaN|JSON|Map|Math|module|NaN|Number|Object|parseFloat|parseInt|Promise|Proxy|Reflect|RegExp|Set|SharedArrayBuffer|String|Symbol|this|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|undefined|unescape|WeakMap|WeakSet|WebAssembly)$/;
  var REGEXPS = {
    word: (0, _xregexp["default"])(String.raw(_templateObject || (_templateObject = (0, _taggedTemplateLiteral2["default"])(["[pLpN]+|[\0-\x1F\x7F]+"], ["[\\pL\\pN]+|[\\0-\\x1f\\x7f]+"]))), "g"),
    symbol: /[!-\/:-@[-`{-~]+/g,
    unicode: /[^ -~]+/g
  };
  var REGEXP = RegExp(Object.entries(REGEXPS).map(function (_ref2) {
    var _ref3 = (0, _slicedToArray2["default"])(_ref2, 2),
        key = _ref3[0],
        source = _ref3[1].source;

    return "(?<".concat(key, ">").concat(source, ")");
  }).join(_templateObject2 || (_templateObject2 = (0, _taggedTemplateLiteral2["default"])(["|"]))), "g");

  var checkIdentifier = function checkIdentifier(ident) {
    return (ident = ident.trim()) && (0, _isValidIdentifier["default"])(ident) && !BUILTINS.test(ident);
  };

  if (!checkIdentifier(globalVar)) throw new Error("Invalid global variable: ".concat(quote(globalVar)));
  var MAX_STRING_LENGTH = 536870888,
      enUS = Intl.NumberFormat("en-us");
  if (code.length > MAX_STRING_LENGTH) throw new Error("Input string can only be up to ".concat(enUS.format(NODE_MAX_LENGTH), " characters long"));
  var count = 0;

  var quoteHelper = function quoteHelper(string, quote) {
    switch (quote) {
      case "single":
      case "double":
        return JSON.stringify(string);

      case "backtick":
        return JSON.stringify(string);
    }
  };

  var quoteSequence = quoteStyle.match(/\b(single|double|backtick)\b/g) || ["single"],
      quoteMode = quoteStyle.match(/\b(cycle|only|smart|random)\b/g)[0] || "smart";

  var quote = function quote(string) {
    var _current;

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

    var current;

    switch (quoteMode) {
      case "only":
        current = quoteSequence[0];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "cycle":
        current = quoteSequence[count++ % quotes.length];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "random":
        current = quoteSequence[Math.random() * quoteSequence.length];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "smart":
        {
          var chosen;
          current = quoteSequence[0];
          var lengthMap = {
            single: single.length,
            "double": _double.length,
            backtick: backtick.length
          },
              lengthSorted = Object.entries(lengthMap).sort(function (_ref4, _ref5) {
            var _ref6 = (0, _slicedToArray2["default"])(_ref4, 2),
                a = _ref6[1];

            var _ref7 = (0, _slicedToArray2["default"])(_ref5, 2),
                b = _ref7[1];

            return a - b;
          });

          var _lengthSorted = (0, _slicedToArray2["default"])(lengthSorted, 2),
              _short = _lengthSorted[0],
              mid = _lengthSorted[1];

          switch (new Set(Object.values(lengthMap)).size) {
            case 3:
              chosen = _short[0];
              break;

            case 2:
              chosen = _short[0] == current || mid[0] == current ? current : _short[0];
              break;

            case 1:
              chosen = (_current = current) !== null && _current !== void 0 ? _current : _short[0];
          }

          return (0, _jsesc["default"])(string, {
            quotes: chosen,
            wrap: true
          });
        }
    }
  };

  var LETTERS = "abcdefghijklmnopqrstuvwxyz";
  var CIPHER = ";.!:_-,?/'*+#%&^\"|~$=<>`@\\";
  var SPACE = "-";

  var encodeLetter = function encodeLetter(_char) {
    return (_voca["default"].isUpperCase(_char) ? "$" : "_") + CIPHER[LETTERS.indexOf(_char.toLowerCase())];
  };

  var encodeDigit = function encodeDigit(number) {
    return (0, _toConsumableArray2["default"])((+number).toString(2).padStart(3, 0)).map(function (match) {
      return match == 1 ? "$" : "_";
    }).join(_templateObject3 || (_templateObject3 = (0, _taggedTemplateLiteral2["default"])([""])));
  };

  var CONSTANTS = {
    "true": "!".concat(quote("")),
    "false": "![]",
    undefined: "[][[]]",
    Infinity: "!".concat(quote(""), "/![]"),
    NaN: "+{}",
    "[object Object]": "{}"
  };

  var quoteKey = function quoteKey(string) {
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

    var current;

    switch (quoteMode) {
      case "only":
        current = quoteSequence[0];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "cycle":
        current = quoteSequence[count++ % quotes.length];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "random":
        current = quoteSequence[Math.random() * quoteSequence.length];
        return (0, _jsesc["default"])(string, {
          quotes: current,
          wrap: true
        });

      case "smart":
        {
          if ((0, _isValidIdentifier["default"])(string)) return string;
          var chosen;
          var lengthMap = {
            single: single.length,
            "double": _double2.length
          },
              lengthSorted = Object.entries(lengthMap).sort(function (_ref8, _ref9) {
            var _ref10 = (0, _slicedToArray2["default"])(_ref8, 2),
                a = _ref10[1];

            var _ref11 = (0, _slicedToArray2["default"])(_ref9, 2),
                b = _ref11[1];

            return a - b;
          });

          switch (new Set(Object.values(lengthMap)).size) {
            case 2:
              chosen = lengthSorted[0][0];
              break;

            case 1:
              chosen = quoteSequence[0] == "backtick" ? lengthSorted[0][0] : quoteSequence[0];
          }

          return (0, _jsesc["default"])(string, {
            quotes: chosen,
            wrap: true
          });
        }
    }
  };

  var output = "".concat(strictMode ? "var ".concat(globalVar, ",_").concat(globalVar, ";") : "").concat(globalVar, "=~[];");
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
    return ["".concat(encodeDigit(digit), ":`${++").concat(globalVar, "}`")].concat((0, _toConsumableArray2["default"])(Object.entries(CHARSET_1).filter(function (_ref12) {
      var _ref13 = (0, _slicedToArray2["default"])(_ref12, 2),
          _ref13$ = (0, _slicedToArray2["default"])(_ref13[1], 2),
          value = _ref13$[1];

      return value == digit;
    }).map(function (_ref14) {
      var _ref15 = (0, _slicedToArray2["default"])(_ref14, 2),
          _char3 = _ref15[0],
          _ref15$ = (0, _slicedToArray2["default"])(_ref15[1], 1),
          literal = _ref15$[0];

      return "".concat(quoteKey(_char3 == " " ? "-" : encodeLetter(_char3)), ":`${").concat(literal, "}`[").concat(globalVar, "]");
    })));
  }) + "}";
  output += RES_CHARSET_1;
  var IDENT_SET1 = {
    concat: "+",
    call: "!",
    join: "%",
    slice: "/",
    "return": "_",
    constructor: "$",
    source: ","
  };
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

    var expansion = "`${".concat(_expression3, "[").concat(globalVar, ".$]}`[").concat("".concat(_index).split(_templateObject5 || (_templateObject5 = (0, _taggedTemplateLiteral2["default"])([""]))).map(function (digit) {
      return "".concat(globalVar, ".").concat(encodeDigit(digit));
    }).join(_templateObject4 || (_templateObject4 = (0, _taggedTemplateLiteral2["default"])(["+"]))), "]");
    if (!(_char5 in CHARSET_1)) CHARSET_2[_char5] = [_expression3, _index, expansion];
  }

  var objectDifference = function objectDifference(x, y) {
    return Object.fromEntries(_lodash["default"].difference(_lodash["default"].keys(x), _lodash["default"].keys(y)).map(function (z) {
      return [z, x[z]];
    }));
  };

  var CHARSET_2_DIFF = objectDifference(CHARSET_2, CHARSET_1);
  var RES_CHARSET_2 = "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(CHARSET_2_DIFF).map(function (_ref16) {
    var _ref17 = (0, _slicedToArray2["default"])(_ref16, 2),
        letter = _ref17[0],
        _ref17$ = (0, _slicedToArray2["default"])(_ref17[1], 3),
        expansion = _ref17$[2];

    return "".concat(quoteKey(encodeLetter(letter)), ":").concat(expansion);
  }) + "}";

  var encodeString = function encodeString() {
    var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return (0, _toConsumableArray2["default"])("".concat(str).replace(/\W/g, "")).map(function (_char6) {
      var encoded;
      return /[$_]/.test(_char6) ? quote(_char6) : /\d/.test(_char6) ? "".concat(globalVar, ".").concat(encodeDigit(_char6)) : (encoded = encodeLetter(_char6), (0, _isValidIdentifier["default"])(encoded) ? "".concat(globalVar, ".").concat(encoded) : globalVar + "[".concat(quote(encoded), "]"));
    }).join(_templateObject6 || (_templateObject6 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  };

  var encodeIdentifiers = function encodeIdentifiers(identifiers) {
    return "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(identifiers).map(function (_ref18) {
      var _ref19 = (0, _slicedToArray2["default"])(_ref18, 2),
          ident = _ref19[0],
          key = _ref19[1];

      return [key, encodeString(ident)];
    }).map(function (_ref20) {
      var _ref21 = (0, _slicedToArray2["default"])(_ref20, 2),
          key = _ref21[0],
          expr = _ref21[1];

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
    source: "`",
    entries: "[",
    fromEntries: "]"
  };
  output += ";" + encodeIdentifiers(IDENT_SET2);
  var GLOBAL_FUNC = {
    eval: "=",
    escape: ">",
    unescape: "<",
    parseInt: "~",
    parseFloat: "."
  };
  var RES_FUNCTIONS_1 = "".concat(globalVar, "={...").concat(globalVar, ",") + Object.entries(GLOBAL_FUNC).map(function (_ref22) {
    var _ref23 = (0, _slicedToArray2["default"])(_ref22, 2),
        ident = _ref23[0],
        shortcut = _ref23[1];

    return "".concat(quoteKey(shortcut), ":") + "(()=>{})" + "[".concat(globalVar, ".$]") + "(" + "".concat(globalVar, "._+").concat(globalVar, "[").concat(quote("-"), "]+").concat(encodeString(ident)) + ")" + "()";
  }) + "}";
  output += ";" + RES_FUNCTIONS_1;
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",") + [[quoteKey("'"), "".concat(encodeString("to"), "+") + "".concat(quote(""), "[").concat(globalVar, ".$]") + "[".concat(globalVar, "[").concat(quote("?"), "]]")], [quoteKey(encodeLetter("C")), "".concat(globalVar, "[").concat(quote(">"), "]") + "(".concat(quote("<"), ")") + "[".concat(globalVar, ".").concat(encodeDigit(2), "]")], [quoteKey(encodeLetter("D")), "".concat(globalVar, "[").concat(quote(">"), "]") + "(".concat(quote("="), ")") + "[".concat(globalVar, ".").concat(encodeDigit(2), "]")]].map(function (x) {
    return x.join(_templateObject7 || (_templateObject7 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
  var CIPHER_FROM = "0123456789abcdefghijklmnopqrstuvwxyz";
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",") + [[quoteKey(encodeLetter("U")), "`${{}[".concat(globalVar, "[").concat(quote("'"), "]]") + "[".concat(globalVar, "[").concat(quote("!"), "]]()}`") + "[".concat(globalVar, ".").concat(encodeDigit(8), "]")]].concat((0, _toConsumableArray2["default"])((0, _toConsumableArray2["default"])("hkqwz").map(function (letter) {
    return [quoteKey(encodeLetter(letter)), "(+(".concat(encodeString(CIPHER_FROM.indexOf(letter)), "))") + "[".concat(globalVar, "[").concat(quote("'"), "]](").concat(encodeString(36), ")")];
  }))).map(function (x) {
    return x.join(_templateObject8 || (_templateObject8 = (0, _taggedTemplateLiteral2["default"])([":"])));
  }) + "}";
  var IDENT_SET3 = {
    fromCharCode: "@",
    keys: "&",
    toUpperCase: '"'
  };
  output += ";" + encodeIdentifiers(IDENT_SET3);
  var CIPHER_TO = "_.:;!?*+^-=<>~'\"`/|#$%&@{}()[]\\";

  var IDENT_SET = _objectSpread(_objectSpread(_objectSpread({}, IDENT_SET1), IDENT_SET2), IDENT_SET3);

  var base31 = function base31(s) {
    return "".concat((0, _toConsumableArray2["default"])(Array(s.length)).map(function (x, i) {
      return (0, _toConsumableArray2["default"])(s.charCodeAt(i).toString(31)).map(function (c) {
        return CIPHER_TO[CIPHER_FROM.indexOf(c)];
      }).join(_templateObject9 || (_templateObject9 = (0, _taggedTemplateLiteral2["default"])([""])));
    }));
  };

  var base31Decode = function base31Decode(b) {
    return String.fromCharCode.apply(String, (0, _toConsumableArray2["default"])(b.split(_templateObject10 || (_templateObject10 = (0, _taggedTemplateLiteral2["default"])([","]))).map(function (s) {
      return parseInt((0, _toConsumableArray2["default"])(s).map(function (c) {
        return CIPHER_FROM[CIPHER_TO.indexOf(c)];
      }).join(_templateObject11 || (_templateObject11 = (0, _taggedTemplateLiteral2["default"])([""]))), 31);
    })));
  };

  var ENCODING_MACRO = "a=>a.split`,`.map(a=>parseInt([...a].map(a=>[...Array(+(31)).keys()].map(a=>a.toString(31))[CIPHER_TO.indexOf(a)]).join``,31)).map(a=>String.fromCharCode(a)).join``".replace("CIPHER_TO", quote(CIPHER_TO)).replace(/\.toString\b/g, function (ident) {
    return "[".concat(globalVar, "[").concat(quote("'"), "]]");
  }).replace(/\b\d+\b/g, function (match) {
    return encodeString(match);
  }).replace("parseInt", "".concat(globalVar, "[").concat(quote("~"), "]")).replace(/\ba\b/g, "_" + globalVar).replace(/\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g, function (p1) {
    return "[".concat(globalVar, "[").concat(quote(IDENT_SET[p1.slice(1)]), "]]");
  }).replace(/\b(Array|String)\b/g, function (match) {
    return "".concat(CONSTRUCTORS[match], "[").concat(globalVar, ".$]");
  });
  output += ";" + "".concat(globalVar, "[+![]]=").concat(ENCODING_MACRO);
  var RE_CONSTANTS = ["true", "false", "Infinity", "NaN", "undefined", Object.keys(IDENT_SET)].flat();

  var keyGen = _regenerator["default"].mark(function _callee() {
    var digitsTo, digitsFrom, bijective, existingKeys, i, _key;

    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            digitsTo = CIPHER_TO, digitsFrom = "0123456789abcdefghijklmnopqrstuvwxyz";

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

              return result.reverse().join(_templateObject12 || (_templateObject12 = (0, _taggedTemplateLiteral2["default"])([""])));
            };

            existingKeys = new Set(["'", "-", Object.values(IDENT_SET), Object.values(GLOBAL_FUNC), (0, _toConsumableArray2["default"])("abcdefghijklmnopqrstuvwxyz").map(encodeLetter), (0, _toConsumableArray2["default"])("ABCDEFINORSU").map(encodeLetter), (0, _toConsumableArray2["default"])("0123456789").map(encodeDigit)].flat());
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
            return _context.abrupt("return");

          case 13:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })();

  var WORD_LIST = (_ref33 = (_code$match = code.match(REGEXPS.word)) !== null && _code$match !== void 0 ? _code$match : [], (_ref32 = Object.entries(_lodash["default"].countBy(_ref33)).filter(function (_ref24) {
    var _ref25 = (0, _slicedToArray2["default"])(_ref24, 2),
        word = _ref25[0],
        frequency = _ref25[1];

    var alreadyDefined = [].concat((0, _toConsumableArray2["default"])(Object.keys(_objectSpread(_objectSpread(_objectSpread({}, IDENT_SET), CONSTRUCTORS), CONSTANTS))), (0, _toConsumableArray2["default"])(CIPHER_FROM + "ABCDEFINORSU"));
    return !alreadyDefined.includes(word) && frequency > threshold;
  }).sort(function (_ref26, _ref27) {
    var _ref28 = (0, _slicedToArray2["default"])(_ref26, 2),
        c = _ref28[0],
        a = _ref28[1];

    var _ref29 = (0, _slicedToArray2["default"])(_ref27, 2),
        d = _ref29[0],
        b = _ref29[1];

    return b - a || d < c;
  }).map(function (_ref30) {
    var _ref31 = (0, _slicedToArray2["default"])(_ref30, 1),
        word = _ref31[0];

    return [word, keyGen.next().value];
  }), Object.fromEntries(_ref32)));
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",[~[]]:{") + Object.entries(WORD_LIST).map(function (_ref34) {
    var _ref35 = (0, _slicedToArray2["default"])(_ref34, 2),
        word = _ref35[0],
        key = _ref35[1];

    return "".concat(quoteKey(key), ":").concat(quote(base31(word)));
  }) + "}}";
  var WORD_LIST_EXPR = "globalVar[1]=Object.fromEntries(Object.entries(WORD_LIST).map(([k,v])=>[k,globalVar[0](v)]))".replace(/\b(v)\b/g, function (match) {
    return "_" + globalVar;
  }).replace(/\b(k)\b/g, function (match) {
    return "$" + globalVar;
  }).replace(/\b(0)\b/g, function (match) {
    return "+![]";
  }).replace(/\b(1)\b/g, function (match) {
    return "+!".concat(quote(""));
  }).replace(/\b(WORD_LIST)\b/g, "".concat(globalVar, "[~[]]")).replace(/\b(globalVar)\b/g, globalVar).replace(/\b(Object)\b/g, function (match) {
    return "{}[".concat(globalVar, ".$]");
  }).replace(/\.\b(map|entries|fromEntries)\b/g, function (p1) {
    return "[".concat(globalVar, "[").concat(quote(IDENT_SET[p1.slice(1)]), "]]");
  });
  output += ";" + WORD_LIST_EXPR;
  output += ";" + "".concat(globalVar, "={...").concat(globalVar, ",...").concat(globalVar, "[+!'']}");
  var expression = "[" + code.split(_templateObject13 || (_templateObject13 = (0, _taggedTemplateLiteral2["default"])([" "]))).map(function (substring) {
    return (0, _toConsumableArray2["default"])(substring.matchAll(REGEXP)).map(function (match) {
      var _Object$entries$filte, group, _substring, _encoded, encoded;

      return function () {
        _Object$entries$filte = (0, _slicedToArray2["default"])(Object.entries(match.groups).filter(function (_ref36) {
          var _ref37 = (0, _slicedToArray2["default"])(_ref36, 2),
              val = _ref37[1];

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

              case typeof WORD_LIST[_substring] == "string":
                return "".concat(globalVar, "[").concat(quote(WORD_LIST[_substring]), "]");

              default:
                _encoded = base31(_substring);
                return "".concat(globalVar, "[+![]](").concat(quote(_encoded), ")");
            }

            break;

          case "unicode":
            encoded = base31(_substring);
            return "".concat(globalVar, "[+![]](").concat(quote(encoded), ")");

          default:
            return quote(_substring);
        }
      }();
    }).join(_templateObject14 || (_templateObject14 = (0, _taggedTemplateLiteral2["default"])(["+"])));
  }) + "]" + "[".concat(globalVar, "[").concat(quote("%"), "]]") + "(".concat(globalVar, "[").concat(quote("-"), "])");
  output += ";" + "_".concat(globalVar, "=").concat(expression);
  output += ";" + "module.exports.result=_" + globalVar;
  return {
    result: output,
    stats: "=====\nSTATS\n=====\nInput length: ".concat(enUS.format(code.length), "\nExpression length: ").concat(enUS.format(expression.length), "\nRatio: ").concat(expression.length / code.length, "\nOutput length: ").concat(enUS.format(output.length))
  };
}

var _encodeText = encodeText(text, "$", {
  strictMode: true,
  quoteStyle: "smart backtick"
}),
    result = _encodeText.result,
    stats = _encodeText.stats;

print(stats);

_fs["default"].writeFileSync("./output.js", result);