# 32chars.js

Punctuation-Only JavaScript

## About

32chars.js is a JavaScript code encoder that encrypts JavaScript code or any piece of text into the shortest possible valid JavaScript code made with only 32 ASCII symbol and punctuation characters; no letters, numbers, spaces, or special characters: `` `~!@#$%^&*()_+{}|:"<>?-=[]\;',./ ``.

This project is the spiritual successor to many JavaScript code obfuscators out there such as JSF\*ck, XChars.js and Hieroglyphy, but is most influenced by the first, JJEncode.

## History

JavaScript is weird. And one thing people _really_ hate about JavaScript is because of the way it evaluates expressions. And because of this, people have tried many ways to "exploit" this very "flaw" of JavaScript, which gave rise to "compilers" obfuscating JavaScript using only punctuation characters.

The first such compiler was jjencode, which came out in Jul 2009, using 18 characters: `[]()!+,\"$.:;_{}~=`. A few months later in Jan 2010, an informal competition was held in the Slackers forum, bringing down the minimum number of characters to eight `[]()!+,/`. Soon enough, contributors managed to remove the need for the characters `,/`, thus bringing the minimum to 6 `[]()!+`.

These encoders follow a pattern, first creating single digits by repeatedly adding 1, or concatenating digits to form higher numbers. Next, they evaluate an expression using said characters, converting them into strings and accessing a character with an index. This process is then repeated to yield new letters until a more general method of retrieving unmapped characters is found, such as `eval` or `String.fromCharCode`.

It is because of this repetition that certain single characters require more than a thousand characters when expanded. However, we will take a step back and look on the other side of things: what if there was an encoder that does the same thing as all this: obfuscating code with only symbols; but achieves the minimum code length possible?

## How it works, roughly

### Initialization

The program uses a multi-phase substitution encoding. Characters and values are assigned to variables and properties, which then are referenced and used to build back the input string. Some strings are "edge cases" and hence require nifty hacks along the way.

### Statement 1

JavaScript variable names are flexible in the characters that can be used, so the above variable name of `$` is valid. So is `_`.

Unlike a number of other languages, such as Python, PHP and Perl, the dollar sign is not a reserved character and therefore able to be used in any part of the variable name. This allows variables to e formed with any combination of `_` and `$` characters, such as `$_`, `$$$`, and `_$_`.

Because you want to sound hip, yes, the dollar sign can be used in variables. `Ke$ha` and `A$AP_Rocky` are valid JavaScript identifier.

The program starts out by assigning a global variable `$` with the value of `~[]`. The tilde, `~` indicates a unary bitwise NOT operation on an empty array which is numerically equivalent to `0`. This evaluates to `-1`.

This line, ignoring the global variable, is exactly the same as in JJEncode. The second line shares a similar concept to it.

### Statement 2

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

### Statement 3

From the third line, we will use the letters we have got to form new words by concatenating existing single case sensitive letters with the `+` operator to form property names as strings. These words, when inserted inside square brackets, are then used to access properties on values or call methods on them. For instance `{}["constructor"]`.

With the `constructor` property, we can access the constructors of literals, like `Array` `[]`, `String` `''`, `Number` `+[]`, `Boolean` `![]`, `RegExp` `/./` and `Function` `()=>{}` (leaving out `Object`), and like what we did before, converting that constructor function into a string. This yields something like `function Array { [native code] }`, where when evaluated in a JavaScript interpreter. We now have the letters `A B E F g m p R S v x`.

In total, this yields us with 22 lowercase `a b c d e f g i j l m n o p r s t u v x y` and 9 uppercase letters `A B E F I N O R S`. We make sure to store every word and letter we have found with a unique key so that we can refer to it later on in our code.

To save up on statements, we use the spread operator `...` to "spread out". In this case, we are cloning the object by spreading out its properties on a _new_ object with new keys defined, before reassigning that object back to itself.

### Statement 4 and beyond

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

32chars.js stands out from other encoders. With a large character set, we can form string literals without the need for substitution, other than escaping characters. Using strings, we are free to create custom encoding schemes to significantly shorten and randomize this output.

For modernity sake, we _can_ use the newest JavaScript syntax and functionality; this means tons of new and nifty ways to represent, encode and create strings:

- Template strings
- String interpolation
- Arrow functions
- RegExp literals
- `BigInt` literals
- ES6 `String`, `Array` and `Object` methods

A generator function yields us every possible string with those same characters (skipping the keys already defined) since each arbitrary string formed from a finite set of characters corresponds to positive number. A one-on-one correspondence is called bijection.

Going over each character one by one is overly lengthy and repetitive, thus going against encryption. It is shorter and faster to break the string down into substrings and doing one thing to each. This way, we can effectively minimize the number of operations the interpreter has to execute, and also the overall length of the obfuscated output code.

The algorithm tries its best to perform optimizations to minimize this repetition, though this performance drawback is somewhat unhampered. Compilation takes between 2 and 3 seconds for about a million characters in minified source code, and 5 seconds for an entire novel.

The text is parsed and lexed into tokens, which then are assigned categories. But unlike a regular compiler, there is no _grammar_ to check against, so there is no errors. Instead, the text is (recursively) parsed into these tokens. The parser recognizes six different types of tokens: numbers, ASCII alphanumerics, control characters,

By default, the parser would split the entire text with the space as its delimiter, with the split elements going into an array and separated with commas. JavaScript ignores trailing commas, and so we have to explicitly add a trailing comma if the final element of the output array is empty.

The input string is further subdivided and categorized into substrings of different character types, such as alphanumerics (both cases treated separately), decimal numbers and arbitrary sequences of Unicode symbols from a given character set, minus CJK, symbol, punctuation and private-use characters.

The output contains an anonymous decryption function with two parameters: the encoded data itself, and the category of substring or mode to decrypt to. This second argument may also contain additional arguments such as encoded character ranges. All of the encoded strings will pass through the decryptor.

### Symbol sequences and string literals

Runs with only the printable ASCII symbols are quoted into string literals. Usually the runs do not contain any characters used to wrap strings: `` '"` ``. The backslash, and whatever symbol is being used for wrapping these literals, are escaped. In template literals, the sequence `${` which begins an interpolation sequence, is also escaped.

Each (encoded) substring goes through a quoting function which compares the lengths of the stringified substring and selects the shortest. It also prioritizes the "fallback" quoting option, so most strings which do not contain any escaped characters would be quoted as such.

If the runs also contain a backslash, then there are two other options for representing that string: using the `String.raw` function, or from a `RegExp` literal delimited with slashes when calling `toString`, or without, from the `source` property. However some strings when interpreted literally result in a syntax error, so those strings are escaped.

### Numbers

From here on out, we would primarily use big integers, or the new primitive data type added in ES8, `BigInt` as an intermediate data type to store most of our strings. Many of the encoding methods use bijective encoding, due to the fact that any arbitrary sequence of digits from a given set has a single numeric representation.

Numeric-only substrings are encoded as bijective base 32 using all the 32 characters. Zero padding is done as an additional step, for substrings with leading zeroes.

### Alphanumerics

Alphanumeric substrings follow the same rules as numbers, except this time the substring is parsed as a number with a base higher than 10, depending on the position of the last letter in the substring. This number is encoded as bijective base 32.

By default, `toString()` yields lowercase. So if the original substring contains uppercase letters, then the positions of those characters in the substring will be converted into uppercase using compressed ranges. If the entire string is uppercase, then the string would be converted directly into uppercase.

### Words with diacritics

For substrings which contain a mixture of ASCII letters and non-ASCII characters, including letters with diacritics.  

The non-ASCII characters are then inserted through an implementation of the _Bootstring_ algorithm. The substring does not go through Unicode normalization.

### Other writing systems and languages

For substrings of a different Unicode script other than Latin, they are generated from a pool of characters sorted by frequency in the input text, case-insensitively. The result is encoded as bijective base 32 using the pool of characters, and converted from base 32.

For bicameral scripts, like Cyrillic and Greek, see the section on [alphanumerics](#alphanumerics).

### Arbitrary Unicode sequences

For other Unicode characters, including CJK, special, private-use, non-printable and spacing characters, and even astral code points, they are converted from their hexadecimal values and grouped into smaller subsequences based on their leading digits. All leading zeroes are stripped when encoded and added back when decoded.

This would yield values on two sides: the "keys" being the leading and the "values" being the trailing digits that are not encoded. Both key and value pairs are converted from bijective base 16 into bijective base 30. `,` and `:` are reserved for separating keys and values.

### Other optimizations

In string literals, if any part of the string contains backslashes, If a string contains a long enough repetitive pattern, then the string is "divided" then repeated by its "common factor".

If two different substrings have a Jaro distance exceeding a certain threshold, then the insertions, substitutions and deletions would be performed with the `replace` function.

## Disclaimer

Only obfuscate things that belong to you. This repository and its command line program, and the code shall not be used for any malicious purpose whatsoever. **I AM NOT RESPONSIBLE FOR ANY DAMAGE CAUSED BY THE PROGRAM NOR THE GENERATED CODE.**
