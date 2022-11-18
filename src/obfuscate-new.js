let V = require('voca')
let XRegExp = require('xregexp')
let _ = require('lodash')
let fs = require('fs')
let genex = require('genex')
let glob = require('glob')
let isValidIdent = require('is-valid-identifier')
let jsesc = require('jsesc')
let uglify = require('uglify-js')
let regenerate = require('regenerate')

let text = fs.readFileSync('./input.txt', 'utf8')

encode(text)

function encode(text, globalVar = '$', nGramLength = 256) {
  console.info('Fetching Unicode data')

  // INITIALIZATION

  let letters = 'etaoinshrdlucmfwypvbgkqjxz'
  let cipher = '_$-,;:!?.@*/&#%^+<=>|~\'"`\\'
  let alnumLower = '0123456789abcdefghijklmnopqrstuvwxyz'

  let punct = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~'
  let alnumDigits =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

  let constantExprs = {
    '-1': /[+~]\[]/,
    0: /\+(\[]|""|''|``)/,
    1: /\+!(""|''|``)|-~\[]/,
    true: /!(""|''|``)/,
    false: /!({}|\[])/,
    NaN: /\+{}/,
    Infinity: /!(""|''|``)\/(!({}|\[])|\+(\[]|""|''|``))/,
    undefined: /(""|''|``|\[])\[(""|''|``|\[]|{})\]/,
    '[object Object]': /{}/,
  }

  constantExprs = _.mapValues(constantExprs, x => genex(x).generate())

  let constructorExprs = {
    Array: /\[]/,
    Boolean: /\(!(""|''|``|{}|\[])\)/,
    Function: /\([_$]=>(""|''|``|{}|\[])\)/,
    Number: /\([+~](""|''|``|{}|\[])\)/,
    String: /""|''|``/,
    RegExp: /\/[!-',-.:->@\]-`{-~]\//,
    Object: /{}/,
  }

  constructorExprs = _.mapValues(constructorExprs, x => genex(x).generate())

  let wordCipher1 = {
    // methods
    filter: '^',
    join: '+',
    slice: '/',
    sort: '>',
    // properties
    constructor: '$',
    source: '.',
    // keywords
    for: '*_',
    if: '!_',
    return: '_',
  }

  let wordCipher2 = {
    // methods
    indexOf: '#',
    map: '%',
    repeat: '*',
    replace: '"',
    reverse: '<',
    split: '|',
    // properties
    name: '?',
    // constructors
    BigInt: '++',
    Set: '--',
    // keywords
    var: '=_',
  }

  let globalFunctions = {
    // functions
    escape: '&',
    eval: '=',
  }

  let wordCipher3 = {
    // methods
    toUpperCase: '@',
    raw: '`',
    // properties
    length: ':',
    // keywords
    new: '+_',
  }

  let wordCiphers = {
    ...wordCipher1,
    ...wordCipher2,
    ...wordCipher3,
  }

  let functionCiphers = {
    encodeBijective: '+[]',
    decodeBijective: '~[]',
    compressRange: '![]',
    expandRange: "!''",
    punct: '+{}',
    alnumDigits: "!''/![]",
  }

  // HELPER FUNCTIONS
  let quoteCount = 0
  let arrCount = 0

  function sortEntries(obj, cmp) {
    return _.fromPairs(_.toPairs(obj).sort(cmp))
  }

  function cycle(arr) {
    return arr[arrCount++ % arr.length]
  }

  function quoteKey(string) {
    return quote(string, true)
  }

  function quote(string, key = false) {
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
    let quotes = cycle(quoteSequence)

    if ((key && lengthSet.size == 2) || (!key && lengthSet.size == 3)) {
      quotes = short[0]
    } else if (!key && lengthSet.size == 2) {
      quotes = [short[0], mid[0]].includes(quotes) ? quotes : short[0]
    } else {
      quotes = quotes || short[0]
    }

    return jsesc(string, {quotes, wrap: true})
  }

  function encodeCharKey(char) {
    char = String(char)
    let key

    if (/[a-zA-Z]/.test(char)) {
      key =
        (V.isUpperCase(char) ? '$' : '_') +
        cipher[letters.indexOf(char.toLowerCase())]
    }

    if (/\d/.test(char)) {
      key = [...(+char).toString(2).padStart(3, 0)].map(x => (+x ? '$' : '_'))
        .join``
    }

    if (char == ' ') key = '-'

    return quoteKey(key)
  }

  function encodeChar(char) {
    if (/[a-zA-FINORSU]/.test(char)) {
      let key =
        (V.isUpperCase(char) ? '$' : '_') +
        cipher[letters.indexOf(char.toLowerCase())]
      if (isValidIdent(key)) return `${globalVar}.${key}`
      else return `${globalVar}[${quote(key)}]`
    }

    if (/[GHJ-MPQTV-Z]/.test(char))
      return `${encodeChar(char.toLowerCase())}[${globalVar}[${quote('@')}]]()`

    if (/\d/.test(char)) {
      let key = [...(+char).toString(2).padStart(3, 0)].map(x =>
        +x ? '$' : '_'
      ).join``
      return `${globalVar}.${key}`
    }

    if (char == ' ') return `${globalVar}[${quote('-')}]`

    return quote(char)
  }

  function encodeString(string) {
    return [...string].map(char => encodeChar(char, globalVar)).join`+`
  }

  function encodeProps(props) {
    return (
      `${globalVar}={...${globalVar},` +
      _.entries(props)
        .map(([prop, key]) => [key, encodeString(prop)])
        .map(([key, expr]) => `${quoteKey(key)}:${expr}`) +
      '};'
    )
  }

  function encodeFunction(func) {
    let digits = '_$'

    let code = uglify
      .minify(String(func), {compress: {reduce_funcs: true}})
      .code.replace(/^function \w*/, '')
      .replace('){', ')=>{')

    let keyGen = (function* () {
      for (let i = 1; ; i++) {
        let key = encodeBijective(i, digits)
        if (key != globalVar) yield key
      }
    })()

    let variables = [...new Set(code.match(/\b[a-z]\b/g))]
    variables = _.fromPairs(variables.map(v => [v, keyGen.next().value]))

    let result = code
      .replace(
        RegExp(`\\b(${_.keys(functionCiphers).join`|`})\\b`, 'g'),
        match => `${globalVar}[${functionCiphers[match]}]`
      )
      .replace(
        RegExp(`\\b(${_.keys(variables).join`|`})\\b`, 'g'),
        match => variables[match]
      )
      .match(/ |[\da-z]+|[^ \da-z]+/gi)
      .map(match =>
        _.keys(constructorExprs).includes(match)
          ? `${cycle(
              constructorExprs[match]
            )}[${globalVar}.$][${globalVar}[${quote('?')}]]`
          : _.keys(wordCiphers).includes(match)
          ? `${globalVar}[${quote(wordCiphers[match])}]`
          : /[^\s\da-z]+/i.test(match)
          ? quote(match)
          : encodeString(match)
      ).join`+`

    // DEBUG
    // return result

    return `${globalVar}[${quote('=')}](${result})`
  }

  let reservedVars = _.range(1, 64).map(x => encodeBijective(BigInt(x), '_$'))

  function encodeExpression(expr) {
    let code = uglify.minify(String(expr), {
      mangle: {reserved: reservedVars},
      compress: {reduce_funcs: true},
    }).code

    let result = code
      .match(/ |[\da-z]+|[^ \da-z]+/gi)
      .map(match =>
        _.keys(constructorExprs).includes(match)
          ? `${cycle(
              constructorExprs[match]
            )}[${globalVar}.$][${globalVar}[${quote('?')}]]`
          : _.keys(wordCiphers).includes(match)
          ? `${globalVar}[${quote(wordCiphers[match])}]`
          : /[^\s\da-z]+/i.test(match)
          ? quote(match)
          : encodeString(match)
      ).join`+`

    // DEBUG
    // return result;

    return `${globalVar}[${quote('=')}](${result})`
  }

  // TESTING FUNCTIONS

  function testRawString(string) {
    try {
      if (/(?<!\\)\$\{/.test(string)) throw new Error()
      eval(`(\`${string}\`)`)
      return true
    } catch {
      return false
    }
  }

  // HEADER

  console.info('Generating header')

  let header = `${globalVar}=~[];`

  let charMap1 = {}

  for (let [constant, expr] of _.entries(constantExprs))
    for (let char of constant)
      if (/[a-z ]/i.test(char) && !(char in charMap1))
        charMap1[char] = [expr, constant.indexOf(char)]

  let charMap1Expr =
    `${globalVar}={` +
    _.range(0, 10).map(($, digit) => [
      `${encodeCharKey(digit)}:\`\${++${globalVar}}\``,
      ..._.entries(charMap1)
        .filter(([, [, value]]) => value == digit)
        .map(
          ([char, [exprs]]) =>
            `${encodeCharKey(char)}:\`\${${cycle(exprs)}}\`[${globalVar}]`
        ),
    ]) +
    '};'

  header += charMap1Expr

  let charMap2 = {}

  for (let [key, exprs] of _.entries(constructorExprs)) {
    let constructor = eval(key).toString()
    for (let char of constructor) {
      if (/[a-z ]/i.test(char) && !(char in charMap1) && !(char in charMap2)) {
        let index = constructor.indexOf(char)
        let expansion =
          `\`\${${cycle(exprs)}[${globalVar}.$]}\`` +
          `[${encodeString(String(index))}]`
        charMap2[char] = [expansion, index]
      }
    }
  }

  let charMap2Expr =
    `${globalVar}={...${globalVar},` +
    _.entries(charMap2).map(
      ([letter, [expansion]]) => `${encodeCharKey(letter)}:${expansion}`
    ) +
    '};'

  header += encodeProps(wordCipher1)

  header += charMap2Expr

  header += encodeProps(wordCipher2)

  let globalFunctionsExpr =
    `${globalVar}={...${globalVar},` +
    _.entries(globalFunctions).map(
      ([ident, shortcut]) =>
        `${quoteKey(shortcut)}:${cycle(
          constructorExprs.Function
        )}[${globalVar}.$]` +
        `(${[
          `${globalVar}._`,
          `${globalVar}[${quote('-')}]`,
          encodeString(ident),
        ].join`+`})()`
    ) +
    '};'

  header += globalFunctionsExpr

  header +=
    `${globalVar}={...${globalVar},` +
    [
      [
        quoteKey("'"),
        `${encodeString('to')}+${quote(
          ''
        )}[${globalVar}.$][${globalVar}[${quote('?')}]]`,
      ],
      [
        encodeCharKey('C'),
        `${globalVar}[${quote('&')}](${quote('<')})[${encodeString('2')}]`,
      ],
      [
        encodeCharKey('D'),
        `${globalVar}[${quote('&')}](${quote('=')})[${encodeString('2')}]`,
      ],
    ].map(x => x.join`:`) +
    '};'

  header +=
    `${globalVar}={...${globalVar},` +
    [
      [
        encodeCharKey('U'),
        `\`\${{}[${globalVar}[${quote("'")}]]` +
          `[${encodeString('call')}]()}\`` +
          `[${encodeString('8')}]`,
      ],
    ].map(x => x.join`:`) +
    '};'

  let lowercase = [...'hkqwz']
  let lowercaseExpr =
    `[${lowercase.map(encodeString)}]=` +
    `[${lowercase.map(letter =>
      encodeString(String(alnumLower.indexOf(letter)))
    )}]` +
    `[${globalVar}[${quote('%')}]]` +
    `(_=>(+_)[${globalVar}[${quote("'")}]](${encodeString('36')}));`

  header += lowercaseExpr

  header += encodeProps(wordCipher3)

  let alnumExpr =
    '[[...Array(36)].map(($,_)=>_.toString(36)),\
[...Array(26)].map(($,_)=>(_+10).toString(36).toUpperCase())]\
.flat().join``'

  header +=
    `${globalVar}={...${globalVar},` +
    [
      ['[+{}]', JSON.stringify(punct)],
      ["[!''/!{}]", encodeExpression(alnumExpr)],
    ].map(x => x.join`:`) +
    '};'

  header +=
    `${globalVar}={...${globalVar},` +
    [
      ...[encodeBijective, decodeBijective, compressRange, expandRange].map(
        func => [`[${functionCiphers[func.name]}]`, encodeFunction(func)]
      ),
    ].map(x => x.join`:`) +
    '};'

  // CHARACTER FUNCTIONS

  console.info('Building character sets')

  let categories = {
    Letter: /\p{L}+/giu,
    Mark: /\p{M}+/giu,
    Number: /\p{N}+/giu,
    Punctuation: /\p{P}+/giu,
    Symbol: /\p{S}+/giu,
    Separator: /\p{Z}+/giu,
    Other: /\p{C}+/giu,
  }

  let scripts = _.fromPairs(
    glob
      .sync(`./node*/*unicode*/*/Script/*`)
      .filter(dir => !/\.\w+$/.test(dir))
      .map(dir => {
        let [name] = dir.split('/').reverse(),
          regex = require(`@unicode/unicode-14.0.0/Script/${name}/regex.js`)
        return [name, regex]
      })
  )

  function getCategoryOrScript(char) {
    for (let [category, regex] of _.entries(categories))
      if (regex.test(char))
        if (category == 'Letter') break
        else return category
    for (let [script, regex] of _.entries(scripts))
      if (regex.test(char)) return script
    return 'Unknown'
  }

  // CHARACTER MAPPING

  let codePointSort = (a, b) => a.codePointAt() - b.codePointAt()

  let characters = [...new Set(text)]
    .filter(char => !/[ -?[-`{-~]/g.test(char))
    .map(char => [getCategoryOrScript(char), char])
  characters = _.groupBy(characters, 0)
  characters = _.mapValues(
    characters,
    x => x.map(([, x]) => x).sort(codePointSort).join``
  )

  let groupRegExps = _.fromPairs(
    _.entries(characters).map(([name, chars]) => [
      name,
      RegExp(
        regenerate([...chars]).toString({hasUnicodeFlag: true}) + '+',
        'giu'
      ),
    ])
  )

  characters = _.mapValues(characters, group => {
    let compressed = compressRange(group, punct)
    let expanded = expandRange(compressed, punct)
    console.assert(group == expanded)
    return [group, compressed]
  })

  let regExps = {
    // Removed by compiler, will get added back in later
    Space: / +/giu,
    Punct: /[!-\/:-@[-`{-~]+/giu,

    // Capturing groups for identifiers
    Alnum: /[a-zA-Z0][a-zA-Z\d]+|[a-zA-Z]/giu,
    Digit: /0|[1-9]\d*/giu,

    // Scripts and categories
    ...groupRegExps,
  }

  let oldRegExps = {
    // Unicode catch-all points
    Letter: /\p{L}+/giu,
    Mark: /\p{M}+/giu,
    Number: /\p{N}+/giu,
    Punctuation: /\p{P}+/giu,
    Symbol: /\p{S}+/giu,
    Other: /\p{C}+/giu,
    Separator: /\p{Z}+/giu,

    // All characters should be captured, else fallback to this
    Fallback: /[\0-\x1f\x7f-\u{10ffff}]+/giu,
  }

  let bigRegExp = RegExp(
    _.entries(regExps).map(([key, {source}]) => `(?<${key}>${source})`).join`|`,
    'giu'
  )

  // ENCODING FUNCTIONS

  function encodeBijective(int, chars) {
    if (int <= 0n) return ''
    chars = [...new Set(chars)]
    var base = BigInt(chars.length)
    var index = (int = BigInt(int)) % base || base
    var result = chars[index - 1n]
    while ((int = (int - 1n) / base) > 0n)
      result = chars[(index = int % base || base) - 1n] + result
    return result
  }

  function decodeBijective(str, chars) {
    str = [...str]
    chars = [...new Set(chars)]
    var result = 0n
    var base = BigInt(chars.length)
    var strLen = str.length
    for (var index = 0; index < strLen; index++)
      result +=
        BigInt(chars.indexOf(str[index]) + 1) *
        base ** BigInt(strLen - index - 1)
    return result
  }

  function compressRange(chars, digits, sep = ',', sub = '.') {
    digits = [...new Set(digits)].filter(digit => digit != sep && digit != sub)
      .join``

    return [...new Set(chars)]
      .map(char => char.codePointAt())
      .sort((a, b) => a - b)
      .reduce((acc, cur, idx, src) => {
        var prev = src[idx - 1]
        if (idx > 0 && cur - prev == 1) {
          var last = acc.length - 1
          acc[last][1] = cur
        } else acc.push([cur])
        return acc
      }, [])
      .map(num => num.map(x => encodeBijective(x, digits)).join(sub))
      .join(sep)
  }

  function expandRange(run, digits, sep = ',', sub = '.') {
    function range(start, end, step = 1) {
      return [...Array(Math.abs(end - start) / step + 1)].map(
        (_, index) => start + (start < end ? 1 : -1) * step * index
      )
    }

    digits = [...new Set(digits)].filter(digit => digit != sep && digit != sub)
      .join``

    return run
      .split(sep)
      .map(end => {
        var res = end.split(sub)
        res = res.map(enc => +`${decodeBijective(enc, digits)}`)
        return res.length == 1 ? res : range(...res)
      })
      .flat()
      .map(p => String.fromCodePoint(p)).join``
  }

  // TOKENIZATION

  console.info('Tokenizing text')

  let tokens = [...text.matchAll(bigRegExp)]
    .map(match => {
      let [[group, text]] = _.entries(match.groups).filter(
        ([, val]) => val != null
      )
      return _.chunk(text, nGramLength).map(text => ({
        group,
        text: text.join``,
      }))
    })
    .flat(1)

  let identBlacklist = [...'abcdefghijklmnopqrstuvwxyzABCDEFINORSU']
  identBlacklist = identBlacklist.concat(
    ...[wordCiphers, constantExprs, constructorExprs]
      .map(_.keys)
      .filter(ident => /^[a-z]/i.test(ident))
  )

  identBlacklist = new Set(identBlacklist)

  let existingKeys = new Set(
    [
      "'", // toString
      '-', // space
      _.values(wordCiphers),
      _.values(globalFunctions),
      [...' abcdefghijklmnopqrstuvwxyzABCDEFINORSU0123456789'].map(x =>
        encodeCharKey(x)
          .replace(/^['"`]|['"`]$/g, '')
          .replace(/\\(.)/g, '$1')
      ),
    ].flat()
  )

  let keyGen = (function* () {
    for (let i = 1; ; i++) {
      let key = encodeBijective(i, punct)
      if (!existingKeys.has(key)) yield key
    }
  })()

  console.info('Encoding tokens')

  let metadata = (() => {
    let tokenGroups = _.groupBy(tokens, 'group')

    // ASCII punctuation are inserted literally
    delete tokenGroups.Punct
    // Spaces are substituted with empty array elements
    delete tokenGroups.Space

    tokenGroups = _.mapValues(tokenGroups, group =>
      _.toPairs(_.countBy(group.map(({text}) => text))).sort(
        ([, a], [, b]) => b - a
      )
    )

    tokenGroups = _.fromPairs(_.entries(tokenGroups).filter(([, v]) => !!v))

    // Digits
    if (tokenGroups.Digit)
      tokenGroups.Digit = tokenGroups.Digit.filter(([num]) => num >= 10).map(
        ([substr]) => [
          substr,
          keyGen.next().value,
          encodeBijective(substr, punct),
        ]
      )

    // Alphanumerics
    if (tokenGroups.Alnum)
      tokenGroups.Alnum = tokenGroups.Alnum.filter(
        ([ident]) => !identBlacklist.has(ident)
      ).map(([substr]) => [
        substr,
        keyGen.next().value,
        encodeBijective(decodeBijective(substr, alnumDigits), punct),
      ])

    // All other categories
    for (let tokenGroup in tokenGroups)
      if (
        tokenGroups.hasOwnProperty(tokenGroup) &&
        !['Alnum', 'Digit'].includes(tokenGroup)
      ) {
        let [charset] = characters[tokenGroup]
        let tokens = tokenGroups[tokenGroup]
        tokenGroups[tokenGroup] = tokens.map(([substr]) => [
          substr,
          keyGen.next().value,
          encodeBijective(decodeBijective(substr, charset), punct),
        ])
      }

    return tokenGroups
  })()

  let mappers = {
    Digit: `_=>\`\${$[~[]](_,$[+{}])}\``,
    Alnum: `_=>$[+[]]($[~[]](_,$[+{}]),$[!''/![]])`,
    ..._.fromPairs(
      _.entries(characters).map(([key, [, val]]) => [
        key,
        `_=>$[+[]]($[~[]](_,$[+{}]),$[!''](${quote(val)},$[+{}]))`,
      ])
    ),
  }

  let statements = _.keys(metadata).map(key => {
    let mapper = mappers[key]
    let tokens = metadata[key].map(([, x, y]) => [x, y])

    let expr =
      `[${tokens.map(([x]) => `${globalVar}[${quote(x)}]`)}]=` +
      `[${tokens.map(([, y]) => quote(y))}]` +
      `[${globalVar}[${quote('%')}]]` +
      `(${mapper});`

    return expr
  }).join``

  console.log(
    header +
      statements +
      `console.log(Object.fromEntries(Object.entries(${globalVar})` +
      '.sort(([,a],[,b])=>String(a).localeCompare(String(b)))))'
  )

  return {metadata, characters, mappers, tokens}
}
