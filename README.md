# 32chars.js

## Disclaimer

This program is meant to be used for experimental purposes: for hashing and encoding text and code to protect private work. **This program shall not be used for malicious purposes, I do not hold any responsibility for any damage caused.**

## Introduction

32chars.js is a JavaScript encoder that encodes and obfuscates a piece of text into the shortest possible valid JavaScript code with only 32 ASCII symbol characters: `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ``.

This project is a testament to the many existing JavaScript encoders out there, and the spiritual successor to the original, [jjencode](https://utf-8.jp/public/jjencode.html).

## Background

JavaScript is a programming language with many weird and complicated parts. Aside from its popularity, one can write programs without any letters or numbers, and to an extreme, only [five](https://aem1k.com/five/) or [six](http://www.jsfuck.com/) possible symbols. These compilers output _extremely verbose_ code, where a single character may expand to thousands.

Program code contains a wide variety of letters, numbers, symbols, and spaces, making code terser, parsable and readable. This project aims to output code that still does not contain any letters or numbers, but with still enough characters to produce a minimal output. There are 32 ASCII symbol characters, most of them being valid JavaScript tokens.

Rather than encoding every character in the input string one by one, we break the string into runs that have a length of at least one character. This way, we effectively minimize the amount of operations performed by the JavaScript engine, while keeping the overall output short.

The compiler encodes the string piece by piece. Parts of the input string which are combinations of those 32 characters remain untouched. It works backward, determining which JavaScript's built-in operations produce the original string.

## Explanation

With a large character set, most of these symbols also are valid JavaScript tokens. The most significant of them are:

- `'`, `"` and `` ` `` delimit strings. The backtick `` ` `` delimits template strings, which allow for interpolation and tagged function calls
- Combinations of `_` and `$` to form variables and identifiers
- `+` to concatenate strings, add numbers and cast things into numbers
- Arithmetic `+ - * / % **` and bitwise `& | ^ ~ << >> >>>` operators with a `Number` and `BigInt` on either side
- `.` to access properties of objects
- `,` to delimit array, object, and function elements
- `()` to call functions and group expressions
- `[]` to access array and object elements and create array literals
- `{}` to delimit object literals and code blocks
- `${}` to interpolate expressions in template strings
- `/` to delimit regular expression literals

We have syntax to form strings. Strings are very fundamental to obfuscation, as we can store and hash custom data. However, there are many other ways to create strings, using JavaScript's newest syntax and functionality: `RegExp` and `BigInt` data types, and many new `String`, `Array`, and `Object` methods.

The compiler uses a two-step substitution encoding. First, characters and functions are assigned to variables and properties with programmatically generated keys, These are then decoded through these operations, and used either to construct new substrings or build back the original string.

There are of course edge cases. Some expressions innately produce strings: constants (e.g. `true`, `false`, `0`), string tags (e.g. `[object Object]`), date strings (e.g. `2011-10-05T14:48:00.000Z`) and source code (e.g. `function Array() { [native code] }`).

The compiler parses the text into categorical tokens depending on the type of character. This includes ASCII punctuation, digits and letters, words with diacritics, non-Latin scripts, and Unicode code points.

JavaScript stores strings as **UTF-16**, so all BMP characters, code points `U+0000` to `U+FFFF` are encoded as _two_ bytes while the rest are encoded as _four_.

The text is split by a delimiter such as a space, or the most common substring which the compiler detects. The split elements go into an array and delimited with commas. There could be empty array slots, so nothing goes in between the commas. Unfortunately, JavaScript ignores trailing commas, so we have to explicitly add trailing comma if the final element of an output array is empty.

### Quoting string literals

We create string literals in JavaScript in three ways: single-quoted `''`, double-quoted `""` and _template_ (backtick) strings ` `` `. Both single and double-quoted strings are functionally the same. Template strings allow for interpolating values with the `${}` syntax. In the output, we quote sequences of ASCII symbols directly as they are in any of these three quotes.

Usually, the runs do not contain any of the quote characters `` ' " ` ``, or the backslash `\`, so any type of quote would do without escapes. If any of these above-mentioned characters are present, then the backslash, and the corresponding quote character is escaped, by prefixing it with a backslash (like `'\\'`), preventing the string from abruptly ending.

In template literals delimited with backticks `` ` ``, the sequence `${`, which begins interpolation, is also escaped to avoid opening interpolation.

Each substring in the output goes through a quoting function, and calls `jsesc` on each. The number of escapes in all the three strings are counted, and the string literal with the least number of escapes is selected. In most cases where there are no escapes, the compiler just falls back cycling between the three delimiters.

The rules for quoting object keys are different: backtick-delimited strings cannot be used, as they throw a syntax error; string keys which are valid identifiers, i.e. combinations of `_` and `$`, do not need to be quoted.

### Statement 1

The symbols `_` and `$` are valid JavaScript identifier characters, so we can use combinations of those two to form variables. One of them `$`, stores and references values and substrings, and the other, `_`, represents the actual string being reconstructed.

`$` starts with the value of `-1`, by doing a bitwise NOT on an empty array: `~[]`. An empty array, or implicitly, a _string_, is `0`, so the expression `~0` evaluates to `-1`.

### Statement 2

In the following statement, we assign `$` to an object literal in curly braces `{}`. We define properties inside the braces in the form `key: value`, and separate _key-value pairs_ or _properties_ with commas.

JavaScript has three different ways to represent keys: _identifiers_ (which can be keywords) _without quotes_ like `key:value`, _strings_ within _single or double quotes_ like `'key':value`, and _dynamic expressions_ within _square brackets_ `['key']:value`. In addition, we can access object properties with dots, like `x.key`, or square brackets, like `x['key']`.

Strings and arrays can be indexed, each character within the string or element of an array has an index starting from `0`. The first element or character has an index of `0`, the second `1`, and so on until the end of the string or array, with 1 less than its length. Because each index is a _property_ of the string or array, `'string'[5]` yields the character `'g'`.

The first property of `$` is `___`, with a value of `` `${++$}` ``. This takes the value of `$`, currently `-1`, and increments it to `0`, then casts that into a string by interpolating it inside a template literal, implicitly calling the method `.toString()`. While the object is still being built, `$` is still a number and not an object yet, since evaluation happens outward.

The second property is `$__$`, with a value of `` `${!''}`[$] ``. An empty string is prepended with the logical NOT operator `!`, which coerces it into `false` as it is considered _falsy_ in JavaScript. `!` also negates the boolean, becoming `true`. The expression is wrapped a template literal interpolation, turning it into a string `"true"`. The `[$]` construct at the end returns the character at index `0` (string indices start at `0`), which returns `t`.

We repeat the above steps: incrementing the `$` variable, constructing a string, and grabbing a character out of the string by specifying its index. Next, we manipulate literals to evaluate to form the constants, `true`, `false`, `Infinity`, `NaN`, `undefined`, and an empty object `{}` which becomes the _string tag_ `'[object Object]'`.

The constants yield the following letters (case-sensitive): `a b c d e f i j I l n N o O r s t u y`, the space and the digits `0` to `9`. We now have the hexadecimal alphabet and several other uppercase and lowercase letters.

We cipher the numbers in binary, substituting `_` for digit `0` and `$` for digit `1`. Then we pad the result to a length of 3 by adding `_` (as `__`, `_$`, `$_` and `$$` have keys defined). So `___` is `0` and `__$` is `1`.

We cipher the letters as a pair of characters. The first `_` or `$` defines its case, and the second a symbol, each unique to a letter in the English alphabet, minus the bracket pairs `()[]{}`. The most common letters in English, `e` and `t` get the characters which form identifiers, `_` and `$`. The least common, `j`, `q`, `x` get the quote characters, and `z` gets the backslash.

The space is assigned the key `-`.

### Statement 3 and 4

From the third line, we use the letters we have retrieved to form the names of properties in our expressions by concatenating them letter by letter with the `+` operator. We form the words `concat`, `return`, `slice`, `sort`, `join`, `filter`, `source`, and the keywords `for` and `if`.

`[]` can also be used to call methods on values. For instance, `[]['flat']()` is semantically equivalent to `[].flat()`.

We can now access the constructors with the `constructor` property of "empty" literals or expressions: `Array` (`[]`), `String` (`''`), `Number` (`+[]`), `Boolean` (`![]`), `RegExp` (`/./`), and `Function` (`()=>{}`) (leaving out `Object`), and like before, casting that constructor function into a string.

There are many ways to produce these literals, and only the ones with the minimum length are selected. These expressions are encoded inside a regular expression and then expanded at runtime with the `genex` library. Every time a literal or sub-expression of this type is expected, the compiler cycles through them.

When evaluated in a JavaScript interpreter, the constructor yields a string like `function Array { [native code] }`. We now have the letters `A B E F g m p R S v x`. The only letter not present in any of the constructor names is `v`, which is from the word `native`.

Now we have 22 lowercase `a b c d e f g i j l m n o p r s t u v x y` and 9 uppercase letters `A B E F I N O R S`. Furthermore, like before, we store every word and letter we have formed with a unique key for reference later in our code.

In the next statement, we form the method names `indexOf`, `map`, `name`, `repeat`, `replace`, `reverse`, `split`, the constructor functions `BigInt` and `Set`, and the keyword `var`.

We use the spread operator, `...`, to "spread out" its properties on a new object. In this case we are cloning the object and then spreading it out along with new properties. This saves up on having to assign every single property on the object, one by one. This saves having to repeat the global variable every time.

### Statement 5 and beyond

We retrieve the following letters: `h k q w z C D U` (and additionally `G J M T W Z`), make the strings `toString`, `keys`, `length`, `raw` and `toUpperCase`, and the keyword `new`. Initiating a `Set` must have the `new` keyword, otherwise JavaScript throws an exception.

`toString` is formed by concatenating the letters `t` and `o`, and then retrieving the string `'String'` from the `String` constructor, by accessing its `name` property. With `toString`, we can retrieve the rest of the lowercase alphabet, `h k q w z`.

We assign these properties through array destructuring. The right hand side is the values we need to convert, and an anonymous `map` function which transforms all the values inside the array. In this case, we are converting strings from base 10 to 36, to yield a single digit that corresponds to the letter in question.

In this case, for base above 10, the letters of the alphabet indicate digits greater than 9. For example, for hexadecimal numbers (base 16) `a` through `f` are used.

With the `Function` constructor, we can execute code contained inside a string as native JavaScript. For example, with an expression such as `Function('return eval')`, we retrieve the builtin functions `eval`, `escape`.

The letters `C` (from `<` or `%3C`) and D (from `=` or `%3D`) and `D` come from indexing the last hexadecimal digit from a URL string. All characters that are not an ASCII letter, number, or one of the symbols `-`, `_`, `.`, and `~`, are percent-encoded, into a form `%XX` or `%uXXXX` for higher code points, where X is an _uppercase_ hexadecimal digit.

The expression `{}.toString.call().toString()`, or `` `${{}.toString.call()}` `` evaluates to the string `'[object Undefined]'` which yields us the character `U`.

Both `eval` and `fromCodePoint` allows us to form Unicode strings. `fromCodePoint` generates a string from its code points. In contrast, `eval` generates a string from its escape sequence.

When used on a template literal, the `String.raw` method ignores all escape sequences, so backslashes are now interpreted as they are without getting "deleted" by the parser.

---

This depends entirely on the current locale and JavaScript engine so this feature is considered _experimental_. The additional letters `G M T J W Z` can be retrieved with the `Date` constructor:

- The letters `G M T` is formed from the expression `new Date().toString()`. This yields a string of the form `Thu Jan 01 1970 07:30:00 GMT+0XXX (Local Standard Time)`.
- `Z` comes from `new Date().toISOString()` which evaluates to a string of the form `1970-01-01T00:00:00.000Z`. `Z` in this case represents zero UTC offset.
- Passing these arguments to the `Date` constructor, in a specific order, retrieves `J` and `W`: `Jan` - `0`, `Wed` - `0,0,3`.

```js
const props = {
  // statement 2: constants
  // 0 1 2 3 4 5 6 7 8 9
  // a b c d e f i j I l n N o O r s t u y [space]
  space: "-",

  // statement 3
  constructor: "$",
  return: "_",
  slice: "/",
  sort: ">",
  join: "+",
  filter: "%",

  for: "*_",
  if: "!_",

  // statement 4: constructors
  // A B E F g m p R S v x

  // statement 5
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

  // statement 6: constructors
  // 'to' + String.constructor.name
  // C, D (from 'escape')
  toString: "'",

  // statement 7: global functions
  escape: "\\",
  eval: "=",

  // statement 8: toString, escape and call
  // h k q w z U

  // statement 9
  keys: "&",
  length: ":",
  raw: "`",
  toUpperCase: "@",

  new: "+_",
}
```

### Encoding functions

The output ships with several functions, defined with the keys `0`, `-1`, `true` and `false`. These functions exist in the compiler. Since functions when converted into strings with the `.toString()` method yields the source code of the function itself, we can manipulate the source code before including them in the output.

**UglifyJS** parses the source code and returns a _minified_ version of the function code, with short variable names and compressed values, expressions and constructs. Since we are minimizing the number of letters and numbers in the compressed code, we have to perform more transformations to the minified source code.

Using regular expressions, we convert the function into arrow function form `()=>{}` and all the variables and arguments converted into combinations of `_` and `$` characters. The letters and numbers in the compressed code are then substituted with the appropriate substring if they have been defined, or spelled out entirely. Calls to other functions are substituted with the appropriate property of `$` and embedded inside the string. Symbols remain untouched and are thus quoted.

The substituted function string is passed into the `eval` function, thus evaluating it to an anonymous function which is assigned its alias.

###assert Similar strings

Using various string methods, we can employ algorithms to produce similar strings, so to minimize the number of values that need to be encoded. Some substrings manipulating primitive values like `'function'`, `'Array'`, `'undefined'`, `'object'`, so we can derive substrings from those.

- The `slice` returns consecutive characters within a substring by specifying a start and optional end index, for instance, `'fin'` and `'fine'` from `'undefined'`.
- The `repeat` method repeats a substring. We use a regular expression to determine the shortest pattern within the substring and how much it repeats.
- The `split` and `'join'` method is used to join an array of "strings" with a string as its delimiter. Then, using regular expressions, we determine the optimal substring to delimit, then we recursively split and hash both the substrings and the delimiter.
- The `replace` method is used to replace one or all substrings of a substring through insertion, deletion, or substitution to turn it into something similar. We would use a string difference checker.

We divide the substring into n-grams and determine which substrings could be derived from all the non-symbol characters in the file. he compiler builds a list of all these substrings, and stores them in the global object in a separate statement should they appear in the input more than once.

### Bijective numeration

There are four aliased functions encoded inside the output: `encodeBijective`, aliased `0`, `decodeBijective`, aliased `-1`, `compressRange`, aliased `false` and `expandRange` aliased `true`. All these functions rely on [bijective numeration](https://en.wikipedia.org/wiki/Bijective_numeration), where every possible substring from a set of characters (or digits) corresponds to a natural number.

```js
const functionAliases = {
  encodeBijective: "+[]", // 0
  decodeBijective: "~[]", // -1
  compressRange: "![]", // false
  expandRange: "!''", // true
}
```

- `encodeBijective` takes a BigInt and a set of characters as its arguments, and encodes the BigInt in bijective base-_k_, returning a string.
- `decodeBijective` does the opposite of the above, returning a BigInt from a string and a set of characters.
- `compressRange` takes a string, a set of encoding characters, and a custom delimiter for values and ranges. It returns all the code points of that string, each encoded with `encodeBijective`.
- `expandRange` does the opposite of the above, returning back the raw characters with their code points in ascending order.

The following is the source code of these functions:

<!-- prettier-ignore -->
```js
const encodeBijective=(n,e)=>{e=[...new Set(e)];var t=BigInt,r=t(e.length),i=e[((n=t(n))%r||r)-1n];if(n<=0n)return"";for(;0n<(n=(n-1n)/r);)i=e[(n%r||r)-1n]+i;return i}
const decodeBijective=(e,n)=>{n=[...new Set(n)],e=[...e];for(var t=BigInt,i=0n,r=t(n.length),c=e.length,d=0;d<c;d++)i+=t(n.indexOf(e[d])+1)*r**t(c-d-1);return i}
const compressRange=(e,n,t=",",o=".")=>{return n=[...new Set(n)].filter(e=>e!=t&&e!=o).join``,[...new Set(e)].map(e=>e.codePointAt()).sort((e,n)=>e-n).reduce((e,n,t,o)=>{var r=o[t-1],i=n-r;return 0<t&&i==r-o[t-2]?(e[r=e.length-1][1]=n,1<i&&(e[r][2]=i)):e.push([n]),e},[]).map(e=>e.map(e=>encodeBijective(e,n)).join(o)).join(t)}
const expandRange=(t,e,n=",",o=".")=>{return e=[...new Set(e)].filter(t=>t!=n&&t!=o).join``,t.split(n).map(t=>{var n,a,r,i,t=t.split(o).map(t=>+(""+decodeBijective(t,e)));return 1==t.length?t:([n,t,a=1,r=0]=[...t],i=n<t?1:-1,[...Array((Math.abs(t-n)+2*r)/a+1)].map((t,e)=>n-i*r+i*a*e))}).flat().map(t=>String.fromCodePoint(t)).join``}
```

If a substring within the input occurs more than once, then it will be hashed and stored in the global object. All hashed strings are grouped according to their writing system, decoded by looping over the keys, and finally spread out into the global object.

While most of these strings are encoded, some of them are decoded directly when assembling the output string while not being stored in the global object. The following is a summary of the steps the compiler takes to encode and decode runs of characters of different types.

#### Symbols

We can represent sequences of symbols literally as strings without us performing any encoding or storing in the global object to be decoded or derived. However, we can also perform one additional optimization: minimizing backslashes.

If a substring contains many backslashes, then there are two options. The first is through a `RegExp` literal and calling `toString`, which yields a string of the pattern between two slashes without using the `source` property. Alternatively, we could also use the `String.raw` function.

However, if the compiler evaluates it, with native `eval` as a syntax error, despite using both the `replace` and `slice` methods, it falls back to using the normal substrings.

#### Integers

From here on out, many of the encodings, in principle, use bijective numeration, with `Number` or `BigInt` as an intermediate data type during conversion. All substrings are hashed in _bijective_ depending on the number and order of the digit characters.

Because of _bijective numeration_, any arbitrary sequence of characters from an indexed character set corresponds to a unique natural number.

Numeric-only substrings are decoded into `BigInt` and embedded directly inside the substring, stripping the `n` suffix to distinguish between `Number` and `BigInt`. Zero-padding is done as an additional step for substrings with leading zeroes.

#### Alphanumeric substrings

Alphanumeric substrings follow the same rules as numbers, except this time parsed as a number with a base higher than 10, depending on the position of the last letter in the substring. All are converted from `BigInt` values, if the encoded numeric value is greater than 2^53-1^ or `Number.MAX_SAFE_INTEGER`.

By default, `.toString()` yields lowercase. So if the original substring contains uppercase letters, then the positions of those characters in the substring will be converted into uppercase using compressed ranges. If the entire string is uppercase, then the string would be converted directly into uppercase.

#### Words with diacritics

For multilingual texts, use the Latin alphabet, along with a number of non-ASCII letters embedded inside. The initial substring is stripped of these non-ASCII characters and then hashed as a big integer (see above section). The non-ASCII characters are stored and hashed at the end of the string. Each insertion point consists of a substring and an insertion index. No Unicode normalization is performed, even if part of the encoding or decoding process.

#### Other writing systems and languages

For substrings of a non-Latin Unicode script, they are generated from a _case-insensitive_ character pool comprised of letters from that script. The result is hashed using the pool into a `BigInt`, or in the case of extremely long words or CJK text, _arrays_ of big integers.

For bicameral scripts, the substring is converted into lowercase and then a separate procedure converts selected characters based on their hashed indices into uppercase based on the input string.

#### Arbitrary Unicode sequences

For other Unicode characters, including CJK, special, private-use, non-printable and spacing characters, and even astral code points, they are converted from their hexadecimal values and grouped into smaller subsequences based on their leading digits. All leading zeroes are stripped when hashed and added back when decoded.

This yields pairs of symbol sequences: the "keys" being the leading and the "values" being the trailing digits that are not hashed. Both key and value pairs are converted from bijective base 16 into bijective base 30. `,` and `:` are reserved for separating keys and values.

## Customization

Here is a list of customization options available:

- `cacheVar` - the global variable defined to store substrings. It must be a valid, undefined JavaScript identifier. The default is `'$'`.
- `resultVar` - the global variables to store the output string. It must be a valid, undefined JavaScript identifier. The default is `'_'`.
- `strictMode` - Includes a `var` or `let` declaration, setting it at the beginning of the program. The default is `null`, which does not include a declaration.
- `export` - Which key to export the string if `moduleExports` is true. The default is `'result'`.
- `defaultQuote` - Quoting style to fall back to, if smart quoting is enabled. One of `single`, `double`, or `backtick`. The default is `double`.
- `'objectQuote'` - Whether to quote keys inside objects and which quotes to use. `'none'` skips quoting identifier keys, so sequences of `_` and `$` will not be quoted. If `calc` is selected, all the keys will be quoted inside square brackets. The default is `'none'`; options are `'none'`, `'single'`, `'double'` or `'calc'`.
- `smartQuote` - Whether or not to enable smart quoting; choosing quotes with the least number of escapes. If disabled, all strings inside the output, including object keys, will be quoted to `defaultQuote` and `objectQuote`. The default is `true`.
- `intThreshold` - Maximum length of decoded `BigInt` values. Suppose the length of the decoded `BigInt`is greater than this value, arrays of bijective base-**31**-hashed `BigInt` values will be used instead. Default is `200`.
- `delimiter` - Which character to use to delimit `BigInt`-hashed substrings or character sets. The default is `','`.
- `rangeDelimiter` - Which character to use to delimit ranges that `BigInt`-hashed character sets. The default is `'-'`.
- `wrapInIIFE` - Whether to wrap the obfuscated code in an anonymous function call, using the `Function` constructor. The default is `false`.
- `logResult` - Whether or not to log the obfuscated code in the console. The default is `false`.
- `characterSet` - The character set to use to hash substrings in. The order need not matter, but each character must occur once. Default is `` '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' ``.

## FAQs

#### Why would I want to obfuscate?

There are many reasons people obfuscate their text or code. The most common use case is to prevent someone from copying or pasting it or putting hidden messages inside their texts. One might use it for private works, such as manuscripts for novels, personal or sensitive information, or even code like client-side games or command-line interfaces.

#### Is the program foolproof?

The generated code "decrypts" or de-obfuscates itself only when run in a Node.JS environment, so it can only be considered a step in the process if you want maximum privacy.

This generated code, including the header, is programmatically generated from its parameters. Moreover, because there is a one-to-one correspondence between the sequence of substrings in the input and output, the source can be recovered and reverse-engineered, so it may not be obvious.

#### Why is my output code larger than my source?

Because there are only 32 different kinds of characters in the output, the ratio of input to output depends heavily on which characters are in the string and how often they occur together.

Sequences of any of these 32 symbol characters are hashed literally in the string; they get a 1-to-1 encoding except for escape sequences, which add one character, the backslash every time they occur. Spaces have a 1-to-1 correspondence because the compiler splits them up into commas.

Words, numbers, and other alphanumerics are hashed once and stored in the global object. Any repeat sequence is represented and hashed as a property in the global object, then referenced later when they build back the original string.

Code size is not something to worry about as there is a lot of repetition and only 32 characters.

#### Can I run a JavaScript _minifier_ or _prettifier_ on the output code?

Yes. In most cases, like small inputs of a few thousand words. Since there are many characters in the output, and many tokens in the output, it would break your formatter or _minifier_ or whatever is used to display your result if your text is more than a million characters long.

Source: During development, this was tested on minified source code with Prettier with its plugins.
