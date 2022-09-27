# PunkScript: Punctuation-Only JavaScript

## About

PunkScript is a JavaScript-based obfuscator that encodes any piece of text (which includes JavaScript programs) into valid JavaScript completely devoid of all letters, numbers and spacing characters. Just 32 symbol and punctuation characters in ASCII.

This project is the spiritual successor to many JavaScript code obfuscators out there such as [Hieroglyphy](https://github.com/alcuadrado/hieroglyphy) and [JSF\*ck](https://github.com/aemkei/jsfuck), but is most inspired by Yosuke Hasegawa's [jjencode](https://utf-8.jp/public/jjencode.html).

## History

JavaScript is weird, in so many ways. But, you may disagree, but the one thing people hate the most about JavaScript is that it's weakly typed. And because of the way JavaScript evaluates expressions, it (sometimes) can lead to very surprising results.

And because of this, people have tried many ways to exploit this very flaw of JavaScript, resulting in the emergence of JavaScript "compilers" encoding JavaScript into an obfuscated form using only a fixed set of symbols. In theory, any JavaScript program can be written without any alphanumeric characters present.

The first such program was jjencode, with a set of 18 characters `[]()!+,\"$.:;_{}~=`. In Jan 2010, an informal competition was held in a security forum, bringing down the minimum number of characters down to 8 `[]()!+,/`. Contributors managed to remove the need for the characters `,` and `/`, bringing the minimum to 6 `[]()!+`.

This process first yields numbers, which are made through repeatedly adding 1 to get the right digit. Higher numbers are then made by concatenating using the `+` operator which yields a string, and can be converted back into numbers by adding a prefix `+`.

To get other characters, these encoders follow a general pattern: evaluating an expression (usually a nifty trick) to form a primitive value, casting that primitive value to a string, then accessing that string with a numeric index to get the desired character.

This process may be repeated to yield new letters is formed, until a more general method of retrieving unmapped characters is found, either through `String.fromCharCode` or `eval`.

And because of constant substitution, these encoders inherently spit out very long and almost repetitive outputs, with some expansions going up to the thousands, all just to get a single character.

## How it works, roughly

### Initialization

Since we have a fairly large character set, substrings with those combinations of those 32 punctuation symbols can be represented inside a string literal, optimizing escapes. Other sequences of characters would still need to be formed through operations.

The program starts out by assigning a global variable `$` with the value of `~[]`, which evaluates to `-1`. We increment this variable up to 9 in the following statement.

Meanwhile, using type coercion, we manipulate literals to evaluate to constants like `true`, `false`, `Infinity`, `NaN`, `undefined`, and the string `[object Object]`. There's so many ways that we can form these constants, and that's the beauty of JavaScript.

We cast these expressions into strings by surrounding them with a template string literal `` `${}` ``, and then accessing them with our increment to get single character strings.

This would yield us the following letters (case-sensitive): `a b c d e f i j I l n N o O r s t u y`, the space ` ` and the digits `0` to `9`.

The letters have two characters, the first defines its case and the second an arbitrary symbol, each unique to a letter in the English alphabet. The digits have keys defined in binary using combinations of `_` and `$`, padded to length 3. The space, the only non-alphanumeric and non-symbol character, is assigned the property `-`.

`$` is then reassigned to said object within the same statement, similar to jjencode.

We now would use the letters to begin assembling words like `constructor`, making sure to store every word with a unique key so that we can refer to it later on in our code.

With the `constructor` property, we can access the constructors of literals, like `Array`, `String`, `Number`, `Boolean`, `RegExp` and `Function` (leaving out `Object`), and just like what we did before, converting that constructor function into a string.

This yields something like `function Constructor { [native code] }`. This ishihihus the letters `A B E F g m p R S v x`.

Now, we have 21 lowercase letters `a b c d e f g i j l m n o p r s t u v x y` and 9 of the uppercase letters `A B E F I N O R S`.

The other 5 lowercase letters `h k q w z` are made by passing a small number in base 36 and calling the `toString` methods which always yields the higher alphabetic digits in lowercase.

We now define these properties by spelling them out character by character, except `toString` itself which is formed from `to` and by accessing the `name` property on the `String` constructor. All these identifier strings are substituted with single character properties, which are needed to form functions.

Two more uppercase letters `C` and `D` are created by indexing a URL with a single character like `<` or `=` with the `escape` function which always yields its code points in uppercase. Uppercase `U` is gotten from the `[object Undefined]` string, evaluated from `Object.toString.call().toString()`.

We now have the entire lowercase alphabet, and forming the word `toUpperCase` we can now form the rest of the other 14 uppercase letters from the lowercase this way. `fromCharCode` allows us to form Unicode strings without us having to use `eval`, and when combined with `map`, `split` and `join` allows us to encode arbitrary Unicode strings using _some_ combinations of characters on the fly.

`L` forms part of `toLowerCase`, allowing us to convert strings to and from both cases, hence "normalizing" them. `w` is also used to form the word `raw` in `String.raw` which allows us to express strings verbatim without interpreting escape sequences, as long as it does not break JavaScript's template literal `` ` ` `` and interpolation `${` syntax.

These property and method names are assigned distinct single character keys which will make further expressions significantly shorter. Some properties reference global functions.

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

  // second pass: constructors
  name: "?",
  map: "^",
  replace: ":",
  repeat: "*",
  split: "|",
  indexOf: "#",
  entries: ";",
  fromEntries: "<",

  // 'to' + String.constructor.name
  toString: "'",

  // global functions
  eval: "=",
  escape: ">",
  parseInt: "~",

  // third pass: toString, escape and call
  fromCharCode: "@",
  keys: "&",
  raw: "`",
  toUpperCase: '"',

  // fourth pass:
  toLowerCase: ".",
}
```

### Parsing and substitution

PunkScript encodes PunkScript does things a little differently. It has a fairly large character set of 32, meaning there is enough syntax to represent strings literally without the need for substitution. JavaScript has changed quite a lot over the years and now we have string interpolation, anonymous functions, raw strings, (tagged) template strings and a ton of new methods for us to mess around with.

We could go through the string character by character, substituting and expanding character by character, but this would result in a long output. Instead, we should try and break the string down into larger runs and do something differently to each on, so to minimize repetition.

Using these methods, many of them returning strings, we can begin to define a few functions or macros. We would use numbers as our keys since they are functions, after all.

There are two encoder and decoder functions defined in the compiler and the output respectively. Methods, functions and variables Inthe encoded are substituted with regular expressions.

One function, assigned a property `-1`, made with the expression `~[]` yields case-insensitive alphanumeric characters while the other, assigned `1`, yields Unicode sequences. Both encode strings into arrays of integers.

Those integers are then converted into base 31 alphanumerics and their digits substituted with one of the 31 other punctuation characters, before joining back into a string with commas.

If the input string contains any Unicode characters, meaning anything beyond `U+7F`, both methods are used.

Using these string and array methods, we can begin to define a few functions. From here on out, we will use letters as our keys.

The keys of this object are also ciphered, but instead of normal base-31, we use bijective base 32, so that all combinations of symbols can be produced, skipping over combinations which already have been defined.

Similar strings are defined from existing ones not only through concatenation, but repetition, substitution and slicing.

Words that repeat themselves throughout the program are captured, encoded and assigned new keys to the same global object, ranked based on decreasing frequency and given a predefined key based on a custom generator function so that they can be referenced in the string later on.

Exceptions to this include the single character strings, stringified primitives and literals, and the strings above.

Sequences of ASCII symbols are included literally in the output. A regular expression splits and tokenizes the input string into these categories, and then joins them together with a `+` operator.

## Disclaimer

Only obfuscate things that belong to you. This repository and its command line program, and the code shall not be used in any malicious purpose.

**ONLY OBFUSCATE THINGS THAT BELONG TO YOU**. This repository and command line program shall not be used nor intended for malicious purposes, including scripting attacks, since it is a code obfuscator and can bypass most filters. I strongly urge you **NOT** to use this program to generate ANY malicious JavaScript code, or run programs that would otherwise generate such code.

This program shall ONLY be used for experimental, educational and privacy purposes. **I am absolutely NOT responsible for any damage caused by the generated code or the program itself.**
