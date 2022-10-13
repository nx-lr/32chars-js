# 32chars.js

Punctuation-Only JavaScript

## About

32chars.js is a JavaScript code encoder that outputs JavaScript code or any piece of text into the shortest possible valid JavaScript code made with only 32 ASCII symbol and punctuation characters; no letters, numbers, spaces, or special characters: `` `~!@#$%^&*()_+{}|:"<>?-=[]\;',./ ``.

This project is the spiritual successor to many JavaScript code obfuscators out there such as JSF\*ck, XChars.js and Hieroglyphy, but is most influenced by the first, JJEncode.

## History

JavaScript is weird. And one thing people _really_ hate about JavaScript is because of the way it evaluates expressions. And because of this, people have tried many ways to "exploit" this very "flaw" of JavaScript, which gave rise to "compilers" obfuscating JavaScript using only punctuation characters.

The first such compiler was jjencode, which came out in Jul 2009, using 18 characters: `[]()!+,\"$.:;_{}~=`. A few months later in Jan 2010, an informal competition was held in the Slackers forum, bringing down the minimum number of characters to eight `[]()!+,/`. Soon enough, contributors managed to remove the need for the characters `,/`, thus bringing the minimum to 6 `[]()!+`.

These encoders follow a pattern, first creating single digits by repeatedly adding 1, or concatenating digits to form higher numbers. Next, they evaluate an expression using said characters, converting them into strings and accessing a character with an index. This process is then repeated to yield new letters until a more general method of retrieving unmapped characters is found, such as `eval` or `String.fromCharCode`.

It is because of this repetition that certain single characters require more than a thousand characters when expanded. However, we will take a step back and look on the other side of things: what if there was an encoder that does the same thing as all this: obfuscating code with only symbols; but achieves the minimum code length possible?

## How it works, roughly

### Key differences

Going over each character one by one is overly lengthy and repetitive, thus going against encoding. It is shorter and faster to break down the string into smaller, digestible pieces and doing different things to each one. This way we can effectively minimize the number of operations for the JavaScript engine, and also the overall length of the output code.

That's why 32chars.js stands out from other encoders. It has a large character set, so that means we have syntax to form literal strings. But we _can_ use the latest JavaScript syntax and functionality; this means tons of new and nifty ways to represent, encode and create these strings:

- Template strings
- String interpolation
- Arrow functions
- RegExp literals
- `BigInt` literals
- ES6 `String`, `Array` and `Object` methods

Because of the sheer number of ways that we can create and manipulate strings in JavaScript, its compiler has hundreds if not thousands of lines. Compilation takes somewhat a long time for a huge body of plain text, such as a piece of minified source code or a novel.

### Initialization

The program uses a multi-phase substitution encoding. Characters and values are assigned to variables and properties, which then are referenced and used to build back the input string. Some strings are "edge cases" and hence require nifty hacks along the way.

### The basics

The text is parsed and categorized into tokens. But unlike a regular compiler that takes _source code_ and compiles it into _machine code_ following a strict _grammar_, this is an _encoder_ that takes _plain text_ and compiles it into _obfuscated source code_ following specific _encoding or encoding rules_.

The text is recursively parsed into tokens: symbols (using the 32 characters), integers, ASCII alphanumerics (base62), words with diacritics, non-Latin writing systems, and Unicode or astral characters. Astral characters are Unicode characters with code point U+10000 and above, after the Basic Multilingual Plane.

### Symbol sequences and string literals

We have syntax to form strings. String literals in JavaScript can be created in three ways: single and double quoted strings, which are roughly equivalent, and template strings, which allows interpolation of values. In this context, strings are _very fundamental_ to obfuscation, so we are free to create our own encoding/decoding schemes.

In the output string, substrings with only printable ASCII symbols are quoted into string literals. Usually the runs do not contain any of the quote characters `` ' " ` ``. The backslash `\`, and whatever symbol is being used for wrapping these literals, are escaped. In template literals, the sequence `${`, which normally begins an interpolation sequence, is also escaped.

Each encoded substring in the output goes through a quoting function (`jsesc` library) which compares the lengths of the escaped substring and selects the string literal with the least number of escapes, in that case being the shortest. It also prioritizes a fallback quoting option for strings without escapes.

### Parsing the input string

By default, the parser would split the entire text with the space ` ` as its delimiter, with the split elements going into an array and separated with commas. JavaScript ignores trailing commas, and so we have to explicitly add a trailing comma if the final element of the output array is empty.

The input string is further subdivided and categorized into substrings of different character types, as described in the sections below. Some of these variable-length substrings would be stored inside the global object later on, if they repeat.

### Initialization: statement 1

JavaScript variable names are flexible in the characters that can be used, so the above variable name of `$` is valid. So is `_`.

Unlike a number of other languages, such as Python, PHP and Perl, the dollar sign is not a reserved character and therefore able to be used in any part of the variable name. This allows variables to e formed with any combination of `_` and `$` characters, such as `$_`, `$$$`, and `_$_`.

Because you want to sound hip, yes, the dollar sign can be used in variables. `Ke$ha` and `A$AP_Rocky` are valid JavaScript identifier.

The program starts out by assigning a global variable `$` with the value of `~[]`. The tilde, `~` indicates a unary bitwise NOT operation on an empty array which is numerically equivalent to `0`. This evaluates to `-1`.

This line, ignoring the global variable, is exactly the same as in JJEncode. The second line shares a similar concept to it.

### Initialization: statement 2

The next statement is significantly longer than the first. `$` is then reassigned to a JavaScript object. Properties are defined within the braces in the form `key: value`, and individual properties are separated by commas. JavaScript defines object keys in three different ways

JavaScript defines object keys in three different ways: _identifiers_ which are any combination of (Unicode) letters, decimal numbers, underscores and dollar signs, _strings_ encased inside single or double quotes, and _expressions_ inside square brackets, like `['fo'+'r']`. Property access is done either with dots, like `x.for`, or square brackets `x['for']`. Note, the last 2 are the same.

The first property is `___`, three underscores. The value of this property is `` `${++$}` ``, which takes the value of `$` (currently `-1`), increments it (to `0`), and then assigns it to the property. So, in this statement, `$` is incremented by one to `0`, converted into a string by wrapping the expression inside a template literal `` `${}` ``, and then assigned to `$.___`. Note that since the object is still being built, `$` is still a number and not an object yet.

The second property is `$$$$`. The value of this property is `` `${![]}`[$] ``. The first part of this is an array prepended with a logical NOT `!` operator, which turns into the Boolean value `false`—`!{}` also yields the same result since it, just like an array, is a non-primitive and hence yields true when converted into a boolean. Wrapping it inside an template literal turns the evaluated result into a string, therefore it evaluates to `"false"`.

There is a `[$]` after the string `"false"`. In JavaScript, a letter of a string can be obtained by specifying the index of the character within brackets (string indices start at `0`). Here, `$` currently evaluates to `0`, so this line is asking for the character at position `0` in the string `"false"`, or `"f"`.

The rest of the object properties are constructed in a similar fashion: incrementing the `$` variable, constructing a string, and grabbing a character out of the string by specifying its index. These are the only times that the global variable is a number and not an object.

So, using type coercion, we manipulate literals to evaluate to constants like `true`, `false`, `Infinity`, `NaN`, `undefined`, and an empty object `{}` which becomes the string `"[object Object]"`. There's so many ways that we can form these constants, without having to type a single letter, and that's the beauty of JavaScript.

This would yield us the following letters (case-sensitive): `a b c d e f i j I l n N o O r s t u y`, the space and the digits `0` to `9`. Based on the output we have a cipher to store our characters. We have the hexadecimal alphabet for use in the later substitutions.

The letters have two characters, the first `_` or `$` defines its case and the second an arbitrary symbol, each unique to a letter in the English alphabet, minus the three pairs of brackets `()[]{}`.

The digits have keys defined as binary, ciphered with combinations of `_` (digit 0) and `$` (digit 1), then padded to length 3 or 4, so `0` is `___`, `4` is `$__` and `9` is `$__$`. The space, the only non-alphanumeric and non-symbol character, is assigned the property `-`.

### Initialization: statement 3

From the third line, we will use the letters we have got to form new words by concatenating existing single case sensitive letters with the `+` operator to form property names as strings. These words, when inserted inside square brackets, are then used to access properties on values or call methods on them. For instance `{}["constructor"]`.

With the `constructor` property, we can access the constructors of literals, like `Array` `[]`, `String` `''`, `Number` `+[]`, `Boolean` `![]`, `RegExp` `/./` and `Function` `()=>{}` (leaving out `Object`), and like what we did before, converting that constructor function into a string. This yields something like `function Array { [native code] }`, where when evaluated in a JavaScript interpreter. We now have the letters `A B E F g m p R S v x`.

In total, this yields us with 22 lowercase `a b c d e f g i j l m n o p r s t u v x y` and 9 uppercase letters `A B E F I N O R S`. We make sure to store every word and letter we have found with a unique key so that we can refer to it later on in our code.

To save up on statements, we use the spread operator `...` to "spread out". In this case, we are cloning the object by spreading out its properties on a _new_ object with new keys defined, before reassigning that object back to itself.

### Initialization: statement 4 and beyond

We repeat statement 2 and 3 again this time with the new letters we have gotten in those steps:

- Evaluating expressions to get a value
- Casting the result into a string
- Indexing with a number to get a new letter
- Shadow-cloning and then allocating new letters on the object
- Forming property names by concatenating individual letters
- Storing those property names as strings in the global object

But we can take shortcuts rather than having to form strings letter by letter, such as in `toString`, formed from concatenating the string `t` and `o`, and then the `name` property on the `String` constructor which yields `'String'`. With this method, we can retrieve five more lowercase letters `h k q w z` by passing a small number in base 36 and calling the `toString` methods which always yields the higher alphabetic digits in lowercase.

Two more uppercase letters `C` and `D` are created by indexing a URL with an invalid character like `<` or `=` with the `escape` function which always yields its code points in uppercase. Uppercase `U` is created from the `` `${{}.constructor.toString.call()}` `` which evaluates to the string `[object Undefined]`.

We now have the entire lowercase alphabet, and forming the word `toUpperCase` we can now form the rest of the other 14 uppercase letters from the lowercase, or even capitalize multiple lowercase letters into uppercase this way, because `toString` yields numbers in higher bases as lowercase.

`fromCharCode` allows us to form Unicode strings in another way other than `eval`, and when combined with `map`, `split` and `join` allows us to encode arbitrary Unicode strings using _some_ combinations of all 32 characters on the fly.

The lowercase `w` is also used to form the word `raw` in `String.raw` which allows us to express strings verbatim without interpreting escape sequences, as long as it does not break JavaScript's template literal ` `` ` and interpolation `${ }` syntax.

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

A generator function yields us every possible string with those same 32 characters (skipping the keys already defined) since each arbitrary string formed from a finite set of characters corresponds to a natural number. This is called _bijective numeration_, the word _bijective_ meaning a one-on-one correspondence.

#### Similar strings

Because we have string methods already, i.e. `join`, `slice`, `replace`, `repeat`, `split`, we can employ algorithms to help us produce these strings, because the goal of this program is to minimize repetition. We would therefore have to work backwards from there.

Sometimes, the program does not encode specific substrings as we either have formed them letter by letter and stored them in the global object, or are created magically by manipulating primitive values, as we have explored in the above, such as `function`, `Array`, `undefined`, `object` and more.

- The `slice` returns consecutive characters within a substring by specifying the start and end indices of the substring, such as `lace` from `replace`.
- The `repeat` method can be used to repeat a "factored" substring a given number of times.
- The `join` method, along with `split` is used to join an array of "strings" with a delimiter that is also a string. We would employ regular expressions to determine the optimal substring to delimit a given set of text (it may not be spaces after all).
- The `replace` method is used to replace one or all substrings of a substring, through insertion, deletion or substitution to turn it into something similar. We would use a string difference checker.

The encoder would store all these substrings as a tree. The stems are either non-string values cast into strings, or strings we have already defined. Each branch represents a string in the output text generated from any of the operations above. If the stem does not contain a sequence present in the output text, it will be stored in the global object as an encoded string.

Next, the compiler would do a depth first search of the words in the input text and generates statements that map to the stored values. Assignment statements are allowed since they also are expressions, and evaluate to their right hand side. This way, we can assign more than one new key to the global object.

Only a subset of encoded substrings will be formed from this step.

#### Symbols

We all know that we can represent sequences of symbols literally as strings without us performing any encoding. However, there is one additional optimization we can use: minimizing backslashes.

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

For substrings of a different Unicode script other than Latin, they are generated from a pool of characters from the script. The result is encoded as bijective base 32, using the pool of characters into a big integer, or in the case of extremely long words or CJK text, arrays of big integers.

For bicameral scripts like Cyrillic, Greek and Armenian, the result is encoded initially as lowercase and then a separate procedure converts selected characters into uppercase based on the input string.

#### Arbitrary Unicode sequences

For other Unicode characters, including CJK, special, private-use, non-printable and spacing characters, and even astral code points, they are converted from their hexadecimal values and grouped into smaller subsequences based on their leading digits. All leading zeroes are stripped when encoded and added back when decoded.

This would yield values on two sides: the "keys" being the leading and the "values" being the trailing digits that are not encoded. Both key and value pairs are converted from bijective base 16 into bijective base 30. `,` and `:` are reserved for separating keys and values.

## Disclaimer

Only obfuscate things that belong to you. This repository and its command line program, and the code shall not be used for any malicious purpose whatsoever. **I AM NOT RESPONSIBLE FOR ANY DAMAGE CAUSED BY THE PROGRAM NOR THE GENERATED CODE.**
