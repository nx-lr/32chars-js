# PunkScript: Punctuation-Only JavaScript

## About

PunkScript is a JavaScript-based obfuscator that encodes any piece of text (which includes JavaScript programs) into valid JavaScript completely devoid of all letters, numbers and spacing characters. Just 32 symbol and punctuation characters in ASCII.

This project is the spiritual successor to many JavaScript code obfuscators out there such as [Hieroglyphy](https://github.com/alcuadrado/hieroglyphy) and [JSF\*ck](https://github.com/aemkei/jsfuck), but is most inspired by Yosuke Hasegawa's [jjencode](https://utf-8.jp/public/jjencode.html).

## History

JavaScript is weird, in so many ways. But, you may disagree, but the one thing people hate the most about JavaScript is that it's weakly typed. And because of the way JavaScript evaluates expressions, it (sometimes) can lead to very surprising results.

And because of this, people have tried many ways to exploit this very flaw of JavaScript, resulting in the emergence of JavaScript "compilers" that encodes JavaScript code into an obfuscated form using only a fixed set of symbols. That program was jjencode, with eighteen characters `[]()!+,\"$.:;_{}~=`. And soon enough, other entries propped up which brought down the minimum number of characters down to eight `[]()!+,/`, and then finally six `[]()!+` with JSF\*ck.

The fundamental thing is that these encoders follow a general _**pattern**_:

- evaluating an expression using only those characters to form a constant,
- converting that constant to a string, and then
- accessing that string with an index to get a single character.

This process repeats itself a few times, first yielding numbers, then letters and the space, symbols, and then finally every other Unicode character with a suitable function like `String.fromCharCode` or `eval`.

## How it works, roughly

In theory, any JavaScript program can be written, even without the need for any alphanumeric characters. However, they all produce very long sequences of characters. PunkScript does things a little differently.

It uses all 32 ASCII punctuation characters `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ``. Which means there is enough syntax to form strings, data structures and other constructs _literally_ without needing to assemble them character by character, resulting in a very compact output.

And because we live in the era of modern JavaScript, we should also use the latest version of JavaScript, with things like anonymous functions, spreads, string interpolation, raw strings, tagged templates, and a ton of new methods.

We could assemble the input string character by character, and then substituting expressions for each, but that is very trivial and would result in a very long output. To shorten the output significantly, we should break it down into larger chunks or runs of characters instead. This can be done through "_tagged_" regular expressions (regular expressions with named groups).

Since we have a fairly large character set, substrings with those combinations of those 32 punctuation symbols can be represented literally as a single string. Other sequences of characters would still need to be formed through operations.

The program starts out by assigning a global variable, say `$` to `~[]`. We increment this variable up to 9 while assigning the digits and also single characters of simple primitive constant values, wrapping them in a template string `` `${}` ``, ciphering them as properties of an object. Then the global variable is reassigned to said object within the same statement.

The space, the only non-alphanumeric character not part of the 32 characters, is created from the string `[object Object]` which has a space inside of it. It is assigned the property `-`

The letters have two characters, the first defines its case and the second an arbitrary symbol, each unique to a letter in the English alphabet. The digits have keys defined in binary, padded to length 3.

I use the letters to begin assembling words such as `constructor`, making sure to store every word made thereafter. We can access the constructors of literals like `()=>{}` or `/./` or expressions like `+{}`, then converting them to strings like we did be before, yielding us a string like `function Constructor { [native code] }`.

This way, we have the entire lowercase alphabet save for 5 `h k q w z` and 12 of the uppercase letters `A B C D E F I N O R S U`. The other 5 lowercase letters are made by passing a small number in base 36, which always lowercase. Two more uppercase letters `C` and `D` are created by indexing a URL with a single character like `<` or `=` with the `escape` function, and uppercase `U` is gotten from the `[object Undefined]` string, evaluated from `Object.toString.call().toString()`.

With this, I now define these properties by spelling them out character by character, except `toString` itself which is formed from `to` and by accessing the `name` property on the `String` constructor. All these identifier strings are substituted with single character properties, which are needed to form functions.

```js
const props = {
  space: "-",

  // first pass: constants
  concat: "+",
  call: "!",
  join: "%",
  slice: "/",
  return: "_",
  constructor: "$",
  source: ",",

  // 'to' + String.constructor.name
  toString: "'",

  // global functions
  eval: "=",
  escape: ">",
  parseInt: "~",

  // second pass: constructors
  name: "?",
  map: "^",
  replace: ":",
  repeat: "*",
  split: "|",
  indexOf: "#",
  entries: ";",
  fromEntries: "<",

  // third pass: toString, escape and call
  fromCharCode: "@",
  keys: "&",
  raw: "`",
  toUpperCase: '"',

  // fourth pass:
  toLowerCase: ".",
}
```

Using these strings, I define one function that turns arbitrary UTF-16 sequences into a sequence of symbol characters. The code points are converted into base 31 and its digits ciphered using the 31 symbol characters, leaving the comma to separate each UTF-16 code unit.

Similar strings are defined from existing ones not only through concatenation, but repetition, substitution and slicing.

Words that repeat themselves throughout the program are captured, encoded and assigned new keys to the same global object, ranked based on decreasing frequency and given a predefined key based on a custom generator function so that they can be referenced in the string later on.

Exceptions to this include the single character strings, stringified primitives and literals, and the strings above.

Sequences of ASCII symbols are included literally in the output. A regular expression splits and tokenizes the input string into these categories, and then joins them together with a `+` operator.

## Disclaimer

Only obfuscate things that belong to you. This repository and its command line program, and the code shall not be used in any malicious purpose.

**ONLY OBFUSCATE THINGS THAT BELONG TO YOU**. This repository and command line program shall not be used nor intended for malicious purposes, including scripting attacks, since it is a code obfuscator and can bypass most filters. I strongly urge you **NOT** to use this program to generate ANY malicious JavaScript code, or run programs that would otherwise generate such code.

This program shall ONLY be used for experimental, educational and privacy purposes. **I am absolutely NOT responsible for any damage caused by the generated code or the program itself.**
