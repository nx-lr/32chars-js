let fs = require('fs')
let V = require('voca')
let _ = require('lodash')
let jsesc = require('jsesc')
let XRegExp = require('xregexp')
let isValidIdent = require('is-valid-identifier')
let uglify = require('uglify-js')
let text = fs.readFileSync('./input.txt', 'utf8')

/**
 * PunkScript is a substitution encoding scheme that goes through three phases:
 *
 * - Initialization, where characters and values are assigned to variables;
 * - Substitution, where the variables are used to construct strings;
 */
console.log('Compiling...')

function encodeText(
    code,
    globalVar,
    {strictMode = false, variable = 'var', threshold = 2} = {}
) {
    let BUILTINS =
        /^(Array|ArrayBuffer|AsyncFunction|AsyncGenerator|AsyncGeneratorFunction|Atomics|BigInt|BigInt64Array|BigUint64Array|Boolean|DataView|Date|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|exports|Float32Array|Float64Array|Function|Generator|GeneratorFunction|globalThis|Infinity|Int16Array|Int32Array|Int8Array|Intl|isFinite|isNaN|JSON|Map|Math|module|NaN|Number|Object|parseFloat|parseInt|Promise|Proxy|Reflect|RegExp|Set|SharedArrayBuffer|String|Symbol|this|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|undefined|unescape|WeakMap|WeakSet|WebAssembly)$/

    let REGEXPS = {
        word: XRegExp(String.raw`[\pL\pN]+|[\b\n\f\r\t\v]+`, 'g'),
        symbol: /[!-\/:-@[-`{-~]+/g,
        unicode: /[^ -~]+/g,
    }

    /**
     * This regular expression splits the text into runs.
     * The literal space is ignored since it is the most used
     * character in plain text.
     */

    let REGEXP = RegExp(
        Object.entries(REGEXPS).map(([key, {source}]) => `(?<${key}>${source})`)
            .join`|`,
        'g'
    )

    console.log('Generating header...')

    // Test whether an identifier can be made into a variable
    if (!/[$_]+/.test(globalVar))
        throw new Error('globalVar should only contain characters _ or $')

    // Reject strings above the length of 2^29 to avoid going over the max string limit
    let MAX_STRING_LENGTH = 536870888,
        enUS = Intl.NumberFormat('en-us')
    if (code.length > MAX_STRING_LENGTH)
        throw new Error(
            `Input string can only be up to ${enUS.format(
                NODE_MAX_LENGTH
            )} characters long`
        )

    /**
     * Encase a string in literal quotes; finding the shortest
     * ASCII stringified representation of the original string.
     *
     * @example
     * print(quote`"'"`)
     * print(quote`\xff"\xad\n`)
     * print(quote`'json`)
     */

    let count = 0

    let quote = (string, key = false) => {
        if (key && isValidIdent(string)) return string

        let quoteSequence = ['single', 'double', 'backtick']
        if (key) quoteSequence.splice(2, 1)
        let quotedStrings = quoteSequence.map(quotes => [
            quotes,
            jsesc(string, {quotes, wrap: true}),
        ])
        quotedStrings = _.fromPairs(quotedStrings)

        let lengthMap = _.mapValues(quotedStrings, x => x.length)

        let lengthSorted = _.toPairs(lengthMap).sort(([, a], [, b]) => a - b)
        let [short, mid] = lengthSorted
        let lengthSet = new Set(_.values(lengthMap))
        let quotes = quoteSequence[count++ % quoteSequence.length]

        if ((key && lengthSet.size == 2) || (!key && lengthSet.size == 3)) {
            quotes = short[0]
        } else if (!key && lengthSet.size == 2) {
            quotes = [short[0], mid[0]].includes(quotes) ? quotes : short[0]
        } else {
            quotes = quotes || short[0]
        }

        return jsesc(string, {quotes, wrap: true})
    }

    /**
     * We have 32 characters: `` ;.!:_-,?/'*+#%&^"|~$=<>`@\()[]{} ``
     * and out of these, subtracting the bracket pairs, we now have
     * 26 characters, enough for the alphabet.
     *
     * So, we would use a cipher of our own, assigning a pair of
     * symbols to each letter of the English alphabet.
     * The first symbol, `$` or `_` determines if the symbol is uppercase or
     * lowercase.
     * The second is assigned an arbitrary symbol. `_` and `$` are reserved
     * for the two most common letters E and T.
     * X and Z are rarely used and therefore get the escape sequences which
     * are slightly longer.
     */

    let LETTERS = 'etaoinshrdlucmfwypvbgkqjxz'
    let CIPHER = '_$-,;:!?.@*/&#%^+<=>|~\'"`\\'
    let SPACE = '-'

    let encodeLetter = char =>
        (V.isUpperCase(char) ? '$' : '_') +
        CIPHER[LETTERS.indexOf(char.toLowerCase())]

    let encodeDigit = number =>
        (+number).toString(2).padStart(3, 0).split``.map(x =>
            x == 1 ? '$' : '_'
        ).join``

    /**
     * @example
     * print(encodeDigit(314))
     * print(encodeLetter('x'))
     */

    let CONSTANTS = {
        true: `!${quote('')}`, // ''==false
        false: '![]', // []==true
        undefined: '[][[]]', // [][[]] doesn't exist
        Infinity: `!${quote('')}/![]`, // true/false==1/0
        NaN: '+{}', // It makes sense
        '[object Object]': '{}', // [object objectLiteral]
    }

    // prettier-ignore
    let CONSTANT_VARIANTS = {
    "-1": [~[], ~{}],
    0: [+[]],
    1: [+!"", -~[]],
    true: [!""],
    false: [![], !{}],
    NaN: [+{}, +""],
    "[object Object]": [{}],
    Infinity: [!"" / ![], !"" / !{}, !"" / +[]],
    undefined: [""[""], ""[[]], ""[{}], [][""], [][[]], [][{}], {}[""], {}[[]], {}[{}]],
  };

    /**
     * STEP 1: BASIC NUMBERS AND DIGITS
     *
     * We start by assigning the value of the global variable "$" to -1
     * and simultaneously incrementing it by 1.
     *
     * We would use the current value of the global variable to extract
     * single characters from stringified representations of the constants.
     */

    function quoteKey(string) {
        return quote(string, true)
    }

    // The separator is a semicolon, not a comma.
    let output =
        (strictMode
            ? `${variable.trim().toLowerCase() == 'var' ? 'var' : 'let'}` +
              ` ${globalVar},_${globalVar};`
            : '') + `${globalVar}=~[];`

    // STEP 1
    let CHARMAP_1 = {}

    for (let [constant, expression] of Object.entries(CONSTANTS))
        for (let char of constant)
            if (/[\w\s]/.test(char) && !(char in CHARMAP_1))
                CHARMAP_1[char] = [expression, constant.indexOf(char)]

    let RES_CHARMAP_1 =
        `${globalVar}={` +
        [...Array(10)].map(($, digit) => [
            `${encodeDigit(digit)}:\`\${++${globalVar}}\``,
            ...Object.entries(CHARMAP_1)
                .filter(([, [, value]]) => value == digit)
                .map(
                    ([char, [literal]]) =>
                        `${quoteKey(
                            char == ' ' ? '-' : encodeLetter(char)
                        )}:\`\${${literal}}\`[${globalVar}]`
                ),
        ]) +
        '}'

    output += RES_CHARMAP_1

    /**
     * STEP 2: LITERALS AND CONSTRUCTORS
     *
     * Now that we have the basic characters, we now can use these
     * letters to form some words, such as "concat", "call", "join",
     * "slice", and even the longer word "constructor".
     *
     * We would use the constructors to retrieve some more letters,
     * such as v, g, m and some capitals such as A, S, N, R, E, and F.
     *
     * v is extracted from the word "native", which is gotten from
     * the stringified version of any one of these constructors.
     *
     * @example
     * Array.constructor.toString() ==
     * 'function Array() { [native code] }';
     * @end
     */

    // These will be explained later in the next section.
    let IDENT_MAP_1 = {
        call: '!',
        concat: '+',
        constructor: '$',
        join: '%',
        return: '_',
        slice: '/',
        source: ',',
    }

    // And these are what we would achieve from there:
    let CONSTRUCTORS = {
        Array: '[]',
        Boolean: '(![])',
        Function: '(()=>{})',
        Number: '(~[])',
        RegExp: '/./',
        String: quote(''),
    }

    let CHARMAP_2 = {...CHARMAP_1}

    for (let [key, expression] of Object.entries(CONSTRUCTORS)) {
        let index
        let constructor = eval(key).toString()
        for (let char of constructor)
            if (/[\w\s]/.test(char) && !(char in CHARMAP_2))
                CHARMAP_2[char] = [
                    expression,
                    (index = constructor.indexOf(char)),
                ]
    }

    for (let value of Object.entries(CHARMAP_2)) {
        let [char, [expression, index]] = value
        let expansion = `\`\${${expression}[${globalVar}.$]}\`[${`${index}`
            .split``.map(digit => `${globalVar}.${encodeDigit(digit)}`)
            .join`+`}]`
        if (!(char in CHARMAP_1))
            CHARMAP_2[char] = [expression, index, expansion]
    }

    let objDiff = (x, y) =>
        Object.fromEntries(
            _.difference(Object.keys(x), Object.keys(y)).map(z => [z, x[z]])
        )
    let DIFF_CHARMAP_2 = objDiff(CHARMAP_2, CHARMAP_1)

    let RES_CHARMAP_2 =
        `${globalVar}={...${globalVar},` +
        Object.entries(DIFF_CHARMAP_2).map(
            ([letter, [, , expansion]]) =>
                `${quoteKey(encodeLetter(letter))}:${expansion}`
        ) +
        '}'

    /**
     * STEP 2.1: FORMING WORDS
     *
     * From here on out, we are going to form multiple identifier
     * strings by encoding each character in the identifier using
     * the cipher we have previously defined.
     *
     * We will use the cipher to access their corresponding single
     * character entries in the global object, while *also* assigning
     * those constant strings to the global object as well, this time
     * with single character keys.
     *
     * The strings `constructor` is so common and therefore would have
     * the least expansion.
     *
     * @example
     * 'constructor' ==
     *    $['_!'] +
     *    $['_&'] +
     *    $['_%'] +
     *    $['_~'] +
     *    $._$ +
     *    $['_|'] * +$['_='] +
     *    $['_!'] +
     *    $._$ +
     *    $['_&'] +
     *    $['_|']
     */

    let encodeString = str =>
        String(str).replace(/\W/g, '').split``.map(char => {
            if (/[$_]/.test(char)) {
                return quote(char)
            } else if (char === ' ') {
                return `${globalVar}[${quote('-')}]`
            } else if (/\d/.test(char)) {
                return `${globalVar}.${encodeDigit(char)}`
            } else if (/[A-Z]/.test(char) && /[^A-FINORSU]/.test(char)) {
                let lower = char.toLowerCase()
                let encoded = encodeLetter(lower)
                let result = isValidIdent(encoded)
                    ? `${globalVar}.${encoded}`
                    : `${globalVar}[${quote(encoded)}]`
                return `${result}[${globalVar}[${quote('"')}]]()`
            } else {
                let encoded = encodeLetter(char)
                if (isValidIdent(encoded)) return `${globalVar}.${encoded}`
                else return `${globalVar}[${quote(encoded)}]`
            }
        }).join`+`

    let encodeProps = props =>
        `${globalVar}={...${globalVar},` +
        Object.entries(props)
            .map(([prop, key]) => [key, encodeString(prop)])
            .map(([key, expr]) => `${quoteKey(key)}:${expr}`) +
        '}'

    output += ';' + encodeProps(IDENT_MAP_1)
    output += ';' + RES_CHARMAP_2

    let IDENT_MAP_2 = {
        entries: ';',
        fromEntries: '<',
        indexOf: '#',
        map: '^',
        name: '?',
        repeat: '*',
        replace: ':',
        split: '|',
    }

    output += ';' + encodeProps(IDENT_MAP_2)

    /**
     * STEP 3: FUNCTIONS
     *
     * Now that we have gotten even more letters, we can form even
     * more words, such as `eval`, `escape`, `name`, `replace` and
     * `repeat`, useful functions for us to retrieve even more letters.
     *
     * We would need to retrieve the useful `eval` function for us to
     * invoke and convert Unicode strings into arbitrary Unicode code
     * points as escapes.
     *
     * The `escape` function would help us retrieve the characters C and D
     * from the code points of our palette of ASCII symbols.
     */

    let GLOBAL_FUNC = {
        escape: '>',
        eval: '=',
        parseInt: '~',
    }

    let RES_FUNCTIONS_1 =
        `${globalVar}={...${globalVar},` +
        Object.entries(GLOBAL_FUNC).map(
            ([ident, shortcut]) =>
                `${quoteKey(shortcut)}:(()=>{})[${globalVar}.$]` +
                `(${globalVar}._+${globalVar}[${quote('-')}]+${encodeString(
                    ident
                )})()`
        ) +
        '}'

    output += ';' + RES_FUNCTIONS_1

    /**
     * We would need to get the method `toString` by getting the `name`
     * of the `String` constructor, for us to retrieve the rest of the
     * alphabet, and use to retrieve words from 64-bit float numbers.
     *
     * We would use the escape function to get the letters C and D
     * by escaping it as a URL and then getting the last digit of
     * the codepoint which is always uppercase.
     *
     * All invalid URL characters are immediately converted to the
     * format `%XX` where `X` is a hexadecimal digit in uppercase.
     *
     * Since `-` is a valid URL character, `=` will be used instead
     * since it has semantic meaning in URLs (key-value pairs).
     *
     * @example
     * $.C = escape(',')[2]
     * $.D = escape(',')[2]
     * @end
     */

    output +=
        ';' +
        `${globalVar}={...${globalVar},` +
        [
            [
                quoteKey("'"), // toString
                `${encodeString('to')}+` +
                    `${quote('')}[${globalVar}.$]` +
                    `[${globalVar}[${quote('?')}]]`,
            ],
            [
                quoteKey(encodeLetter('C')), // C
                `${globalVar}[${quote('>')}]` +
                    `(${quote('<')})` +
                    `[${globalVar}.${encodeDigit(2)}]`,
            ],
            [
                quoteKey(encodeLetter('D')), // D
                `${globalVar}[${quote('>')}]` +
                    `(${quote('=')})` +
                    `[${globalVar}.${encodeDigit(2)}]`,
            ],
        ].map(x => x.join`:`) +
        '}'

    /**
     * `U` is created from calling `toString` prototype on an empty object.
     *
     * @example
     * Object.toString.call().toString()[8]
     * `${{}.toString.call()}`[8]
     * @end
     *
     * We would use `U` and `C` to form the method name `toUpperCase`,
     * to retrieve the remaining uppercase letters. We would also form the
     * `Date` and `Buffer` constructors here for future use.
     *
     * The four other letters we would need to generate are the five
     * lowercase letters h, k, q, w and z, also using the toString
     * method, but this time they are converted from numbers.
     */

    let CIPHER_FROM = '0123456789abcdefghijklmnopqrstuvwxyz'

    output +=
        ';' +
        `${globalVar}={...${globalVar},` +
        [
            [
                quoteKey(encodeLetter('U')), // C
                `\`\${{}[${globalVar}[${quote("'")}]]` +
                    `[${globalVar}[${quote('!')}]]()}\`` +
                    `[${globalVar}.${encodeDigit(8)}]`,
            ],
            ...[...'hkqwz'].map(letter => [
                quoteKey(encodeLetter(letter)),
                `(+(${encodeString(CIPHER_FROM.indexOf(letter))}))` +
                    `[${globalVar}[${quote("'")}]](${encodeString(36)})`,
            ]),
        ].map(x => x.join`:`) +
        '}'

    let IDENT_MAP_3 = {
        fromCharCode: '@',
        keys: '&',
        raw: '`',
        toUpperCase: '"',
    }

    output += ';' + encodeProps(IDENT_MAP_3)

    /**
     * TRANSFORMATION
     *
     * The transformation stage forms the bulk of the document.
     * The text is split into runs of various sizes, each containing
     * a different set of characters. These include:
     *
     * - Whitespace.
     * - All 32 ASCII punctuation and symbol characters, which are
     *   included literally without change.
     * - All strings already defined in the output document, which are:
     *   - strings used for properties and method names
     *   - constructor names
     *   - constants (except null)
     *   and all substrings, 2 characters or more thereof, all
     *   next to word boundaries.
     * - Runs of all other characters, including Unicode sequences,
     *   ignoring all boundaries.
     */

    let CIPHER_TO = '_.:;!?*+^-=<>~\'"`/|#$%&@{}()[]\\,'
    let IDENT_MAP = {...IDENT_MAP_1, ...IDENT_MAP_2, ...IDENT_MAP_3}

    /**
     * TRANSFORMATION
     *
     * These functions encode the text using bijective numeration, where
     * every string with a given character set can be represented with a
     * natural number and vice versa.
     *
     * BigInt is used as an intermediate data type for conversion between
     * the 32 characters and the input text.
     */
    function encodeBijective(int, chars) {
        chars = [...new Set(chars)]
        var b = BigInt
        var base = b(chars.length)
        var index = (int = b(int)) % base || base
        var result = chars[index - 1n]
        if (int <= 0n) return ''
        else
            while ((int = (int - 1n) / base) > 0n)
                result = chars[(index = int % base || base) - 1n] + result
        return result
    }

    function decodeBijective(str, chars) {
        chars = [...new Set(chars)]
        str = [...str]
        var b = BigInt
        var result = 0n
        var base = b(chars.length)
        var strLen = str.length
        for (var index = 0; index < strLen; index++)
            result +=
                b(chars.indexOf(str[index]) + 1) * base ** b(strLen - index - 1)
        return result
    }

    function compressRange(chars, digits, sep = ',', sub = '.') {
        digits = [...new Set(digits)].filter(
            digit => digit != sep && digit != sub
        ).join``

        return [...new Set(chars)]
            .map(char => char.codePointAt())
            .sort((x, y) => x - y)
            .reduce((acc, cur, idx, src) => {
                var prev = src[idx - 1]
                var diff = cur - prev
                if (idx > 0 && diff == prev - src[idx - 2]) {
                    var last = acc.length - 1
                    acc[last][1] = cur
                    if (diff > 1) acc[last][2] = diff
                } else acc.push([cur])
                return acc
            }, [])
            .map(num => num.map(x => encodeBijective(x, digits)).join(sub))
            .join(sep)
    }

    function expandRange(run, digits, sep = ',', sub = '.') {
        function range(start, end, step = 1, offset = 0) {
            var direction = start < end ? 1 : -1
            return [
                ...Array(
                    (Math.abs(end - start) + offset * 2) / step + 1
                ).keys(),
            ].map(
                index => start - direction * offset + direction * step * index
            )
        }

        digits = [...new Set(digits)].filter(
            digit => digit != sep && digit != sub
        ).join``

        return run
            .split(sep)
            .map(end => {
                var res = end
                    .split(sub)
                    .map(num => +([] + decodeBijective(num, digits)))
                return res.length == 1 ? res : range(...res)
            })
            .flat()
            .map(p => String.fromCodePoint(p))
            .sort((x, y) => x.localeCompare(y)).join``
    }

    let encodeFunction = (func, others) => {
        let count = 1,
            digits = '_$'

        let code = uglify
            .minify(`${func}`, {compress: {reduce_funcs: true}})
            .code.replace(/^function \w+/, '')
            .replace('){', ')=>{')

        let variables = [...new Set(code.match(/\b[a-z]\b/g))]
        variables = Object.fromEntries(
            variables.map(v => [
                v,
                encodeBijective(count++, digits) + globalVar,
            ])
        )

        let result = code
            .replace(
                RegExp(`\\b(${Object.keys(variables).join`|`})\\b`, 'g'),
                x => variables[x]
            )
            .match(/[a-zA-Z\d ]|[^a-zA-Z\d ]+/g)
            .map(x =>
                x == ' '
                    ? `${globalVar}[${quote('-')}]`
                    : /[a-zA-Z\d]/.test(x)
                    ? encodeString(x)
                    : quote(x)
            ).join`+`

        console.log(code + '\n')

        return `${globalVar}[${quote('=')}](${result})`
    }

    /**
     * UTF-16 STRINGS
     *
     * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
     * As such, strings can be broken down into their meaningful
     * code points.
     *
     * Every code point is converted into integers, and each is
     * converted into base 31 so that all characters, save for the
     * comma `,`, are used. Every resulting digit is ciphered.
     *
     * The comma is used as it is syntactically used to separate
     * array elements, which are the ciphered digit substrings.
     * When `.toString` is called, the commas come in, therefore
     * there's no need to explicitly write `.join(',')`.
     */

    let alnumBase32 = s =>
        parseInt(s, 36).toString(32).split``.map(
            c => CIPHER_TO[CIPHER_FROM.indexOf(c)]
        ).join``

    let alnumBase32Decode = a =>
        parseInt(
            a.split``.map(a => CIPHER_FROM[CIPHER_TO.indexOf(a)]).join``,
            32
        ).toString(36)

    let uniBase31 = s =>
        `${[...Array(s.length)].map(
            (x, i) =>
                [...s.charCodeAt(i).toString(31)].map(
                    c => CIPHER_TO[CIPHER_FROM.indexOf(c)]
                ).join``
        )}`

    let uniBase31Decode = a =>
        a.split`,`
            .map(a =>
                parseInt(
                    [...a].map(a => CIPHER_FROM[CIPHER_TO.indexOf(a)]).join``,
                    31
                )
            )
            .map(a => String.fromCharCode(a)).join``

    /**
     * UTF-16 STRINGS
     *
     * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
     * As such, strings can be broken down into their meaningful
     * code points.
     *
     * Every code point is converted into integers, and each is
     * converted into base 31 so that all characters, save for the
     * comma `,`, are used. Every resulting digit is ciphered.
     *
     * The comma is used as it is syntactically used to separate
     * array elements, which are the ciphered digit substrings.
     * When `.toString` is called, the commas come in, therefore
     * there's no need to explicitly write `.join(',')`.
     *
     * This makes it a heck ton easier to encode expressions with just
     * a few surgical regex substitutions.
     */

    let UNICODE_MACRO =
        'a=>a.split`,`.map(a=>parseInt(a.split``.map(a=>CIPHER_FROM[CIPHER_TO.indexOf(a)]).join``,31)).map(a=>String.fromCharCode(a)).join``'
            .replace(
                'CIPHER_FROM',
                '[...Array(+(36)).keys()].map(a=>a.toString(36))'
            )
            .replace('CIPHER_TO', quote(CIPHER_TO))
            .replace(/\.toString\b/g, ident => `[${globalVar}[${quote("'")}]]`)
            .replace(/\b\d+\b/g, match => encodeString(match))
            .replace('parseInt', `${globalVar}[${quote('~')}]`)
            .replace(/\ba\b/g, '_' + globalVar)
            .replace(
                /\.\b(keys|split|map|indexOf|join|fromCharCode)\b/g,
                p1 => `[${globalVar}[${quote(IDENT_MAP[p1.slice(1)])}]]`
            )
            .replace(
                /\b(Array|String)\b/g,
                match => `${CONSTRUCTORS[match]}[${globalVar}.$]`
            )

    let ALNUM_MACRO =
        'a=>parseInt(a.split``.map(a=>CIPHER_FROM[CIPHER_TO.indexOf(a)]).join``,32).toString(36)'
            .replace(
                'CIPHER_FROM',
                '[...Array(+(36)).keys()].map(a=>a.toString(36))'
            )
            .replace('CIPHER_TO', quote(CIPHER_TO))
            .replace('Array', match => `[][${globalVar}.$]`)
            .replace('parseInt', `${globalVar}[${quote('~')}]`)
            .replace(/\.toString\b/g, ident => `[${globalVar}[${quote("'")}]]`)
            .replace(/\b\d+\b/g, match => encodeString(match))
            .replace(/\ba\b/g, '_' + globalVar)
            .replace(
                /\.\b(keys|map|indexOf|join)\b/g,
                p1 => `[${globalVar}[${quote(IDENT_MAP[p1.slice(1)])}]]`
            )

    output += ';' + `${globalVar}[+[]]=${UNICODE_MACRO}`
    output += ';' + `${globalVar}[~[]]=${ALNUM_MACRO}`

    /**
     * UTF-16 STRINGS
     *
     * Strings are encoded in JavaScript as UTF-16, and not UTF-8.
     * As such, strings can be broken down into their meaningful
     * code points.
     *
     * Every code point is converted into integers, and each is
     * converted into base 31 so that all characters, save for the
     * comma `,`, are used. Every resulting digit is ciphered.
     *
     * The comma syntactically used to separate array elements,
     * which are the ciphered digit substrings. When `.toString`
     * is called, the commas magically appear, therefore
     * there's no need to explicitly write `.join(',')`.
     */

    console.log('Header generated')
    console.log('Mapping keys...')

    // CONSTANTS
    let RE_CONSTANTS = [
        'true',
        'false',
        'Infinity',
        'NaN',
        'undefined',
        Object.keys(IDENT_MAP),
    ].flat()

    /**
     * PART 4: ENCODING
     *
     * We will now encode the string by matching all word patterns in the
     * string, ranking them by their frequency and then assigning symbol keys
     * to these values in base 32, skipping over all the keys which have been
     * already defined.
     *
     * These strings are referenced later on when we begin assembling the
     * string.
     */

    keyGen = (function* () {
        let digitsTo = CIPHER_TO,
            digitsFrom = '0123456789abcdefghijklmnopqrstuvwxyz'

        let existingKeys = new Set(
            [
                "'", // toString
                '-', // space
                Object.values(IDENT_MAP),
                Object.values(GLOBAL_FUNC),
                [...'abcdefghijklmnopqrstuvwxyz'].map(encodeLetter),
                [...'ABCDEFINORSU'].map(encodeLetter),
                [...'0123456789'].map(encodeDigit),
            ].flat()
        )

        for (let i = 1; ; i++) {
            let key = encodeBijective(i, digitsTo)
            if (!existingKeys.has(key)) yield key
        }

        return
    })()

    // TESTS
    let testParseInt = x =>
        /^[1-9a-z][\da-z]+$/.test(x) &&
        parseInt(x, 36) <= Number.MAX_SAFE_INTEGER
    let testParseIntUpper = x =>
        /^[1-9A-Z][\dA-Z]+$/.test(x) &&
        parseInt(x, 36) <= Number.MAX_SAFE_INTEGER

    let testRawString = string => {
        try {
            if (/(?<!\\)\$\{/.test(string)) throw new Error()
            eval(`(\`${string}\`)`)
            return true
        } catch {
            return false
        }
    }

    let WORD_MAP = (() => {
        let words = code.match(REGEXPS.word) ?? []

        let wordMap = Object.entries(_.countBy(words))
            .filter(([word, frequency]) => {
                let alreadyDefined = [
                    ...Object.keys({
                        ...IDENT_MAP,
                        ...CONSTRUCTORS,
                        ...CONSTANTS,
                    }),
                    ...(CIPHER_FROM + 'ABCDEFINORSU'),
                ]
                return !alreadyDefined.includes(word) && frequency > threshold
            })
            .sort(([c, a], [d, b]) => b - a || c.length - d.length)
            .map(([word]) => [word, keyGen.next().value])

        return Object.fromEntries(wordMap)
    })()

    output +=
        ';' +
        `${globalVar}={...${globalVar},[+!${quote('')}]:{` +
        Object.entries(WORD_MAP)
            .map(([word, key]) => {
                let prefix = testParseInt(word)
                    ? '-'
                    : testParseIntUpper(word)
                    ? '='
                    : '_'
                let expansion =
                    prefix +
                    (prefix == '_' ? uniBase31(word) : alnumBase32(word))
                return `${quoteKey(key)}:${quote(expansion)}`
            })
            .sort((x, y) => x.length - y.length || x.localeCompare(y)) +
        '}}'

    let WORD_MAP_EXPR =
        "WORD_MAP=Object.fromEntries(Object.entries(WORD_MAP).map(([k,v])=>[k,v[0]=='-'?globalVar[-1](v.slice(1)):v[0]=='='?globalVar[-1](v.slice(1)).toUpperCase():globalVar[0](v.slice(1))]))"
            .replace(/\b(v)\b/g, match => '_' + globalVar)
            .replace(/\b(k)\b/g, match => '$' + globalVar)
            .replace(/\b(0)\b/g, match => '+[]')
            .replace(/\b(-1)\b/g, match => `~[]`)
            .replace(/\b(1)\b/g, match => `+!${quote('')}`)
            .replace(/\b(WORD_MAP)\b/g, `${globalVar}[+!${quote('')}]`)
            .replace(/\b(globalVar)\b/g, globalVar)
            .replace(/\b(Object)\b/g, match => `{}[${globalVar}.$]`)
            .replace(
                /\.\b(map|slice|entries|fromEntries|toUpperCase)\b/g,
                p1 => `[${globalVar}[${quote(IDENT_MAP[p1.slice(1)])}]]`
            )

    output += ';' + WORD_MAP_EXPR
    output +=
        ';' + `${globalVar}={...${globalVar},...${globalVar}[+!${quote('')}]}`

    console.log('Keys mapped')
    console.log('Parsing and subbing...')

    /**
     * PART 5: SUBSTITUTION
     *
     * We would first split up the text into spaces so we can join
     * the result into a string later on. Spaces are represented
     * with empty elements in an array and returned with joins.
     */

    let transform = substring =>
        [...substring.matchAll(REGEXP)].map(match => {
            let [group, substring] = Object.entries(match.groups).filter(
                ([, val]) => !!val
            )[0]
            switch (group) {
                case 'symbol': {
                    if (substring.includes('\\') && testRawString(substring))
                        return `${quote(
                            ''
                        )}[${globalVar}.$][${globalVar}[${quote(
                            '`'
                        )}]]\`${substring}\``
                    else return quote(substring)
                }

                case 'unicode': {
                    let encoded = uniBase31(substring)
                    return `${globalVar}[+[]](${quote(encoded)})`
                }

                case 'word': {
                    switch (true) {
                        case /\b[\da-zA-FINORSU]\b/.test(substring): {
                            return encodeString(substring)
                        }
                        case typeof CONSTANTS[substring] == 'string': {
                            return `\`\${${CONSTANTS[substring]}}\``
                        }
                        case typeof CONSTRUCTORS[substring] == 'string': {
                            return `${
                                CONSTRUCTORS[substring]
                            }[${globalVar}.$][${globalVar}[${quote('?')}]]`
                        }
                        case typeof IDENT_MAP[substring] == 'string': {
                            if (isValidIdent(IDENT_MAP[substring]))
                                return globalVar + '.' + IDENT_MAP[substring]
                            else
                                return (
                                    globalVar +
                                    `[${quote(IDENT_MAP[substring])}]`
                                )
                        }
                        case typeof WORD_MAP[substring] == 'string': {
                            return `${globalVar}[${quote(WORD_MAP[substring])}]`
                        }
                        case testParseIntUpper(substring): {
                            let encoded = alnumBase32(substring)
                            return `${globalVar}[~[]](${quote(
                                encoded
                            )})[${globalVar}[${quote('"')}]]()`
                        }
                        case testParseInt(substring): {
                            let encoded = alnumBase32(substring)
                            return `${globalVar}[~[]](${quote(encoded)})`
                        }
                        default: {
                            let encoded = uniBase31(substring)
                            return `${globalVar}[+[]](${quote(encoded)})`
                        }
                    }
                }
            }
        }).join`+`

    let expression =
        '[' +
        code.split` `.map(transform) +
        ']' +
        `[${globalVar}[${quote('%')}]]` +
        `(${globalVar}[${quote('-')}])`

    output += ';' + `_${globalVar}=${expression}`

    // Export
    output += ';' + 'module.exports.result=_' + globalVar

    console.log('Script complete!')

    return {
        result: output,
        stats: `
=====
STATS
=====
Input length: ${enUS.format(code.length)}
Expression length: ${enUS.format(expression.length)}
Ratio: ${expression.length / code.length}
Output length: ${enUS.format(output.length)}`,
    }
}

let {result, stats} = encodeText(text, '$', {
    strictMode: true,
})

console.log(stats)

fs.writeFileSync('./output.js', result)
