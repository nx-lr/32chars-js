# PunkScript: Punctuation-Only JavaScript

## About

PunkScript is a JavaScript-based obfuscator that encodes any piece of text (which includes JavaScript programs) into valid JavaScript completely devoid of all letters, numbers and spacing characters. It mission is to find the **shortest possible valid JavaScript** encoding from a piece of text using a combination of 32 symbol and punctuation characters.

This project is the spiritual successor to many JavaScript code obfuscators out there such as [Hieroglyphy](https://github.com/alcuadrado/hieroglyphy) and [JSF\*ck](https://github.com/aemkei/jsfuck), but is most inspired by Yosuke Hasegawa's [jjencode](https://utf-8.jp/public/jjencode.html).

## History

JavaScript is weird, in so many ways. But the one thing people hate the most about JavaScript is that it's weakly typed. And because of the way JavaScript evaluates expressions, it (sometimes) can lead to very surprising results.

And because of this, people have tried many ways to exploit this very flaw of JavaScript. This has, strangely enough, resulted in the emergence of JavaScript "compilers" encoding JavaScript into an obfuscated form using only a fixed set of symbols.

This has gave rise to the assumption that any JavaScript program can be written without the need for any alphanumeric characters at all.

The first such program was jjencode, with 18 possible characters. `[]()!+,\"$.:;_{}~=` which came out in 2009. The following year, an informal competition was held to bring down the minimum number of characters down to 8 `[]()!+,/`. Contributors managed to remove the need for the characters `,` and `/`, bringing the minimum to 6 `[]()!+`.

This process first yields numbers, which are made through repeatedly adding the value `1` formed using those characters to get the right digit. Higher numbers are then made by concatenating using the `+` operator which yields a string, and can be converted back into numbers by adding a prefix `+`.

To get other characters, these encoders follow a general pattern: evaluating an expression (usually a nifty trick) to form a primitive value, casting that primitive value to a string, then accessing that string with a numeric index to get the desired character.

This process may be repeated to yield new letters is formed, until a more general method of retrieving unmapped characters is found, either through `String.fromCharCode` or `eval`.

And because of constant substitution, these encoders inherently spit out very long and almost repetitive outputs, with some expansions going up to the thousands, all just to get a single character.

## How it works, roughly

### Initialization

Since we have a fairly large character set, substrings with any combinations of those 32 punctuation characters can be represented inside a string literal, optimizing escapes and raw string literals if such can be formed without error. Other sequences of characters, including letters and numbers, would still need to be formed through operations.

The program is a substitution encoding that goes through two phases:

- Initialization, where characters and values are assigned to properties or variables.
- Substitution, where the variables are then used to build back the input string.

### Statement 1

JavaScript variable names are pretty flexible in the characters that can be used, so the above variable name of `$` is a valid name. So is `_`.

Unlike a number of other languages, such as Python, PHP and Perl, the dollar sign is not a reserved character and therefore able to be used in any part of the variable name. This allows variables to e formed with any combination of `_` and `$` characters, such as `$_`, `$$$`, and `_$_`.

The program starts out by assigning a global variable `$` with the value of `~[]`. The tilde, `~` indicates a unary bitwise NOT operation on an empty array which is numerically equivalent to `0`. This evaluates to `-1`.

### Statement 2

The next statement is significantly longer than the first. `$` is then reassigned to a JavaScript object. Properties are defined within the braces in the form `key: value`, and individual properties are separated by commas.

JavaScript defines object keys in three different ways: _identifiers_ which are any combination of (Unicode) letters, decimal numbers, underscores and dollar signs, strings encased inside single or double quotes, and _expressions_ inside square brackets, like `[x+y]`. Property access is done either with dots, like `x.for`, or square brackets `x['y']`.

The first property is `___`, three underscores. The value of this property is `` `${++$}` ``, which takes the value of `$` (currently `-1`), increments it (to `0`), and then assigns it to the property. So, in this statement, `$` is incremented by one to `0`, converted into a string by wrapping the expression inside a template literal `` `${}` ``, and then assigned to `$.___`. Note that since the object is still being built, `$` is still a number and not an object yet.

The second property is `$$$$`. The value of this property is `` `${![]}`[$] ``. The first part of this is an array prepended with a logical NOT `!` operator, which turns into the Boolean value `false` (`!{}` also yields the same result since it, just like an array, is a non-primitive and hence an object). Wrapping it inside an template literal turns the evaluated result into a string, therefore it evaluates to `"false"`.

There is a `[$]` after the string `"false"`. In JavaScript, a letter of a string can  be obtained by specifying the index of the character within brackets (string positions start at `0`). Here, `$` currently evaluates to 0, so this line is asking for the character at position `0` in the string `"false"`, or `"f"`.

The rest of the object properties are constructed in a similar fashion: incrementing the `$` variable, constructing a string, and grabbing a character out of the string by specifying its index. So, using type coercion, we manipulate literals to evaluate to constants like `true`, `false`, `Infinity`, `NaN`, `undefined`, and an empty object `{}` which becomes the string `"[object Object]"`. There's so many ways that we can form these constants, and that's the beauty of JavaScript.

This would yield us the following letters (case-sensitive): `a b c d e f i j I l n N o O r s t u y`, the space and the digits `0` to `9`. Based on the output we have a cipher to store our characters. We have the hexadecimal alphabet for use in the later substitutions.

The letters have two characters, the first `_` or `$` defines its case and the second an arbitrary symbol, each unique to a letter in the English alphabet, minus the three pairs of brackets `()[]{}`.

The digits have keys defined as binary, ciphered with combinations of `_` (digit 0) and `$` (digit 1), then padded to length 3 or 4, so `0` is `___`, `4` is `$__` and `9` is `$__$`. The space, the only non-alphanumeric and non-symbol character, is assigned the property `-`.

### Statement 3

From the third line, we would use the letters we have gotten to form new words by concatenating individual letters with the `+` operator to form words. These words are then used to access properties on values or call methods on them. For instance `"constructor"`.

With the `constructor` property, we can access the constructors of literals, like `Array` (`[]`), `String` (`''`), `Number` (`+[]`), `Boolean` (`![]`), `RegExp` (`/./`) and `Function` (`()=>{}`) (leaving out `Object`), and like what we did before, converting that constructor function into a string. This yields something like `function Array { [native code] }`, where when evaluated in a JavaScript interpreter. This will yield the letters `A B E F g m p R S v x`.

Now, we have 21 lowercase letters `a b c d e f g i j l m n o p r s t u v x y` and 9 of the uppercase letters `A B E F I N O R S`. We make sure to store every word and letter we have found with a unique key so that we can refer to it later on in our code.

### Statement 4 and beyond

Repeating the same process as in statement 2 and 3 again, that is, forming values using existing keys, casting the result into a string, indexing with a number to get a new letter, storing these letters inside the global object, forming property names by concatenating individual letters, then storing that string value inside the global object with another key.

`toString` itself is an exception, being formed from concatenating the string `t` and `o`, and then the `name` property on the `String` constructor which yields `'String'`. With this method, we can retrieve five more lowercase letters `h k q w z` by passing a small number in base 36 and calling the `toString` methods which always yields the higher alphabetic digits in lowercase.

Two more uppercase letters `C` and `D` are created by indexing a URL with an invalid character like `<` or `=` with the `escape` function which always yields its code points in uppercase. Uppercase `U` is gotten from the `[object Undefined]` string, evaluated from `{}.constructor.toString.call().toString()`.

We now have the entire lowercase alphabet, and forming the word `toUpperCase` we can now form the rest of the other 14 uppercase letters from the lowercase this way. `fromCharCode` allows us to form Unicode strings without us having to use `eval`, and when combined with `map`, `split` and `join` allows us to encode arbitrary Unicode strings using _some_ combinations of characters on the fly.

`L` forms part of `toLowerCase`, allowing us to convert strings to and from both cases, hence "normalizing" them. `w` is also used to form the word `raw` in `String.raw` which allows us to express strings verbatim without interpreting escape sequences, as long as it does not break JavaScript's template literal `` ` ` `` and interpolation `${` syntax.

These property and method names are assigned distinct single character keys which will make further expressions significantly shorter. Some properties reference global functions.

```js
const props = {
  // statement 2: constants
  // 0 1 2 3 4 5 6 7 8 9
  // a b c d e f i j I l n N o O r s t u y [space]
  space: "-",

  // statement 3
  concat: "+",
  call: "!",
  join: "%",
  slice: "/",
  return: "_",
  constructor: "$",
  source: ",",

  // statement 4: constructors
  // A B E F g m p R S v x

  // statement 5
  name: "?",
  map: "^",
  replace: ":",
  repeat: "*",
  split: "|",
  indexOf: "#",
  entries: ";",
  fromEntries: "<",

  // statement 6: constructors
  // 'to' + String.constructor.name
  toString: "'",

  // statement 7: global functions
  eval: "=",
  escape: ">",
  parseInt: "~",

  // statement 8: toString, escape and call
  // h k q w z C D U

  // statement 9
  fromCharCode: "@",
  keys: "&",
  raw: "`",
  toUpperCase: '"',

  // statement 10: h k q w z C D U
  toLowerCase: ".",
}
```

### Encoding

PunkScript encoded strings a little differently than the other encoders. It has a fairly large character set, meaning that there is syntax to represent strings literally without the need for substitution. Also, we now have string interpolation, anonymous functions, everything to do with template strings and a ton of new methods for us to mess around with.

Whereas it's simpler to go over the string character by character, this would result in a longer output. It's better and shorter for us to try and break the string down into runs and then do something different to each one, so to minimize repetition, using as few operations to each one as possible.

The string is first divided by spaces, with each space represented by a comma in an array. Runs of other characters form the array's elements, and concatenated with the `+` operator.

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
