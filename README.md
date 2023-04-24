# 32chars.js

## Disclaimer

**This program is meant for education and experimental purposes only. THIS PROGRAM SHALL NOT BE USED FOR ANY MALICIOUS PURPOSE WHATSOEVER. I WILL NOT HOLD ANY RESPONSIBILITY FOR ANY DAMAGE.**

## Introduction

**32chars.js** is a JavaScript encoder/obfuscator that that compiles a piece of text into the shortest possible valid JavaScript code with only 32 ASCII symbol characters. The 32 characters are: `` !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ ``.

A major problem with JavaScript esoteric subsets like _JSF\*ck_ [Martin Kleppe] is that they are **extremely verbose**. Certain single characters require far more than a thousand characters when expanded. The following is the JSF\*ck expansion for lowercase `y`.

<!-- prettier-ignore -->
```js
(+[![]] +
    [+(+!+[] + (!+[] + [])[!+[] + !+[] + !+[]] + +!+[] + +[] + +[] + +[])])[
    +!+[] + [+[]]
]
```

## History

JavaScript is a great programming language. And just as it is great, it's also funny, weird and complicated. Much of that weirdness comes from its _loose typing_ that is "_completely detached from reality_" [Jeff Delaney, Fireship.io], allowing any expression to be evaluated as any type.

Programmers have come up with many ways of exploiting this weird language by developing encoders or [obfuscators](https://obfuscator.io) to hide their scripts in plain sight. And some of them without the use of letters or numbers.

In 2009, Yosuke Hasegawa, developed [**`jjencode`**](https://utf-8.jp/public/jjencode.html), which could encode arbitrary JavaScript into an obfuscated form utilizing only 18 symbols `[]()!+,\"$.:;_{}~=`.

Early the following year, an informal competition was held on the _Obfuscation_ forum on _Slackers_, a web application security site, to come up with a way to get the minimum number of characters required down to less than eight: `[]()!+,/`. Contributors managed to eliminate the need for the `,` and `/` characters, thereby reducing it to six: `[]()!+`.

And for many years, the _Wall of Six_, had not been broken yet. [**Xchars.js**](https://syllab.fr/projets/experiments/xcharsjs/index.html) by [Sylvain Pollet-Villard](https://syllab.fr/) was the first project that provided two different solutions for using five characters only: The first subset `[+=_]` required a script with a special ID.

The second subset `[+|>]`, initiated by [Masato Kinugawa](https://twitter.com/kinugawamasato/status/915549498725695489) makes use of the TC39 pipeline operator proposal which is currently only available as a Babel plugin.

The third subset `[$+=]`, developed by Sylvain Pollet-Villard and Martin Kleppe themselves, make use of a specific version of jQuery UI (1.12.4), mapping specific characters based on their position in the source code.

The same principles work with other versions of JQuery. It uses a public property of the `DatePicker` plugin to get access to the document body and inject the obfuscated script.

## Rules

The compiler should be a single file, and not contain any dependencies.

The output code should:

-   Evaluate exactly to the input string.
-   Only contain the 32 characters.
-   Be of the shortest length, using the least bytes.
-   Run as a standalone file, no third-party libraries.
-   Run anywhere, even outside the browser.
-   Run without any special compilers, variables, IDs.
-   Not overload any operators, variables.
-   Not use any experimental syntax.

## Walkthrough

With a large character set, most of these symbols also are valid JavaScript tokens. Any character or sequence of characters not part of this list is inside strings.

| Token | Place | Function |
| --- | --- | --- |
| `_ $` | Anywhere | Forms part of identifiers |
| `/` | After brackets or statements | Forms regular expression literals |
| `+ - * / ** %` | Anywhere | Arithmetic operators |
| `&& \|\|` | Anywhere | Boolean operators |
| `== !=` | Anywhere | Equality operators |
| `< <= > >=` | Anywhere | Comparison operators |
| `,` | Outside brackets | Separates statements |
| `,` | Inside brackets | Separates expressions, arguments, and properties |
| `;` | Outside brackets | Separates statements |
| `.` | Between two identifiers | Delimits object properties |
| `' "` | Anywhere | Forms regular string |
| `` ` `` | After expressions | Forms a tagged template string |
| `` ` `` | Elsewhere | Forms a plain template string |
| `...` | Inside `() [] {}` | Spreads contents over an argument list, array or object |
| `=>` | Anywhere valid | Forms part of anonymous function literal |
| `${ }` | Inside template strings | Interpolates expressions |
| `\` | Inside strings | Escapes characters |
| `( )` | After expressions | Calls function or method |
| `( )` | Before `=>` | Delimits function arguments |
| `( )` | Elsewhere | Encloses expressions with different precedence |
| `[ ]` | After expressions | Accesses object properties, array elements and string characters |
| `[ ]` | Elsewhere | Forms array literal |
| `{ }` | After `=>` | Delimits function body |
| `{ }` | Elsewhere | Forms object literal |

### Tokenization

The compiler _tokenizes_ the input string recursively into categorical tokens: spaces, zeroes, ASCII punctuation, letters an numbers, non-Latin scripts, and other Unicode code points.

JavaScript stores strings as **UTF-16**, so all BMP characters, code points `U+0000` to `U+FFFF` are encoded as _two_ bytes, except surrogate pairs, while code points from `U+10000` to `U+10FFFF`, are called _"astral"_ code points and encoded with the surrogate pairs.

The text is split by the space ` `, since regardless of script, ` ` is the most common character. split elements go into an array and delimited with commas. There could be empty array slots, so nothing goes in between the commas. Unfortunately, JavaScript ignores trailing commas, so we have to explicitly add a trailing comma if the final element of an output array is empty.

## Breaking down the output

The output file uses only two variables, the underscore `_` and the dollar sign `$`. By default, `$` assigns characters, encoded substrings and functions to programmatically generated keys.The substrings are referenced, decoded and then used to build back the original string.

However, we have to form words that we use repeatedly to derive other letters, or form part of crucial functions. Some of these are keywords, function, method and property names. Throughout, only those that repeat twice or more are encoded with a specific, arbitrary key.

If any of such substrings appear in the input string without spaces, they are directly referenced without any conversion from an intermediate value.

```js
const props = {
    // statement 2: constants
    // [space] 0 1 2 3 4 5 6 7 8 9 I N O a b c d e f i j l n o r s t u y
    space: "-",

    // statement 3
    constructor: "$",
    return: "_",
    entries: ".",
    filter: "%",
    join: "+",
    slice: "/",
    sort: ">",

    for: "*_",
    if: "!_",

    // statement 4: constructors
    // A B E F R S g m p v x

    // statement 5
    fromEntries: ",",
    indexOf: "#",
    map: "^",
    name: "?",
    repeat: "*",
    split: "|",

    BigInt: "++",
    Set: "--",

    var: "=_",

    // statement 6: global functions
    escape: "\\",
    eval: "=",

    // statement 7: constructors
    // 'to' + String.constructor.name
    // C, D (from 'escape')
    toString: "'",

    // statement 8: toString, escape and call
    // U h k q w z

    // statement 9
    keys: "&",
    length: ":",
    raw: "`",
    toUpperCase: "@",

    new: "+_",
};
```

### Statement 1

The symbols `_` and `$` are valid JavaScript identifier characters, so we can use combinations of those two to form variable names.

We will only use two global variables for this project: `$` stores and references functions and substrings, while `_` is assigned to the reconstructed string and exported, by default.

`$` is instantiated with the value of `-1`, by doing a bitwise NOT on an empty array: `~[]`. An empty array, or implicitly, a _string_, is `0`, so the expression `~0` evaluates to `-1`.

### Statement 2

We reassign `$` is to an object literal `{}` with curly braces. We assign properties to the object in the form of key-value pairs in the form `key:value` with a colon, and separate these pairs with commas. All keys are strings.

JavaScript has three different ways to represent keys: identifiers (which can be keywords) `key:value`, string literals wrapped in single or double quotes `'key':value`, and expressions within square brackets `['key']:value`, calculated at runtime.

To access object properties, we use **dots**, like `x.key`, as long as `key` is an identifier, or **square brackets**, like `x['key']`, with the expression inside the brackets.

**Strings and arrays can be indexed.** Each character of a string or element of an array have indices starting from `0`, corresponding to the first index, then the second `1`, and so on until the end of the string which is 1 less than its length. Because each index is a **property** of the string or array, `'string'[5]`, the character at index `5`, is the character `g`.

#### Ciphering letters

We cipher the numbers in binary, substituting `_` for digit `0` and `$` for digit `1`. Then we pad the result to a length of 3 by adding `_` (as `__`, `_$`, `$_` and `$$` have keys defined). So `___` is `0` and `__$` is `1`.

We cipher the letters as a pair of characters. The first `_` or `$` defines its case, and the second a symbol, each unique to a letter in the English alphabet, minus the bracket pairs `()[]{}`. The most common letters in English, `e` and `t` get the characters which form identifiers, `_` and `$`. The least common, `j`, `q`, `x` get the quote characters, and `z` gets the backslash.

The space is assigned the key `-`.

```js
let letters = "etaoinshrdlucmfwypvbgkqjxz";
let cipher = "_$-,;:!?.@*/&#%^+<=>|~'\"`\\";
```

#### Deriving letters

We manipulate empty literals using operations which evaluate to the constants, `true`, `false`, `Infinity`, `NaN`, `undefined`, which evaluate literally to the same exact strings. The empty object `{}` becomes the **string tag** `'[object Object]'`. They yield us the following letters, case-sensitively: the space, the digits `0` to `9`, and the letters `I N O a b c d e f i j l n o r s t u y`.

There are many ways to produce these literals, and only the ones with the minimum length are selected, encoded in a regular expression and expanded at runtime with the [**`genex`**](https://github.com/alixaxel/genex.js/) library. Every time a literal or sub-expression of this type is expected, the compiler cycles through them.

```js
let constantExprs = {
    "-1": /[+~]\[]/,
    0: /\+(\[]|""|''|``)/,
    1: /\+!(""|''|``)|-~\[]/,
    true: /!(""|''|``)/,
    false: /!({}|\[])/,
    NaN: /\+{}/,
    Infinity: /!(""|''|``)\/(!({}|\[])|\+(\[]|""|''|``))/,
    undefined: /(""|''|``|\[])\[(""|''|``|\[]|{})\]/,
    "[object Object]": /{}/,
};
```

We increment `$` to get the next number, stringifying and assigning it to its ciphered key. Then we get all the letters from all the constants with `$` as its index, since it is a number, and assign them to `$` with its ciphered key.

Since evaluation happens outward, while the object is still being built, `$` is still a number and not an object, and we do not need to use `_`, our other variable.

The first character we have to derive is `'0'`, with the expression `` `${++$}` ``. `$` is currently `-1`, is incremented to `0`, and is interpolated inside an empty template literal, casting it into a string.

The second is `t`, with a value of `` `${!''}`[$] ``. An empty string is prepended with the logical NOT operator `!`, which coerces it into `false` and negates the resulting Boolean, becoming `true`. The expression is wrapped a template literal interpolation, turning it into a string `"true"`. The `[$]` construct at the end returns the character at index `0` (indices start at zero), which returns `t`.

The letter `f`, is extracted from `$` in the same way as before, with the expression except that an empty array, which is `true`, is negated instead, resulting in `false`.

Then, the letter `I` is extracted from `Infinity` by dividing `true` by `false`: `` `${!''/![]}`[$] ``, and so on.

### Statements 3

We use the letters we have retrieved to form the names of properties in our expressions by concatenating them letter by letter with the `+` operator. We form the words `constructor`, `return`, `entries`, `filter`, `join`, `slice` and `sort`. The keywords `for` and `if` are also formed in the same statement, and are suffixed with `_`.

`[]` is used to call methods on values. For instance, `[]['flat']()` is semantically equivalent to `[].flat()`.

We can now access the constructors with the `constructor` property of "empty" literals or expressions: `Array`, `Boolean`, `Function`, `Number`, `String`, and `RegExp`, and similar to the previous statement, we cast that constructor function into a string. `Object` is not considered part of this since all its letters are already defined in `$`.

```js
let constructorExprs = {
    Array: /\[]/,
    Boolean: /\(!(""|''|``|{}|\[])\)/,
    Function: /\([_$]=>(""|''|``|{}|\[])\)/,
    Number: /\([+~](""|''|``|{}|\[])\)/,
    String: /""|''|``/,
    RegExp: /\/[!-',-.:->@\]-`{-~]\//,
    Object: /{}/,
};
```

### Statement 4

When converted into strings, like `String(Array)`, this yields us with a string that looks like this: `function Array { [native code] }`. We now have the letters `A B E F R S g m p v x`. The only letter not present in any of the constructor names is `v`, which is from the word `native`, at index `24` of `String(Array)`; in which `Array` has the least characters of these constructors.

Now, we have 9 uppercase `A B E F I N O R S` and 21 lowercase letters `a b c d e f g i j l m n o p r s t u v x y` . And like before, we store every word and letter we have formed with our ciphered keys for future reference.

In the next statement, we form the methods `indexOf`, `map`, `name`, `repeat`, `replace`, `reverse`, `split` and `fromEntries`, the constructor functions `BigInt` and `Set`, and the keyword `var`.

We use the spread operator, `...`, to "spread out" its properties on a new object. In this case we are cloning the object and then spreading it out along with new properties. This saves up on having to assign every single property on the object, one by one. This saves repeating the `$` variable every time.

### The `mapValues` function

Since now we have the method names `entries` and `fromEntries`, and we can get the `Object` constructor, we can form a very useful function to avoid us having to repeat `$` over and over again every time. This function transforms all the values in an object by calling a function on it passed as the second argument.

<!-- prettier-ignore -->
```js
const mapValues=(obj,func)=>Object.fromEntries(Object.entries(obj).map(([key,val])=>[key,func(val)]));
```

This function is assigned the key of `NaN` or `+{}`.

### Statement 5 and beyond

The cycle of forming words, deriving characters and assigning them to `$` repeats yet again, until a general way of retrieving and decoding characters is found.

We retrieve the following letters: `C D U h k w` to make the strings `toString`, `keys`, `length`, `raw` and `toUpperCase`, and the keyword `new`. Initiating a `Set` without prefixing a `new` keyword will throw a `TypeError`. We do not need the other two letters `q` and `z`, so we can skip them over.

#### `toString` and lowercase `h k w`

`toString` is formed by concatenating the letters `t` and `o`, and then retrieving the string `'String'` from the `String` constructor, by accessing its `name` property. With `toString`, we can retrieve the rest of the lowercase alphabet by converting numbers from base 10 to 36.

We assign these properties through **array destructuring**. The right hand side is the values we need to convert, and an anonymous `map` function which transforms all the values inside the array. In this case, we are converting strings from base 10 to 36, to yield a single digit that corresponds to the letter in question.

In this case, for base above 10, the letters of the alphabet indicate digits greater than 9. For example, for hexadecimal numbers (base 16) `a` through `f` are used.

#### `escape`, `eval` and uppercase `C D U`

With the `Function` constructor, we can execute code contained inside a string as native JavaScript. For example, with an expression such as `Function('return eval')`, we retrieve the built-in functions `eval`, `escape`.

The letters `C` (from `<` or `%3C`) and `D` (from `=` or `%3D`) come from indexing the last hexadecimal digit from a URL string with the built-in, deprecated `escape` function. All characters that are not an ASCII letter, number, or one of these symbols `- _ . ~` are `%`-encoded into the form `%XX` or `%uXXXX` for higher code points, where `X` is an **uppercase** hexadecimal digit.

The expression `{}.toString.call().toString()`, or `` `${{}.toString.call()}` `` evaluates to the string `'[object Undefined]'` which we can derive the character `U` from.

Both `eval` and `fromCodePoint` allow us to form Unicode strings. `fromCodePoint` generates a string from its code points by specifying an array of arguments, while the evil `eval` generates a string from escape sequences.

When used on a template literal, the `String.raw` method ignores all escape sequences, so backslashes are now interpreted as they are without getting "deleted" by the parser.

---

> **_Experimental_**
>
> The additional letters `G M T J W Z` can be retrieved with the `Date` object.
>
> -   The letters `G M T` are formed from the expression `new Date().toString()`. This yields a string `Thu Jan 01 1970 07:30:00 GMT+0XXX (Local Standard Time)`. GMT means **Greenwich Mean Time**.
> -   `Z` comes from `new Date().toISOString()` which evaluates to a string of the form `1970-01-01T00:00:00.000Z`. `Z` in this represents **zero UTC offset**.
> -   Passing these arguments to the `Date` constructor, in a specific order, retrieves uppercase `J` and `W`: `Jan` - `Date(0)`, `Wed` - `Date(0,0,3)`.

### Encoding functions

The output contains several functions, defined with the keys `0`, `-1`, `true` and `false` which can be formed completely with symbols. Their corresponding primitive expressions are `+[]`, `~[]`, `!''` and `![]`. These functions are defined in the compiler and also encoded in the output.

Functions can be converted into strings, which yield their source code when converted into a string. We can manipulate the source code inside the function however way we want. In this case, we want to transform the function into the shortest possible expression without using any alphanumerics.

-   We pass the entire function into [**UglifyJS**](https://github.com/mishoo/UglifyJS), which returns a minified version of the source code. UglifyJS eliminates comments and dead code, shortens variables, and compresses values, expressions and statements to their most compact form.
-   Next, we convert the named function `function named(args)=>{body}` into an anonymous arrow function `(args)=>{body}` with a regular expression.
-   Then, we generate a lookup table of all the variables and arguments defined in the function, and substitute them with combinations of `_` and `$` characters, except the global variable.
-   After that, we substitute all the identifiers, numbers and spaces with the appropriate substring if they have been defined, if not they are spelled out entirely. If an uppercase letter is not defined, we attach a `.toUpperCase()` call on the equivalent lowercase letter.
-   Next, we substitute calls to other functions are substituted with the appropriate property of `$` as a primitive expression inside the string.
-   We quote the remaining portions of the string which are symbols, and join everything up with the string concatenation operator `+`.
-   Finally, we pass the expression inside the `eval` function, which returns an anonymous function that is then assigned its corresponding primitive expression.

### Quoting strings

Given how much characters we have, we have syntax to form strings literally. Strings are very fundamental to obfuscation, as we can store our own custom data. There are so many ways to create strings in JavaScript: data types `RegExp` and `BigInt`, and many `String`, `Array`, and `Object` methods.

We could also represent them literally. Intuitively, we quote sequences of ASCII symbols literally as they appear in the input string. Single `'` and double `"` quotes form regular strings, these are essentially the same. The backtick `` ` `` forms a _template string_; this allows interpolating expressions with the `${}` syntax.

Template strings can also be _tagged_ by prefixing it with something called a _tag function_. The first argument to this function is an array of strings, and the second the array of expressions in the order they appear in between each substring. But again, because of JavaScript type coercion, one can do ` x.join`` ` in place of `x.join('')`, _somehow_.

Most of the time, runs do not contain any of the quote characters `` ' " ` ``, or the backslash `\`, so any type of quote would do without escapes. In template literals delimited with backticks `` ` ``, the sequence `${`, which normally begins interpolation, is also escaped.

Each substring in the output goes through a modified `stringify` function that innately calls `jsesc`. The strings are quoted in the three types, compared by length, and the shortest is returned. If two or more of these string types have the same length, the function cycles between those types.

The rules for quoting object keys are a little different. Template strings cannot be used, as they throw a `SyntaxError`, so the length comparison is performed only on `'` and `"`-delimited strings. Strings which contain only `_` and `$`, being valid identifiers, do not need to be quoted.

Some strings can be formed from constants (e.g. `true`, `false`, `0`), string tags (e.g. `[object Object]`), date strings (e.g. `2023-05-01T14:30:00.000Z`) and source code (e.g. `function Array() { [native code] }`). These are considered **edge cases**, and they will be filtered out and substituted accordingly if such substrings occur in any part of the input string.

### Optimizing escaped strings

We can quote sequences of ASCII symbols literally without having to perform any encoding, except for escape sequences with the backslash `\`, quote `` '"` `` characters and the dollar `$` in the interpolation sequence `${` in template strings which is done automatically with the [**`jsesc`**](https://github.com/mathiasbynens/jsesc/blob/master/src/jsesc.js) functions.

However, we can still perform some optimizations to minimize the use of such backslashes, especially in bijective-encoded strings. If a substring contains too many backslashes, then the compiler resorts to two possible options:

One is embedding the substring inside a `RegExp` literal and accessing either the `source` property to retrieve the pattern, or wrapping it inside a template literal to encase it inside its delimiting slashes.

The other is using the `String.raw` function on a template literal, which returns the raw character sequence.

If the compiler evaluates either literal with the `eval` and still produces an error, it falls back to using the normal substrings. `RegExp`-delimited literals are prioritized. If a substring ends in a an odd number of backslashes the last backslash is added back in normal quotes: `'\\'`.

### Bijective numeration

There are four aliased functions encoded inside the output:

-   `encodeBijective`, aliased `0`;
-   `decodeBijective`, aliased `-1`;
-   `compressRange`, aliased `false`; and
-   `expandRange`, aliased `true`.

All these functions rely on the principle of **[bijective numeration](https://en.wikipedia.org/wiki/Bijective_numeration)**; every non-negative integer can be represented in exactly one way with a finite string of digits. The reverse is true: every string of digits made from an indexed, unique character set, corresponds to a natural number.

```js
const functionAliases = {
    encodeBijective: "+[]", // 0
    decodeBijective: "~[]", // -1
    compressRange: "![]", // false
    expandRange: "!''", // true
};
```

`encodeBijective` encodes a `BigInt` into a bijective string with the passed characters as its digits. It acts as normal base conversion except there is no zero digit.

-   Repeatedly divides the integer until it reaches zero: `0 < (number = (number - 1) / base)`
-   Returns the modulus of every digit with its base, which is the length of the string; and returns the corresponding digit of the digit array based on its index (from 0) with what was once digit 0 being replaced with the last: (Expression `digits[(digit % base || base) - 1]`)
-   Concatenates the resulting "digit" to the beginning of the string, hence assembling it backward. If the number is 0 or negative it just returns it.

`decodeBijective` does the opposite, returning a `BigInt` from the string and its passed digits as a string.

-   The string is converted into a set and then spread into an array, which ensures astral code points are counted as single characters;
-   Repeatedly multiplies a digit by 1 greater than its index in the string and raises it to the power of 1 minus the base, in reverse order: `(digits.indexOf(digitString[placeValue]) + 1) * base ** (digitString.length - placeValue - 1)`
-   Adds the result to 0 which is the default value, as a `BigInt`.

The string is converted into an array by spreading the individual characters in a string into a new `Set` object, which ensures the passed string contains unique characters, and then finally into an array, including astral code points which normally are encoded as two code points if inside a string.

`encodeRange` compresses and bijectively encodes the numbers inside a character range, with the comma and dot assigned as delimiters for numbers and ranges.

-   Captures each unique character of the string, sorted by increasing Unicode code points;
-   Converts them into integers with `String.codePointAt` (decoding function is `String.fromCodePoint`);
-   Compresses ranges of consecutive integers into their inclusive start and end point, as soon as one is spotted, it raises an error.
-   Converts every integer and range into a bijective base; and
-   Joins everything with _backslashes_ to delimit start/end pairs, _commas_ to delimit individual numbers/number pairs.

Likewise, `decodeRange` does the opposite.

-   Splits the encoded substring by delimiter and range
-   Decodes them with `decodeBijective` using the 32 characters
-   Converts each resulting `BigInt` into a `String` and then a `Number`
-   Expands each range with an inclusive range function, else just leaves it alone
-   Flattens the resulting array
-   Maps each integer to its Unicode code point, to retrieve the corresponding Unicode character
-   Joins the resulting characters into a string to use in decoding

The following is the source code of these functions, minified for compactness sake.

<!-- prettier-ignore -->
```js
const encodeBijective=(n,e)=>{if(n<=0n)return"";e=[...new Set(e)];for(var t=BigInt,r=t(e.length),i=e[((n=t(n))%r||r)-1n];0n<(n=(n-1n)/r);)i=e[(n%r||r)-1n]+i;return i}
const decodeBijective=(e,n)=>{n=[...new Set(n)],e=[...e];for(var t=BigInt,i=0n,r=t(n.length),c=e.length,d=0;d<c;d++)i+=t(n.indexOf(e[d])+1)*r**t(c-d-1);return i}
const compressRange=(e,n,t=",",o="\\")=>{return n=[...new Set(n)].filter(e=>e!=t&&e!=o).join``,[...new Set(e)].map(e=>e.codePointAt()).sort((e,n)=>e-n).reduce((e,n,t,o)=>{var r=o[t-1],i=n-r;return 0<t&&i==r-o[t-2]?(e[r=e.length-1][1]=n,1<i&&(e[r][2]=i)):e.push([n]),e},[]).map(e=>e.map(e=>encodeBijective(e,n)).join(o)).join(t)}
const expandRange=(e,t,n=",",o="\\")=>{return t=[...new Set(t)].filter(e=>e!=n&&e!=o).join``,e.split(n).map(e=>{var n,a,i,r,e=e.split(o).map(e=>+(""+decodeBijective(e,t)));return 1==e.length?e:([n,e,a=1,i=0]=[...e],r=n<e?1:-1,[...Array((Math.abs(e-n)+2*i)/a+1)].map((e,t)=>n-r*i+r*a*t))}).flat().map(e=>String.fromCodePoint(e)).join``}
```

Regardless if a particular substring occurs more than once in the input, it will still be hashed and stored in `$`. All hashed strings are grouped according to their Unicode _script_ or _general category_, decoded by looping over the keys, and finally spread out into `$`.

While most of these strings are encoded, some of them are decoded directly when assembling the output string while not being stored in `$`. The following is a summary of the steps the compiler takes to encode and decode runs of characters of different types.

### Encoding and decoding characters

The compiler analyzes the text, and stores a record of all distinct Unicode characters inside the text and their code points. It then generates a category for each character, based on its Unicode metadata. This category corresponds to the _General Category_ of the Unicode character, if it is not a `Letter`, but if it is, its _`Script`_. Most Unicode characters are considered letters.

The compiler assigns a category to each code point, checking the character against a regular expression corresponding to its Unicode category or script, until it finds a match.

-   Letter (`L`): lowercase (`Ll`), modifier (`Lm`), titlecase (`Lt`), uppercase (`Lu`), other (`Lo`)
-   Mark (`M`): spacing combining (`Mc`), enclosing (`Me`), non-spacing (`Mn`)
-   Number (`N`): decimal digit (`Nd`), letter (`Nl`), other (`No`)
-   Punctuation (`P`): connector (`Pc`), dash (`Pd`), initial quote (`Pi`), final quote (`Pf`), open (`Ps`), close (`Pe`), other (`Po`)
-   Symbol (`S`): currency (`Sc`), modifier (`Sk`), math (`Sm`), other (`So`)
-   Separator (`Z`): line (`Zl`), paragraph (`Zp`), space (`Zs`)
-   Other (`C`): control (`Cc`), format (`Cf`), unassigned (`Cn`), private use (`Co`), surrogate (`Cs`)

It then groups these characters according to the assigned categories, sorts them according to their code points in ascending order, and calls the `compressRange` function to generate a bijective base-30 encoded substring, with the comma `,` and backslash `\` functioning as delimiter characters for values and ranges

These constant strings are decoded at runtime by the output and assigned integer keys starting from 1 in `$`, so they are decoded once rather than the encoded character range every time a substring of that script is decoded, this causes the program to run for a long time.

The compiler ignores the space and any sequence of 32 symbol characters, which are inserted when the string is assembled in the very last step of the program.

### Encoding substrings

In addition to encoding character ranges, the compiler also has to encode the strings based on those character ranges. Likewise for the character categories, the compiler groups the strings by category, and encodes them with the corresponding character set. The result is assigned a key from a generator function, which yields bijective strings from increasing natural numbers, skipping those already defined.

The substrings which do not contain any of the 32 symbol characters therefore have to be bijectively encoded with base 31, minus the backslash, except only with varying character sets. Hence from here on out, _base-31_ implies bijective base-31 encoded strings with these 31 characters as its digits.

#### Decimal digit substrings

Anything that is not a symbol is encoded as bijective, to and from strings of different character sets with `BigInt` as an intermediate data type. All the encoded values are stored with the 31 characters in an arbitrary order (`` _$-,;:!?.@*/&#%^+<=>|~()[]{}'"` ``).

Numeric-only substrings are decoded straight from base-32, and then converted into strings, wrapping the resultant `BigInt` inside a template literal thereby stripping its `n` suffix. All tokens that fall under this category have the categorical name `Digit`.

#### Alphanumeric substrings

Alphanumeric substrings follow the same rules as numbers. Zero-padded numeric strings are considered _alphanumeric_ since all leading zeroes are stripped. All tokens that fall under this category have the categorical name `Alnum`.

They are converted from `BigInt` values except this time from a constant digit string, which is the concatenation of Python's string constants `string.digits` and `string.ascii_letters`, or the first 62 digits of `base64`, and then hashed with the 31 characters in code point order, since it can be generated from the methods `Number#toString` and `String#toUpperCase`. This string,

<!-- prettier-ignore -->
```js
"0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
```

is generated with the expression

<!-- prettier-ignore -->
```js
[[...Array(36)].map((_,a)=>a.toString(36)),[...Array(26)].map((_,a)=>(a+10).toString(36).toUpperCase())].flat().join``
```

The compiler generates a `BigInt` from the encoded substring with the above constant string, and then encodes the resulting `BigInt` into a string with the corresponding encoding with the 31 characters.

#### Unicode characters

The compiler uses the same bijective numeration principle to encode the other Unicode characters as above, but each with their own character string which is generated by the compiler, with the function `encodeRange` not passed into runtime. The substrings are assigned the corresponding keys first; `decodeRange` decodes each Unicode substring before it can be used in the compiler.

The tokens are grouped according to their script, sorted according to frequency, "decoded" by their character string into a `BigInt` and encoded into base-31. Each key is then assigned a bijective-encoded string in increasing order.

The encoded strings and their keys are then placed inside an array destructuring operation, the keys on the left hand side and the encoded substrings on the right hand side. The right hand side with a mapper function that repeatedly decodes every substring as each key-substring pair is assigned to `$`. Each statement corresponds to one of the scripts or categories assigned by the compiler, with priority given to integer and alphanumeric strings.

### Tokenization

As soon as the regular expression encounters a non-ASCII letter, it begins a new token and matches all other Latin characters of the word and assigns that matched substring to the category `Latin`. The ASCII letter substring before is assigned `Alnum`. This is because the compiler captures ASCII alphanumeric substrings before capturing Latin-script substrings.

The same logic applies for a non-Latin Unicode script, and even other Unicode characters.

## Customizatio

Here is a list of customization options available:

-   `cacheVar` - the global variable defined to store substrings. It must be a valid, undefined JavaScript variable. The default is `'$'`.
-   `resultVar` - the global variables to store the output string. It must be a valid, undefined JavaScript variable. The default is `'_'`.
-   `strictMode` - Includes a `var` or `let` declaration, setting it at the beginning of the program. The default is `null`, which does not include a declaration.
-   `exportObject` - Whether to export the global object. The default is `false`.
-   `exportResult` - Whether to export the result string. The default is `true`.
-   `logObject` - Whether to log the global object. The default is `false`.
-   `logResult` - Whether to log the result string. The default is `false`.
-   `export` - Which key to export the string if `exportObject` is true. The default is `'object'`.
-   `export` - Which key to export the string if `exportResult` is true. The default is `'result'`.
-   `defaultQuote` - Quoting style to fall back to, if smart quoting is enabled. One of `single`, `double`, or `backtick`. The default is `double`.
-   `'objectQuote'` - Whether to quote keys inside objects and which quotes to use. `'none'` skips quoting identifier keys, so sequences of `_` and `$` will not be quoted. If `calc` is selected, all the keys will be quoted inside square brackets. The default is `'none'`; options are `'none'`, `'single'`, `'double'` or `'calc'`.
-   `smartQuote` - Whether or not to enable "smart" quoting; choosing quotes with the least number of escapes. If disabled, all strings inside the output, including object keys, will be quoted to `defaultQuote` and `objectQuote`. The default is `true`.
-   `tokenLength` - Maximum length of a tokenized substring, inclusive of punctuation. All tokens will thus be split into the desired length. The default is `64`.
-   `delimiter` - Which character to use to delimit `BigInt`-hashed substrings or character sets. The default is `','`.
-   `rangeDelimiter` - Which character to use to delimit ranges that `BigInt`-hashed character sets. The default is `'-'`.
-   `wrapInIIFE` - Whether to wrap the obfuscated code in an anonymous function call, using the `Function` constructor. The default is `false`.
-   `logResult` - Whether or not to log the obfuscated code in the console. The default is `false`.
-   `characterSet` - The character set to use to hash substrings in. The order need not matter, but each character must occur once. Default is `` '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' ``.

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
