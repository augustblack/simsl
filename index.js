// https://blog.mgechev.com/2017/09/16/developing-simple-interpreter-transpiler-compiler-tutorial/
// =
// !, ~
// in, notin
// AND, OR
// lic, note
const allowedFields = [
  'name',
  'books.title',
  'books.year'
]
const allowedOps = [
  '=',
  '!=',
  '~=',
  'in',
  'notin'
]

const program  = '  and(name ~= "Luther Blissett" , or(books.title ~= "best escaped \\"string", books.year != 2020))'
const createToken = ({row, col}, token) => ({token, row, col: col - token.length})

const lex = str => str
  .split('')
  .reduce((obj, c, idx, str) => {
    const cM = str[idx - 1]
    // console.log('c', c, c1, c2)

    if (c === ' ' && !obj.quoteOpen) {
      return Object.assign(obj, {
        col: obj.col + 1,
        value: '',
        tokens: obj.value !== '' ? obj.tokens.concat(createToken(obj, obj.value)) : obj.tokens
      })
    }

    if (['(', ')', ',', '='].indexOf(c) !== -1 && !obj.quoteOpen) {
      const addit = [obj.value, c].filter(i => i.trim() !== '')
      return c === '=' && ['!', '~'].indexOf(obj.value) !== -1
        ? Object.assign(obj, {
          col: obj.col + 1,
          value: '',
          tokens: obj.tokens.concat(createToken(obj, addit.join('')))
        })
        : Object.assign(obj, {
          col: obj.col + 1,
          value: '',
          tokens: obj.tokens.concat(addit.map(a => createToken(obj, a)))
        })
    }

    if (c === '"'  && obj.quoteOpen && cM === '\\') { // got an escaped quote
      return Object.assign(obj, {value: obj.value.slice(0, -1) + c})
    }

    if (c === '"'  && obj.quoteOpen) { // closing on String value
      return Object.assign(obj, {
        col: obj.col + 1,
        quoteOpen: false,
        value: '',
        tokens: obj.tokens.concat(createToken(obj, obj.value))
      })
    }

    if (c === '"') { // opening on String value
      return Object.assign(obj, {
        col: obj.col + 1,
        quoteOpen: true,
        value: ''
      })
    }

    return (c === '\n')
     ? Object.assign(obj, {value: obj.value + c, col: 0, row: obj.row + 1})
     : Object.assign(obj, {value: obj.value + c, col: obj.col + 1})

}, { quoteOpen: false, value: '', tokens: [], row: 0, col: 0 })
  .tokens

const Op = 'op'
const And = 'and'
const Or = 'or'
const andReg = /and/i
const orReg = /or/i

const parse = tokens => {
  let c = 0
  const peek = () => tokens[c]
    ? tokens[c].token
    : null

  const consume = () => tokens[c++]

  const parseOp = () => {
    const left = consume()
    const op = consume()
    const right = consume()

    if (!left || left === null) {
      const p = tokens[tokens.length - 1]
      throw new SyntaxError(`expected left-hand assignment at ${p.row}:${p.col}`)
    }

    if (allowedFields.indexOf(left.token) === -1) {
      throw new SyntaxError("invalid field: " + left.token)
    }

    if (op === null) {
      throw new SyntaxError(`no operator at ${left.row}:${left.col}`)
    }

    if (allowedOps.indexOf(op.token) === -1) {
      throw new SyntaxError("invalid operator: " + op.token)
    }
    // we check ahead and make sure all is kosher
    if ([',', ')', null].indexOf(peek()) === -1) {
      const t = consume()
      throw new SyntaxError(`invalid token  ${t.token}. Must be ',' or ')' or end of string.`)
    }
    return {
      type: Op,
      left,
      right,
      op
    }
  }

  const parsePara = _ => {
    const para = []
    while (peek() !== ')') {
      if (peek() === ',') {
        consume()
      }
      para.push(parseExpr())
    }
    return para
  }

  const parseExpr = _ => {
    if (andReg.test(peek())) { // and token
      consume()
      consume()
      return {type: And, para: parsePara()}
    }
    if (orReg.test(peek())) { // or token
      consume()
      consume()
      return {type: Or, para: parsePara()}
    }
    if (peek() === '(') {
      // assume and'd
      consume()
      return {type: And, para: parsePara()}
    }

    return parseOp()
  }
  return parseExpr()
}

const transpile = escape => ast => {
  // need to map values.
  const opMap = {
    '=' : '=',
    '!=' : '!=',
    '~=' : 'ilike'
  }
  const transpileNode = ast => ast.type === And
    ? transpileAnd(ast)
    : ast.type === Or
      ? transpileOr(ast)
      : transpileOp(ast)
  const transpileOp = ({left, op, right}) => `${left.token} ${opMap[op.token]} ${escape(right.token)}`
  const transpilePara = AndOr => ast => `(${ast.para.map(transpileNode).join( AndOr === And ? ' AND ' : ' OR ' )})`
  const transpileAnd = transpilePara(And)
  const transpileOr = transpilePara(Or)
  return transpileNode(ast);
}
const escapeVal = str => `'${str.replace("'", "''")}'`

console.log(program)
const l = lex(program)
console.log(l)
const ast = parse(l)
console.log(JSON.stringify(ast, null, 2))
const sql = transpile(escapeVal)(ast)
console.log(sql)
