# 32chars.js

## Disclaimer

**This program is only meant for education and experimentation and shall not be used for any malicious purposes other than to obfuscate *private* work.**

## Introduction

32chars.js is a JavaScript encoder that encodes and obfuscates a piece of text into the shortest possible valid JavaScript code with only 32 ASCII symbol characters: `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ``.

This project is a testament to the many existing JavaScript encoders out there, and the spiritual successor to the original, [jjencode](https://utf-8.jp/public/jjencode.html).

## Background

JavaScript as a programming language has many weird and complicated parts. Some programmers have found out that one can write JavaScript without any alphanumeric characters, but a minimal set of characters, up to [five](https://aem1k.com/five/) or [six](http://www.jsfuck.com/) possible symbols. These compilers output _extremely verbose_ code, where a single character may expand to thousands.

Program code contains a wide variety of individual characters: numbers, letters, symbols and spaces, making code more parsable and readable. This project aims to output obfuscated JavaScript code using all the 32 symbol characters while maintaining the shortest possible output.

So rather than encoding every single character in the input string, we break the string into runs that have a length of at least one character. This way we can effectively minimize the amount of operations performed by the JavaScript engine, while keeping the overall output short. 

So, the compiler breaks and encodes parts of the string into parsable tokens and then determines which JavaScript's built-in operations produce the original string. Parts of the string containing those same 32 ASCII symbol characters remain unchanged and quoted in string literals.

## Walkthrough 

With a large character set, most of these symbols also are valid JavaScript tokens. The most significant of them are:

- The quote characters `'`, `"` and `` ` `` delimit strings. The back tick `` ` `` delimits template strings, which allow for interpolation and tagged function calls
- Combinations of `_` and `$` form variables and identifiers
- The plus sign `+` concatenates strings, adds numbers and (tries to) cast other values into numbers
- Arithmetic `+ - * / % **` and bitwise `& | ^ ~ << >> >>>` operators with a `Number` and `BigInt` on either side
- The dot `.` to access properties of objects that are valid JavaScript identifiers
- The comma `,` to delimit array elements, function arguments and object properties, as well as assign multiple variables in a single statement
- The round brackets `()` to call functions and group expressions with different precedences
- The square brackets `[]` to access array and object elements and create array literals
- The curly brackets `{}` to delimit object literals and code blocks
- The construct `${}` to interpolate expressions in template strings, converting them into strings if untagged
- The slash `/` to delimit regular expression literals and divide numbers
- The backslash `\` to escape characters in strings, even themselves

We have syntax to form strings. Strings are very fundamental to obfuscation, as we can store and hash custom data. However, there are many other ways to create strings, using JavaScript's newest syntax and functionality: `RegExp` and `BigInt` data types, and many `String`, `Array`, and `Object` methods.

The compiler uses a two-step substitution encoding. First, characters and functions are assigned to variables and properties with programmatically generated keys, These are then decoded through these operations, and used either to construct new substrings or build back the original string.

There are of course edge cases. Some expressions innately produce strings: constants (e.g. `true`, `false`, `0`), string tags (e.g. `[object Object]`), date strings (e.g. `2011-10-05T14:48:00.000Z`) and source code (e.g. `function Array() { [native code] }`).

The compiler parses the text into categorical tokens depending on the type of character. This includes ASCII punctuation, digits and letters, words with diacritics, non-Latin scripts, and Unicode code points.

JavaScript stores strings as **UTF-16**, so all BMP characters, code points `U+0000` to `U+FFFF` are encoded as _two_ bytes while the rest are encoded as _four_.

The text is split by a delimiter such as a space, or the most common substring which the compiler detects. The split elements go into an array and delimited with commas. There could be empty array slots, so nothing goes in between the commas. Unfortunately, JavaScript ignores trailing commas, so we have to explicitly add a trailing comma if the final element of an output array is empty.

### Quoting string literals

We create string literals in JavaScript in three ways: single-quoted `''`, double-quoted `""` and _template_ (back tick) strings ` `` `. Both single and double-quoted strings are functionally the same. Template strings allow for interpolating values with the `${}` syntax. In the output, we quote sequences of ASCII symbols directly as they are in any of these three quotes.

Usually, the runs do not contain any of the quote characters `` ' " ` ``, or the backslash `\`, so any type of quote would do without escapes. If any of these above-mentioned characters are present, then the backslash, and the corresponding quote character is escaped, by prefixing it with a backslash (like `'\\'`), preventing the string from abruptly ending.

In template literals delimited with back ticks `` ` ``, the sequence `${`, which begins interpolation, is also escaped to avoid opening interpolation.

Each substring in the output goes through a quoting function, and calls `jsesc` on each. The number of escapes in all the three strings are counted, and the string literal with the least number of escapes is selected. In most cases where there are no escapes, the compiler just falls back cycling between the three delimiters.

The rules for quoting object keys are different: back tick-delimited strings cannot be used, as they throw a syntax error; string keys which are valid identifiers, i.e. combinations of `_` and `$`, do not need to be quoted.

### Statement 1

The symbols `_` and `$` are valid JavaScript identifier characters, so we can use combinations of those two to form variables. One of them `$`, stores and references values and substrings, and the other, `_`, represents the actual string being reconstructed.

`$` starts with the value of `-1`, by doing a bitwise NOT on an empty array: `~[]`. An empty array, or implicitly, a _string_, is `0`, so the expression `~0` evaluates to `-1`.

### Statement 2

In the following statement, we assign `$` to an object literal in curly braces `{}`. This `$` variable is the global object, and is what we use to define values and substrings for us to build back the input string. We define properties inside the braces in the form `key: value`, and separate _key-value pairs_ or _properties_ with commas.

JavaScript has three different ways to represent keys: _identifiers_ (which can be keywords) _without quotes_ like `key:value`, _strings_ within _single or double quotes_ like `'key':value`, and _dynamic expressions_ within _square brackets_ `['key']:value`. In addition, we can access object properties with dots, like `x.key`, or square brackets, like `x['key']`.

Strings and arrays can be indexed, each character within the string or element of an array has an index starting from `0`. The first element or character has an index of `0`, the second `1`, and so on until the end of the string or array, with 1 less than its length. Because each index is a _property_ of the string or array, `'string'[5]` yields the character `'g'`.

The first property of `$` is `___`, with a value of `` `${++$}` ``. This takes the value of `$`, currently `-1`, and increments it to `0`, then casts that into a string by interpolating it inside a template literal, implicitly calling the method `.toString()`. While the object is still being built, `$` is still a number and not an object yet, since evaluation happens outward.

The second property is `$__$`, with a value of `` `${!''}`[$] ``. An empty string is prepended with the logical NOT operator `!`, which coerces it into `false` as it is considered _falsy_ in JavaScript. `!` also negates the boolean, becoming `true`. The expression is wrapped a template literal interpolation, turning it into a string `"true"`. The `[$]` construct at the end returns the character at index `0` (indices start at zero), which returns `t`.

We repeat the above steps: incrementing `$` variable, constructing a string, and grabbing a character out of the string by specifying its index. Next, we manipulate literals to evaluate to form the constants, `true`, `false`, `Infinity`, `NaN`, `undefined`, and an empty object `{}` which becomes the _string tag_ `'[object Object]'`.

The constants yield the following letters (case-sensitive): `a b c d e f i j l n o r s t u y I N O`, the space and the digits `0` to `9`. We now have the hexadecimal alphabet and several other uppercase and lowercase letters.

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

We use the spread operator, `...`, to "spread out" its properties on a new object. In this case we are cloning the object and then spreading it out along with new properties. This saves up on having to assign every single property on the object, one by one. This saves having to repeat the `$` variable every time.

### Statement 5 and beyond

We retrieve the following letters: `h k q w z C D U` (and additionally `G J M T W Z`), make the strings `toString`, `keys`, `length`, `raw` and `toUpperCase`, and the keyword `new`. Initiating a `Set` must have the `new` keyword, otherwise JavaScript throws an exception.

`toString` is formed by concatenating the letters `t` and `o`, and then retrieving the string `'String'` from the `String` constructor, by accessing its `name` property. With `toString`, we can retrieve the rest of the lowercase alphabet, `h k q w z`.

We assign these properties through array destructuring. The right hand side is the values we need to convert, and an anonymous `map` function which transforms all the values inside the array. In this case, we are converting strings from base 10 to 36, to yield a single digit that corresponds to the letter in question.

In this case, for base above 10, the letters of the alphabet indicate digits greater than 9. For example, for hexadecimal numbers (base 16) `a` through `f` are used.

With the `Function` constructor, we can execute code contained inside a string as native JavaScript. For example, with an expression such as `Function('return eval')`, we retrieve the built-in functions `eval`, `escape`.

The letters `C` (from `<` or `%3C`) and `D` (from `=` or `%3D`) come from indexing the last hexadecimal digit from a URL string. All characters that are not an ASCII letter, number, or one of the symbols `-`, `_`, `.`, and `~`, are percent-encoded, into a form `%XX` or `%uXXXX` for higher code points, where X is an _uppercase_ hexadecimal digit.

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

The output contains several functions, defined with the keys `0`, `-1`, `true` and `false` which can be formed completely with symbols. Their corresponding primitive expressions are `+[]`, `~[]`, `!''` and `![]`. These functions are defined in the compiler and also encoded in the output.

Functions can be converted into strings, which yield their source code when converted into a string. We can manipulate the source code inside the function however way we want. In this case, we want to transform the function into the shortest possible expression without using any alphanumerics.

- We pass the entire function into **UglifyJS**, which returns a minified version of the source code. UglifyJS eliminates comments and dead code, shortens variables, and compresses values, expressions and statements to be as compact as possible.
- Next, we convert the named function `function named(args)=>{body}` into an anonymous arrow function `(args)=>{body}` with a regular expression.
- Then, we generate a lookup table of all the variables and arguments defined in the function, and substitute them with combinations of `_` and `$` characters, except the global variable.
- After that, we substitute all the identifiers, numbers and spaces with the appropriate substring if they have been defined, if not they are spelled out entirely. If an uppercase letter is not defined, we attach a `.toUpperCase()` call on the equivalent ih lowercase letter.
- Next, we substitute calls to other functions are substituted with the appropriate property of `$` as a primitive expression inside the string.
- We quote the remaining portions of the string which are symbols, and join everything up with the string concatenation operator `+`.
- Finally, we pass the expression inside the `eval` function, which returns an anonymous function that is then assigned its corresponding primitive expression.

### Similar strings

Using various string methods, we can employ algorithms to produce similar strings, so to minimize the number of values that need to be encoded. Some substrings manipulating primitive values like `'function'`, `'Array'`, `'undefined'`, `'object'`, so we can derive substrings from those.

- The `slice` method returns consecutive characters within a substring by specifying a start and optional end index, for instance, `'fin'` and `'fine'` from `'undefined'`.
- The `repeat` method repeats a substring. We use a regular expression to determine the shortest pattern within the substring and how much it repeats.
- The `split` and `'join'` method is used to join an array of "strings" with a string as its delimiter. Then, using regular expressions, we determine the optimal substring to delimit, then we recursively split and hash both the substrings and the delimiter.
- The `replace` method is used to replace one or all substrings of a substring through insertion, deletion, or substitution to turn it into something similar. We would use a string difference checker.

We divide the substring into n-grams and determine which substrings could be derived from all the non-symbol characters in the file. The compiler builds a list of all these substrings, and stores them in `$` in a separate statement should they appear in the input more than once.

### Escaping strings

We can quote sequences of ASCII symbols literally without having to perform any encoding, except for escape sequences with the backslash `\`, quote `` '"` `` characters and the dollar `$` in the interpolation sequence `${` in template strings which is done automatically with the `jsesc` functions.

However, we can still perform some optimizations to minimize the use of such backslashes, especially in bijective-encoded strings. If a substring contains too many backslashes, then the compiler resorts to two possible options:

One is embedding the substring inside a `RegExp` literal and accessing either the `source` property to retrieve the pattern, or wrapping it inside a template literal to encase it inside its delimiting slashes.

The other is using the `String.raw` function on a template literal, which returns the raw character sequence.

If the compiler evaluates either literal with the `eval` and still produces an error, it falls back to using the normal substrings. `RegExp`-delimited literals are prioritized. If a substring ends in a an odd number of backslashes the last backslash is added back in normal quotes: `'\\'`.

### Bijective numeration

There are four aliased functions encoded inside the output:

- `encodeBijective`, aliased `0`;
- `decodeBijective`, aliased `-1`;
- `compressRange`, aliased `false`; and
- `expandRange`, aliased `true`.

All these functions rely on the principle of **[bijective numeration](https://en.wikipedia.org/wiki/Bijective_numeration)**; every non-negative integer can be represented in exactly one way with a finite string of digits. The reverse is true: every string of digits made from an indexed, unique character set, corresponds to a natural number.

```js
const functionAliases = {
  encodeBijective: "+[]", // 0
  decodeBijective: "~[]", // -1
  compressRange: "![]", // false
  expandRange: "!''", // true
}
```

`encodeBijective` encodes a `BigInt` into a bijective string with the passed characters as its digits. It acts as normal base conversion except there is no zero digit.

- Repeatedly divides the integer until it reaches zero: `0 < (number = (number - 1) / base)`
- Returns the modulus of every digit with its base, which is the length of the string; and returns the corresponding "digit" of the "digit" array based on its index (indices start from 0) with what was once digit 0 being replaced with the last: (Expression `digits[(digit % base || base) - 1]`)
- Concatenates the resulting "digit" to the beginning of the string, hence assembling it backward. If the number is 0 or negative it just returns it.

`decodeBijective` does the opposite, returning a `BigInt` from the string and its passed digits as a string.

- The string is converted into a set and then spread into an array, which ensures astral code points are counted as single characters;
- Repeatedly multiplies a digit by 1 greater than its index in the string and raises it to the power of 1 minus the base, in reverse order: `(digits.indexOf(digitString[placeValue]) + 1) * base ** (digitString.length - placeValue - 1)`
- Adds the result to 0 which is the default value, as a `BigInt`.

The string is converted into an array by spreading the individual characters in a string into a new Set object, which ensures the passed string contains unique characters, and then finally into an array, including astral code points which normally are encoded as two code points if inside a string.

`encodeRange` compresses and bijectively encodes the numbers inside a character range, with the comma and dot assigned as delimiters for numbers and ranges.

- Captures each unique character of the string, sorted by increasing Unicode code points;
- Converts them into integers with `String#codePointAt` (decoding function is `String.fromCodePoint`);
- Compresses ranges of consecutive integers into their inclusive start and end point, as soon as one is spotted, it raises an error.
- Converts every integer and range into bijective base 30; and
- Joins everything with _colons_ to delimit start/end pairs, _commas_ to delimit individual numbers/number pairs.

Likewise, `decodeRange` does the opposite.

- Splits the encoded substring by delimiter and range
- Decodes them with `decodeBijective` using the 32 characters
- Converts each resulting `BigInt` into a `String` and then a `Number`
- Expands each range with an inclusive range function, else just leaves it alone
- Flattens the resulting array
- Maps each integer to its Unicode code point, to retrieve the corresponding Unicode character
- Joins the resulting characters into a string to use in decoding

The following is the source code of these functions, minified for compactness sake.

<!-- prettier-ignore -->
```js
const encodeBijective=(n,e)=>{if(n<=0n)return"";e=[...new Set(e)];for(var t=BigInt,r=t(e.length),i=e[((n=t(n))%r||r)-1n];0n<(n=(n-1n)/r);)i=e[(n%r||r)-1n]+i;return i}
const decodeBijective=(e,n)=>{n=[...new Set(n)],e=[...e];for(var t=BigInt,i=0n,r=t(n.length),c=e.length,d=0;d<c;d++)i+=t(n.indexOf(e[d])+1)*r**t(c-d-1);return i}
const compressRange=(e,n,t=",",o=".")=>{return n=[...new Set(n)].filter(e=>e!=t&&e!=o).join``,[...new Set(e)].map(e=>e.codePointAt()).sort((e,n)=>e-n).reduce((e,n,t,o)=>{var r=o[t-1],i=n-r;return 0<t&&i==r-o[t-2]?(e[r=e.length-1][1]=n,1<i&&(e[r][2]=i)):e.push([n]),e},[]).map(e=>e.map(e=>encodeBijective(e,n)).join(o)).join(t)}
const expandRange=(e,t,n=",",o=".")=>{return t=[...new Set(t)].filter(e=>e!=n&&e!=o).join``,e.split(n).map(e=>{var n,a,i,r,e=e.split(o).map(e=>+(""+decodeBijective(e,t)));return 1==e.length?e:([n,e,a=1,i=0]=[...e],r=n<e?1:-1,[...Array((Math.abs(e-n)+2*i)/a+1)].map((e,t)=>n-r*i+r*a*t))}).flat().map(e=>String.fromCodePoint(e)).join``}
```

Regardless if a particular substring occurs more than once in the input, it will still be hashed and stored in `$`. All hashed strings are grouped according to their Unicode _script_ or _general category_, decoded by looping over the keys, and finally spread out into `$`.

While most of these strings are encoded, some of them are decoded directly when assembling the output string while not being stored in `$`. The following is a summary of the steps the compiler takes to encode and decode runs of characters of different types.

### Encoding and decoding characters

The compiler analyzes the text, and stores a record of all distinct Unicode characters inside the text and their code points. It then generates a category for each character, based on its Unicode metadata. This category corresponds to the _General Category_ of the Unicode character, if it is not a Letter, but if it is, its _Script_. Most Unicode characters are considered letters.

The compiler assigns a category to each code point checking the character to the regular expression corresponding to the Unicode category or script, until it finds a match.

- Letter (`L`): lowercase (`Ll`), modifier (`Lm`), titlecase (`Lt`), uppercase (`Lu`), other (`Lo`)
- Mark (`M`): spacing combining (`Mc`), enclosing (`Me`), non-spacing (`Mn`)
- Number (`N`): decimal digit (`Nd`), letter (`Nl`), other (`No`)
- Punctuation (`P`): connector (`Pc`), dash (`Pd`), initial quote (`Pi`), final quote (`Pf`), open (`Ps`), close (`Pe`), other (`Po`)
- Symbol (`S`): currency (`Sc`), modifier (`Sk`), math (`Sm`), other (`So`)
- Separator (`Z`): line (`Zl`), paragraph (`Zp`), space (`Zs`)
- Other (`C`): control (`Cc`), format (`Cf`), unassigned (`Cn`), private use (`Co`), surrogate (`Cs`)

It then groups these characters according to the assigned categories, sorts them according to their code points in ascending order, and calls the `compressRange` function to generate a bijective base-30 encoded substring, with the comma `,` and period `.` functioning as delimiter characters for values and ranges.

These constant strings are decoded at runtime by the output and assigned integer keys starting from 1 in `$`, so they are decoded once rather than the encoded character range every time a substring of that script is decoded, this causes the program to run for a long time.

The compiler ignores the space and the 32 symbol characters, which are inserted when the string is assembled in the very last step of the program.

### Encoding substrings

In addition to encoding character ranges, the compiler also has to encode the strings based on those character ranges. Likewise for the character categories, the compiler groups the strings by category, and encodes them with the corresponding character set. The result is assigned a key from a generator function, which yields bijective strings from increasing natural numbers, skipping those already defined.

The substrings which do not contain any of the 32 symbol characters therefore have to be bijectively encoded with the same 32 characters, except only with varying character sets.

#### Decimal digit substrings

Anything that is not a symbol is encoded as bijective, to and from strings of different character sets with `BigInt` as an intermediate data type. All the encoded values are stored with the 32 characters in an arbitrary order (`` '_$-,;:!?.@*/&#%^+<=>|~()[]{}\'"`\\' ``). Hence from here on out, _base 32_ implies bijective base-32 encoded strings with the 32 punctuation characters as its digits.

Numeric-only substrings are decoded straight from base-32, and then converted into strings, wrapping the resultant `BigInt` inside a template literal thereby stripping its `n` suffix. All tokens that fall under this category have the categorical name `Digit`.

#### Alphanumeric substrings

Alphanumeric substrings follow the same rules as numbers. Zero-padded numeric strings are considered _alphanumeric_ since all leading zeroes are stripped. All tokens that fall under this category have the categorical name `Alnum`.

They are converted from `BigInt` values except this time from a constant digit string, which is the concatenation of Python's string constants `string.digits` and `string.ascii_letters`, or the first 62 digits of `base64`, and then hashed with the 32 characters in code point order, since it can be generated from the methods `Number#toString` and `String#toUpperCase`. This string,

<!-- prettier-ignore -->
```js
"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```

is generated with the expression

<!-- prettier-ignore -->
```js
[[...Array(36)].map((_,a)=>a.toString(36)),[...Array(26)].map((_,a)=>(a+10).toString(36).toUpperCase())].flat().join``
```

The compiler generates a `BigInt` from the encoded substring with the above constant string, and then encodes the resulting `BigInt` into a string with the corresponding encoding with the 32 characters.

#### Unicode characters

The compiler uses the same bijective numeration principle to encode the other Unicode characters as above, but each with their own character string which is generated by the compiler, with the function `encodeRange` which is not passed into runtime. The substrings are assigned the corresponding keys first; the reverse of this function, `decodeRange`, decodes each Unicode substring before it can be used in the compiler.

The tokens are grouped according to their script, sorted according to frequency, "decoded" by their character string into a `BigInt` and encoded into base-32. Each key is then assigned a bijective-encoded string in increasing order.

The encoded strings and their keys are then placed inside an array destructuring operation, the keys on the left hand side and the encoded substrings on the right hand side. The right hand side with a mapper function that repeatedly decodes every substring as each key-substring pair is assigned to `$`. Each statement corresponds to one of the scripts or categories assigned by the compiler, with priority given to integer and alphanumeric strings.

### Tokenization

As soon as the regular expression encounters a non-ASCII letter, it begins a new token and matches all other Latin characters of the word and assigns that matched substring to the category `Latin`. The ASCII letter substring before is assigned `Alnum`. This is because the compiler captures ASCII alphanumeric substrings before capturing Latin-script substrings.

The same logic applies for a non-Latin Unicode script, and even other Unicode characters.

## Customization

Here is a list of customization options available:

- `cacheVar` - the global variable defined to store substrings. It must be a valid, undefined JavaScript variable. The default is `'$'`.
- `resultVar` - the global variables to store the output string. It must be a valid, undefined JavaScript variable. The default is `'_'`.
- `strictMode` - Includes a `var` or `let` declaration, setting it at the beginning of the program. The default is `null`, which does not include a declaration.
- `exportObject` - Whether to export the global object. The default is `false`.
- `exportResult` - Whether to export the result string. The default is `true`.
- `logObject` - Whether to log the global object. The default is `false`.
- `logResult` - Whether to log the result string. The default is `false`.
- `export` - Which key to export the string if `exportObject` is true. The default is `'object'`.
- `export` - Which key to export the string if `exportResult` is true. The default is `'result'`.
- `defaultQuote` - Quoting style to fall back to, if smart quoting is enabled. One of `single`, `double`, or `back tick`. The default is `double`.
- `'objectQuote'` - Whether to quote keys inside objects and which quotes to use. `'none'` skips quoting identifier keys, so sequences of `_` and `$` will not be quoted. If `calc` is selected, all the keys will be quoted inside square brackets. The default is `'none'`; options are `'none'`, `'single'`, `'double'` or `'calc'`.
- `smartQuote` - Whether or not to enable "smart" quoting; choosing quotes with the least number of escapes. If disabled, all strings inside the output, including object keys, will be quoted to `defaultQuote` and `objectQuote`. The default is `true`.
- `tokenLength` - Maximum length of a tokenized substring, inclusive of punctuation. All tokens will thus be split into the desired lngth. The default is `64`.
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

Words, numbers, and other alphanumerics are hashed once and stored in `$`. Any repeat sequence is represented and hashed as a property in `$`, then referenced later when they build back the original string.

Code size is not something to worry about as there is a lot of repetition and only 32 characters.

#### Can I run a JavaScript _minifier_ or _prettifier_ on the output code?

Yes. In most cases, like small inputs of a few thousand words. Since there are many characters in the output, and many tokens in the output, it would break your formatter or _minifier_ or whatever is used to display your result if your text is more than a million characters long.

Source: During development, this was tested on minified source code with Prettier with its plugins.
