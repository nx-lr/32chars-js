# 32chars.js

### Disclaimer

The program in this repository has a potential to be used maliciously, such as injecting obfuscated malicious code in websites. **I am solely never held responsible for any damage caused by this program or the code it outputs.**

## Introduction

32chars.js is a JavaScript encoder that obfuscates a piece of text into the shortest possible valid JavaScript code with only 32 ASCII symbol and punctuation characters: `` `~!@#$%^&*()_+{}|:"<>?-=[]\;',./ ``. This project is a testament to the many existing JavaScript encoders, and the spiritual successor to the OG encoder, [jjencode](https://utf-8.jp/public/jjencode.html).

## Background

We all know JavaScript is a programming language with lots of weird and tricky parts. But did you know that JavaScript can be written without any letters or numbers? You can make do with just [five](https://aem1k.com/five/) or [six characters](http://www.jsfuck.com/). But all these would result not only in heavily unreadable, but also _verbose_ code, where a single character could be expanded up to _thousands_ of characters.

It's common sense that scripts that contain a wide variety of individual characters are shorter and perhaps a bit more readable and parsable code. So, this project still does not use any alphabets or numbers, but rather all 32 ASCII punctuation and symbol characters, most of which are significant JavaScript tokens. The goal of this project therefore is to produce the minimum possible JavaScript encoding using those 32 characters.

## Explanation

Rather than going over each character in the input string one by one and expanding it, as much as possible, we are breaking the input string into runs of _at least_ one character. This way we are minimizing the number of operations that can be performed by the engine, while also shortening the output by a lot.

Since we have a large enough character set, we have literal syntax to form strings. Strings are very fundamental to obfuscation as we can use our own encoding schemes to represent different parts of the input string. There are also other ways to create strings with the latest JavaScript features, like template/raw strings and interpolation, `RegExp`s and `BigInt`s, and new `String`, `Array` and `Object` methods.

The program uses a two-phase substitution encoding. Characters and values are assigned to variables and properties, decoded, and then either used to construct new substrings or build back the input string. There are of course edge cases, as some expressions innately produce strings, such as constants (like `true`, `false`, etc.), string tags (like `[object Object]`), date strings (e.g. `2011-10-05T14:48:00.000Z`) and source code (e.g. `function Array() { [native code] }`).

The text is parsed and assigned to tokens: symbol sequences using those 32 characters, integers, ASCII characters, words with diacritics, non-Latin writing systems, Unicode BMP characters (code point `U+0000` to `U+FFFF`) and astral characters (code point `U+10000` and above). JavaScript stores strings as UTF-16, so Basic

The text is split by default with the space, with the split elements going into an array and separated with commas `,`. Sometimes the split result can have an empty string in between, so nothing goes in between the commas. JavaScript ignores trailing commas in arrays, objects and function arguments, so we have to explicitly add trailing commas if the final element of an output array is empty.

### Representing strings

String literals in JavaScript can be created in three ways: single and double quoted strings, which are roughly equivalent, and template strings, which allows interpolation of values. In this context, strings are _very fundamental_ to obfuscation, so we are free to create our own encoding/decoding schemes.

In the output string, substrings with only printable ASCII symbols are quoted into string literals. Usually the runs do not contain any of the quote characters `` ' " ` ``. The backslash `\`, and whatever symbol is being used for wrapping these literals, are escaped. In template literals, the sequence `${`, which normally begins an interpolation sequence, is also escaped.

Each encoded substring in the output goes through a quoting function (from the `jsesc` library) which compares the lengths of the escaped substring and selects the string literal with the least number of escapes, in that case being the shortest. It also prioritizes a fallback quoting option for strings without escapes.

### Statement 1

JavaScript allows the `_` and `$` characters to be used in variable names. So we can assign one of them, in this case, `$`, to be used to store values, characters and substrings, and the other, `_`, to store the actual string.

The code starts out by assigning `$` to the value of `-1`, or by doing a bitwise NOT on an empty array: `~[]`. Numerically, an empty array, or implicitly, a _string_, is `0`, and `~0` is equal to `-1`.

### Statement 2

In the next statement, `$` is assigned to a JavaScript object. Properties are defined within the braces, in the form `key: value`, and individual properties, key-value pairs, are separated with commas.

JavaScript has three different ways to represent keys: _identifiers_ without quotes (which also includes keywords) like `key:value`, _strings_ within single or double quotes like `'key':value`, and _expressions_ within square brackets `['key']:value`. Properties are either accessed with dots, like `x.key` or square brackets, like `x['key']`.

The first property is `___`, with a value of `` `${++$}` ``. This takes the value of `$`, currently `-1`, and increments it to `0`, then casts that into a string by wrapping inside a template literal interpolation. While the object is still being built, `$` is still a number and not an object yet, since evaluation happens from the inside out.

The second property is `_$`, with a value of `` `${!''}`[$] ``. An empty string is prepended with the NOT operator, coercing it into `false` since it is falsy. `!` also negates the boolean, resulting in `true`, before wrapping it in a template literal, becoming the string `"true"`. The `[$]` construct returns the character at index `0` (string indices start at `0`), which returns `t`.

The rest of the object properties are constructed in a similar fashion: incrementing the `$` variable, constructing a string, and grabbing a character out of the string by specifying its index. We manipulate literals to evaluate to form the constants, `true`, `false`, `Infinity`, `NaN`, `undefined`, and an empty object `{}` which becomes the string `"[object Object]"`.

This would yield us the following letters (case-sensitive): `a b c d e f i j I l n N o O r s t u y`, the space and the digits `0 1 2 3 4 5 6 7 8 9`. We have syntax to form the hexadecimal alphabet as well as a number of uppercase and lowercase letters.

The space, the only non-alphanumeric and non-symbol character, is assigned the property `-`.

The digits have keys defined as binary, where `_` is digit `0` and `$` is digit 1, padded to length 3, as `__`, `_$`, `$_` and `$$` have keys defined. So `___` is `0` and `__$` is `1`.

The letters are encoded as a pair of characters. The first `_` or `$` defines its case and the second a symbol, each unique to a letter in the English alphabet, minus the three pairs of brackets `()[]{}`. The most common letters in English, `t` and `e` get the characters which form identifiers, `_` and `$`, while the least common, `j`, `q`, `x` get the quote characters, while `z` gets the backslash.

### Statement 3 and 4

From the third line, we will use the letters we have formed to begin forming the names of properties in our expressions, by concatenating them with the `+` operator. We form the words `concat`, `join`, `slice`, `return`, `constructor`, `filter`, `flat` and `source`, each assigning then single or double character keys.

`[]` can be used to access properties on values, and by extension, to call methods on them. For instance, `[]['flat']()` is semantically equivalent to `[].flat()`.

We can now access the constructors, with the `constructor` property of literals. like `Array` `[]`, `String` `''`, `Number` `+[]`, `Boolean` `![]`, `RegExp` `/./` and `Function` `()=>{}` (leaving out `Object`), and like what we did before, casting that constructor function into a string. This yields a string like `function Array { [native code] }`, when evaluated in a JavaScript interpreter. We now have the letters `A B E F g m p R S v x`. The only letter not present in any of the constructor names is `v`, which is from the word `native`.

Now we have 22 lowercase `a b c d e f g i j l m n o p r s t u v x y` and 9 uppercase letters `A B E F I N O R S`. And just like before, we store every word and letter we have formed with a unique key, for reference later in our code.

We use the spread operator, `...` to "spread out" its properties on a new object, in this case, itself, before reassigning it to itself.

In statement 4, by concatenating the letters, we form the method names `map`, `replace`, `repeat`, `split`, `indexOf`, `entries`, `fromEntries`, and `reverse`.

### Statement 5 and beyond

In statement 5, we are more or less done, but there are still some things left. We are going to get the following letters: `h k q w z C D U`, make the strings `toString`, `fromCharCode`, `keys`, `raw`, and `toUpperCase`, and retrieve the functions `Date, BigInt`, `eval`, `escape` and `parseInt`.

`toString` is formed by concatenating the letters `t` and `o`, and then retrieving the string `"String"` from the `String` constructor, by accessing its `name` property. With `toString` formed, we can retrieve the rest of the lowercase alphabet, `h k q w z`, by passing a number in base 36, to yield a letter in lowercase.

Using the `Function` constructor, we can trigger execution of code contained in a string as if it was native JavaScript code. So with an expression like `Function('return eval')`, we can return several important global functions, such as `eval`, `escape` and `parseInt`.

The letters `C` and `D` are created by indexing a URL with an invalid character like `<` or `=` with the `escape` function which always yields its code points in uppercase.

Uppercase `U` is created from the expression `` `${{}.constructor.toString.call()}` `` which evaluates to the string `[object Undefined]`.

Both `eval` and `fromCharCode` allows us to form Unicode strings. `fromCharCode` generates a string from its code points, while `eval` generates a string from its escape sequence. `parseInt` enables numbers to be parsed in bases other than 10.

The `String.raw` method when used on a template literal ignores all escape sequences, so backslashes are now interpreted as they are without getting "deleted" by the parser.

> This depends entirely on engine and locale so this feature is considered experimental. The additional characters `G M T J W Z` can be retrieved with the `Date` constructor:
>
> - The letters `G M T` are formed by converting a new instance of `Date`, i.e. `new Date()`, and calling `toString()`. This yields a string of the form `Thu Jan 01 1970 07:30:00 GMT+0XXX (Local Time)`.
> - `Z` comes from `new Date().toISOString()` which evaluates to a string of the form `1970-01-01T00:00:00.000Z`. `Z` in this case represents zero UTC offset.
> - Passing these arguments to the `Date` constructor, in a specific order, retrieves `J` and `W`: `Jan` - `0`, `Wed` - `0,0,3`.

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
  reverse: '"',

  // statement 6: constructors
  // 'to' + String.constructor.name
  // C, D (from 'escape')
  toString: "'",

  // statement 7: global functions
  eval: "=",
  escape: ">",
  parseInt: "~",

  // statement 8: toString, escape and call
  // h k q w z U

  // statement 9
  fromCharCode: "@",
  keys: "&",
  raw: "`",
  toUpperCase: ".",
}
```

### Encoding

The program has several encoding functions, and the decoding function with two parameters: the encoded substring itself, which mode to decode to, and a character set to use, encoded. All of the encoded strings will pass through this function, some which will be stored in the global object if the substring occurs more than once, or the substring is unique enough to be stored, based on its Jaro distance with other strings.

Much of the encoding is done piecewise, so there has to be a way to encode the string, and then get back what we encoded, and for every piece of the string to be accounted for and assembled in the correct order. So, there is a lot of working backwards and reverse engineering to find out which operations retrieve which results.

A generator function yields us every possible string with those same 32 characters (skipping the keys already defined) since each arbitrary string formed from a finite set of characters corresponds to a natural number. This is called _bijective numeration_, the word _bijective_ meaning a one-on-one correspondence.

#### Similar strings

Because we have string methods already, i.e. `join`, `slice`, `replace`, `repeat`, `split`, we can employ algorithms to help us produce these strings, because the goal of this program is to minimize repetition. We would therefore have to work backwards from there.

Sometimes, the program does not encode specific substrings as we either have formed them letter by letter and stored them in the global object, or are created magically by manipulating primitive values, as we have explored in the above, such as `function`, `Array`, `undefined`, `object` and more.

- The `slice` returns consecutive characters within a substring by specifying the start and end indices of the substring, such as `rep` or `ace` from `replace`.
- The `repeat` method can be used to repeat a "factored" substring a given number of times. This would also use a regular expression to determine the shortest pattern within the substring and how much it is repeated.
- The `join` method, along with `split`, is used to join an array of "strings" with a delimiter that is also a string. We would employ regular expressions to determine the optimal substring to delimit a given set of text (it may not be spaces after all).
- The `replace` method is used to replace one or all substrings of a substring, through insertion, deletion or substitution to turn it into something similar. We would use a string difference checker.

Only a subset of encoded substrings will be formed from this step. The rest are stored in later statements, but before compilation, the compiler would build a derivation tree from the substrings it has captured from the input string.

The stems are either non-string values cast into strings, or strings we have already defined. Each branch represents a string in the output text generated from any of the operations above. If the stem does not contain a sequence present in the output text, it will be stored in the global object as an encoded string.

The compiler would do a depth first travel of this tree and generates statements that map to the stored values. Assignment is destructive.

Assignment _expressions_ are also allowed and return their result, so a statement like `x={x:x.y=1}` assigns two properties `x.x` and `x.y` which both equal `1`; `x.y` is assigned before `x.x`, because expressions are evaluated from the inside.

#### Symbols

We all know that we can represent sequences of symbols literally as strings without us performing any encoding, or storing in the global object to be decoded or derived. However, there is one additional optimization we can use: minimizing backslashes.

If the substring contains many backslashes, then there are two other options for representing that string: using the `String.raw` function, or from a `RegExp` literal delimited with slashes when calling `toString`, or without, from the `source` property. However some strings when interpreted literally result in a syntax error, so the compiler represents them with the escapes.

#### Integers

From here on out, we would primarily use big integers, or the new primitive data type added in ES8, `BigInt` as an intermediate data type to store most of our strings. Many of the encoding methods use bijective encoding, due to the fact that any arbitrary sequence of digits from a given set has a single numeric representation.

Numeric-only substrings are encoded as bijective base 32 using all the 32 characters. Zero padding is done as an additional step, for substrings with leading zeroes.

#### Alphanumeric substrings

Alphanumeric substrings follow the same rules as numbers, except this time the substring is parsed as a number with a base higher than 10, depending on the position of the last letter in the substring. This number is encoded as bijective base 32.

By default, `toString()` yields lowercase. So if the original substring contains uppercase letters, then the positions of those characters in the substring will be converted into uppercase using compressed ranges. If the entire string is uppercase, then the string would be converted directly into uppercase.

#### Words with diacritics

For multilingual texts that use the Latin alphabet, along with a number of non-ASCII letters embedded inside. The initial substring is stripped of these non-ASCII characters and then encoded as a big integer (see above section). The non-ASCII characters are stored and encoded at the end of the string. Each insertion point consists of a substring and an insertion index. No Unicode normalization is performed, even if part of the encoding or decoding process.

#### Other writing systems and languages

For substrings of a different Unicode script other than Latin, they are generated from a pool of characters from the script. The result is encoded as bijective base 32, using the pool of characters into a big integer, or in the case of extremely long words or CJK text, _arrays_ of big integers.

For bicameral scripts like Cyrillic, Greek, Armenian and Georgian, the substring is encoded initially as lowercase and then a separate procedure converts selected characters into uppercase based on the input string.

#### Arbitrary Unicode sequences

For other Unicode characters, including CJK, special, private-use, non-printable and spacing characters, and even astral code points, they are converted from their hexadecimal values and grouped into smaller subsequences based on their leading digits. All leading zeroes are stripped when encoded and added back when decoded.

This yields pairs of symbol sequences: the "keys" being the leading and the "values" being the trailing digits that are not encoded. Both key and value pairs are converted from bijective base 16 into bijective base 30. `,` and `:` are reserved for separating keys and values.
