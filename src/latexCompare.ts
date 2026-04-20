import { ComputeEngine } from '@cortex-js/compute-engine'

type DisplayCharState = 'pending' | 'correct' | 'wrong' | 'current'

export type ComparisonResult = {
  normalizedInput: string
  normalizedTarget: string
  isComplete: boolean
  mismatchIndex: number
  correctChars: number
  targetDisplayStates: DisplayCharState[]
}

const ce = new ComputeEngine()
const styleCommands = 'vec|hat|bar|tilde|widetilde|dot|ddot|overline|underline|mathbf|mathit|mathrm|mathsf|mathtt|mathcal|mathbb|boldsymbol'

function normalizeWhitespace(value: string) {
  return value.replace(/[\t\n\r ]+/g, ' ').trim()
}

function normalizeMidRelations(value: string) {
  return value.replace(/([A-Za-z0-9\\}\]])\s*\|\s*([A-Za-z0-9\\{\[])/g, '$1 \\mid $2')
}

function normalizeScriptSpacing(value: string) {
  return value
    .replace(/_\s*\{\s*/g, '_{')
    .replace(/\^\s*\{\s*/g, '^{')
    .replace(/_\s+([A-Za-z0-9\\])/g, '_$1')
    .replace(/\^\s+([A-Za-z0-9\\])/g, '^$1')
    .replace(/_\{([^{}]+)\}/g, (_match: string, inner: string) => `_{${inner.replace(/\s+/g, '')}}`)
    .replace(/\^\{([^{}]+)\}/g, (_match: string, inner: string) => `^{${inner.replace(/\s+/g, '')}}`)
}

function normalizeCommandSingleTokenArgs(value: string, command: string, argCount: number) {
  let result = ''
  let i = 0

  const readToken = (source: string, start: number) => {
    if (source[start] === '{') {
      let depth = 0
      let end = start
      while (end < source.length) {
        if (source[end] === '{') depth += 1
        if (source[end] === '}') {
          depth -= 1
          if (depth === 0) break
        }
        end += 1
      }
      return { token: source.slice(start, end + 1), next: end + 1 }
    }

    if (source[start] === '\\') {
      let end = start + 1
      while (end < source.length && /[A-Za-z]/.test(source[end])) end += 1
      return { token: source.slice(start, end), next: end }
    }

    return { token: source[start], next: start + 1 }
  }

  while (i < value.length) {
    if (value.startsWith(command, i)) {
      let j = i + command.length
      const tokens: string[] = []

      for (let count = 0; count < argCount; count += 1) {
        while (value[j] === ' ') j += 1
        if (j >= value.length) break
        const { token, next } = readToken(value, j)
        tokens.push(token.startsWith('{') ? token : `{${token}}`)
        j = next
      }

      if (tokens.length === argCount) {
        result += `${command}${tokens.join('')}`
        i = j
        continue
      }
    }

    result += value[i]
    i += 1
  }

  return result
}

function normalizeOperatorNameScripts(value: string) {
  let result = ''
  let i = 0

  const readToken = (source: string, start: number) => {
    if (source[start] === '{') {
      let depth = 0
      let end = start
      while (end < source.length) {
        if (source[end] === '{') depth += 1
        if (source[end] === '}') {
          depth -= 1
          if (depth === 0) break
        }
        end += 1
      }
      return { token: source.slice(start, end + 1), next: end + 1 }
    }

    if (source[start] === '\\') {
      let end = start + 1
      while (end < source.length && /[A-Za-z]/.test(source[end])) end += 1
      return { token: source.slice(start, end), next: end }
    }

    return { token: source[start], next: start + 1 }
  }

  while (i < value.length) {
    if (value.startsWith('\\operatorname{', i)) {
      let j = i + '\\operatorname{'.length
      let depth = 1
      while (j < value.length && depth > 0) {
        if (value[j] === '{') depth += 1
        else if (value[j] === '}') depth -= 1
        j += 1
      }

      const base = value.slice(i, j)
      let sub = ''
      let sup = ''

      for (let count = 0; count < 2; count += 1) {
        while (value[j] === ' ') j += 1
        const marker = value[j]
        if (marker !== '_' && marker !== '^') break
        while (value[j + 1] === ' ') j += 1
        const { token, next } = readToken(value, j + 1)
        if (marker === '_') sub = token.startsWith('{') ? token : `{${token}}`
        else sup = token.startsWith('{') ? token : `{${token}}`
        j = next
      }

      result += `${base}${sub ? `_${sub}` : ''}${sup ? `^${sup}` : ''}`
      i = j
      continue
    }

    result += value[i]
    i += 1
  }

  return result
}

function normalizeGammaScripts(value: string) {
  let result = ''
  let i = 0

  const readToken = (source: string, start: number) => {
    if (source[start] === '{') {
      let depth = 0
      let end = start
      while (end < source.length) {
        if (source[end] === '{') depth += 1
        if (source[end] === '}') {
          depth -= 1
          if (depth === 0) break
        }
        end += 1
      }
      return { token: source.slice(start, end + 1), next: end + 1 }
    }

    if (source[start] === '\\') {
      let end = start + 1
      while (end < source.length && /[A-Za-z]/.test(source[end])) end += 1
      return { token: source.slice(start, end), next: end }
    }

    return { token: source[start], next: start + 1 }
  }

  while (i < value.length) {
    if (value.startsWith('\\Gamma', i)) {
      let j = i + '\\Gamma'.length
      let sub = ''
      let sup = ''

      for (let count = 0; count < 2; count += 1) {
        const marker = value[j]
        if (marker !== '_' && marker !== '^') break
        const { token, next } = readToken(value, j + 1)
        if (marker === '_') sub = token
        else sup = token
        j = next
      }

      result += `\\Gamma${sub ? `_${sub}` : ''}${sup ? `^${sup}` : ''}`
      i = j
      continue
    }

    if (value.startsWith('\\sqrt ', i)) {
      const { token, next } = readToken(value, i + '\\sqrt '.length)
      result += `\\sqrt{${token}}`
      i = next
      continue
    }

    result += value[i]
    i += 1
  }

  return result
}

function normalizeForParser(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\lVert/g, '\\Vert').replace(/\\rVert/g, '\\Vert')
  normalized = normalized.replace(/\\\|/g, '\\Vert ')
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\mathrm{$1}')
  normalized = normalized.replace(/\\ldots/g, '\\dots')
  normalized = normalized.replace(/\\land/g, '\\wedge').replace(/\\lor/g, '\\vee')
  normalized = normalized.replace(/\\not\s+\\in/g, '\\notin')
  normalized = normalized.replace(/\\not\s*=/g, '\\ne')
  normalized = normalized.replace(/\\neq/g, '\\ne')
  normalized = normalized.replace(/\\ast/g, '*')
  normalized = normalizeMidRelations(normalized)
  normalized = normalized.replace(new RegExp(`\\\\(${styleCommands})\\s*((?:\\\\[A-Za-z]+)|[A-Za-z0-9])`, 'g'), (_, cmd: string, arg: string) => `\\${cmd}{${arg}}`)
  normalized = normalized.replace(/\\(sin|cos|tan|log|ln|exp|max|min)\{([A-Za-z0-9\\]+)\}/g, (_, fn: string, arg: string) => `\\${fn} ${arg}`)
  normalized = normalizeScriptSpacing(normalized)
  normalized = normalizeOperatorNameScripts(normalized)
  normalized = normalizeGammaScripts(normalized)
  normalized = normalizeCommandSingleTokenArgs(normalized, '\\frac', 2)
  normalized = normalized.replace(/(?<!\\)d\s*([A-Za-z])/g, 'd$1')
  return normalized
}

function normalizeForFallback(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\lVert/g, '\\Vert').replace(/\\rVert/g, '\\Vert')
  normalized = normalized.replace(/\\\|/g, '\\Vert')
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\mathrm{$1}')
  normalized = normalized.replace(/\\ldots/g, '\\dots')
  normalized = normalized.replace(/\\land/g, '\\wedge').replace(/\\lor/g, '\\vee')
  normalized = normalized.replace(/\\not\s+\\in/g, '\\notin')
  normalized = normalized.replace(/\\not\s*=/g, '\\ne')
  normalized = normalized.replace(/\\neq/g, '\\ne')
  normalized = normalized.replace(/\\ast/g, '*')
  normalized = normalizeMidRelations(normalized)
  normalized = normalized.replace(new RegExp(`\\\\(${styleCommands})\\s*((?:\\\\[A-Za-z]+)|[A-Za-z0-9])`, 'g'), (_, cmd: string, arg: string) => `\\${cmd}{${arg}}`)
  normalized = normalized.replace(/\\(sin|cos|tan|log|ln|exp|max|min)\{([A-Za-z0-9\\]+)\}/g, (_, fn: string, arg: string) => `\\${fn}${arg}`)
  normalized = normalizeScriptSpacing(normalized)
  normalized = normalizeOperatorNameScripts(normalized)
  normalized = normalizeGammaScripts(normalized)
  normalized = normalizeCommandSingleTokenArgs(normalized, '\\frac', 2)
  normalized = normalized.replace(/R\^\{?\\rho\}?_\{?([^{}]+)\}?/g, 'R_{$1}^{\\rho}')
  normalized = normalized.replace(/\\partial_\{?([^{}]+)\}?\\Gamma_\{?([^{}]+)\}?\^\{?\\rho\}?/g, '\\partial_{$1}\\Gamma_{$2}^{\\rho}')
  normalized = normalized.replace(/\\partial_\{?([^{}]+)\}?\\Gamma\^\{?\\rho\}?_\{?([^{}]+)\}?/g, '\\partial_{$1}\\Gamma_{$2}^{\\rho}')
  normalized = normalized.replace(/\{([^{}=]+)=([^{}=]+)\}/g, (_, left: string, right: string) => {
    const a = left.trim()
    const b = right.trim()
    return `{${[a, b].sort().join('=')}}`
  })
  normalized = normalized.replace(/\\sum\^\{?([^{}_]+)\}?_\{?([^{}]+)\}?/g, '\\sum_{$2}^{$1}')
  normalized = normalized.replace(/\\sum_\{?([^{}]+)\}?\^\{?([^{}_]+)\}?/g, '\\sum_{$1}^{$2}')
  normalized = normalized.replace(/\\int\^\{?([^{}_]+)\}?_\{?([^{}]+)\}?/g, '\\int_{$2}^{$1}')
  normalized = normalized.replace(/\\int_\{?([^{}]+)\}?\^\{?([^{}_]+)\}?/g, '\\int_{$1}^{$2}')
  normalized = normalized.replace(/([A-Za-z0-9]+|\\[A-Za-z]+)_\{?([^{}]+)\}?\^\{?([^{}]+)\}?/g, '$1_{$2}^{$3}')
  normalized = normalized.replace(/([A-Za-z0-9]+|\\[A-Za-z]+)\^\{?([^{}]+)\}?_\{?([^{}]+)\}?/g, '$1_{$3}^{$2}')
  normalized = normalized.replace(/([A-Za-z])\^\{([A-Za-z])\}([A-Za-z])/g, '$1^{$2} $3')
  normalized = normalized.replace(/([A-Za-z])\^([A-Za-z])([A-Za-z])/g, '$1^{$2} $3')
  normalized = normalized.replace(/_([^{}\\\s])/g, '_{$1}')
  normalized = normalized.replace(/\^([^{}\\\s])/g, '^{$1}')
  normalized = normalized.replace(/\s+/g, '')
  return normalized
}

function containsInvalidNode(value: unknown): boolean {
  if (Array.isArray(value)) {
    if (value[0] === 'Error') return true
    return value.some((item) => containsInvalidNode(item))
  }

  if (value && typeof value === 'object') {
    return Object.values(value).some((item) => containsInvalidNode(item))
  }

  if (typeof value === 'string') {
    return value === 'NaN' || value === 'undefined'
  }

  return false
}

function canonicalFromAst(value: string) {
  try {
    const expr = ce.parse(value)
    if (!expr) return null
    const json = expr.simplify().json
    if (containsInvalidNode(json)) return null
    return JSON.stringify(json)
  } catch {
    return null
  }
}

function hasTopLevelEquality(value: string) {
  let depthBrace = 0
  let depthBracket = 0
  let depthParen = 0

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i]
    if (char === '\\') {
      i += 1
      continue
    }
    if (char === '{') depthBrace += 1
    else if (char === '}') depthBrace = Math.max(0, depthBrace - 1)
    else if (char === '[') depthBracket += 1
    else if (char === ']') depthBracket = Math.max(0, depthBracket - 1)
    else if (char === '(') depthParen += 1
    else if (char === ')') depthParen = Math.max(0, depthParen - 1)
    else if (char === '=' && depthBrace === 0 && depthBracket === 0 && depthParen === 0) return true
  }

  return false
}

function comparePrefix(input: string, target: string) {
  const minLength = Math.min(input.length, target.length)
  for (let i = 0; i < minLength; i += 1) {
    if (input[i] !== target[i]) return i
  }
  return input.length > target.length ? target.length : -1
}

function buildDisplayStates(target: string, input: string, mismatchIndex: number, correctChars: number) {
  const targetDisplayStates: DisplayCharState[] = []
  let visibleCursor = 0

  for (const char of target) {
    if (/\s/.test(char)) {
      targetDisplayStates.push('pending')
      continue
    }

    let state: DisplayCharState = 'pending'
    if (mismatchIndex >= 0 && visibleCursor === mismatchIndex) state = 'wrong'
    else if (visibleCursor < correctChars) state = 'correct'
    else if (mismatchIndex === -1 && visibleCursor === normalizeForFallback(input).length) state = 'current'

    targetDisplayStates.push(state)
    visibleCursor += 1
  }

  return targetDisplayStates
}

export function compareLatex(input: string, target: string): ComparisonResult {
  const parserInput = normalizeForParser(input)
  const parserTarget = normalizeForParser(target)
  const inputAst = canonicalFromAst(parserInput)
  const targetAst = canonicalFromAst(parserTarget)
  const astEquivalent = Boolean(inputAst && targetAst && inputAst === targetAst)

  const normalizedInput = normalizeForFallback(input)
  const normalizedTarget = normalizeForFallback(target)
  const fallbackEquivalent = normalizedInput === normalizedTarget
  const suspiciousParserMatch = astEquivalent
    && hasTopLevelEquality(parserTarget)
    && hasTopLevelEquality(parserInput)
    && normalizedTarget.includes('=')
    && normalizedInput.includes('=')
    && normalizedInput.length + 3 < normalizedTarget.length

  const isComplete = fallbackEquivalent || (astEquivalent && !suspiciousParserMatch)
  const mismatchIndex = isComplete ? -1 : comparePrefix(normalizedInput, normalizedTarget)
  const correctChars = isComplete
    ? normalizedTarget.length
    : mismatchIndex === -1
      ? Math.min(normalizedInput.length, normalizedTarget.length)
      : mismatchIndex

  return {
    normalizedInput: inputAst ?? normalizedInput,
    normalizedTarget: targetAst ?? normalizedTarget,
    isComplete,
    mismatchIndex,
    correctChars,
    targetDisplayStates: buildDisplayStates(target, input, mismatchIndex, correctChars),
  }
}
