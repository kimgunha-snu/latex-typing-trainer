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

function normalizeWhitespace(value: string) {
  return value.replace(/[\t\n\r ]+/g, ' ').trim()
}

function normalizeForParser(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\\|/g, '\\Vert ')
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\mathrm{$1}')
  normalized = normalized.replace(/\\(vec|hat|bar|tilde|dot|ddot|overline|underline)\s+([A-Za-z0-9])/g, (_, cmd: string, arg: string) => `\\${cmd}{${arg}}`)
  normalized = normalized.replace(/\\(sin|cos|tan|log|ln|exp|max|min)\{([A-Za-z0-9\\]+)\}/g, (_, fn: string, arg: string) => `\\${fn} ${arg}`)
  normalized = normalized.replace(/(?<!\\)d\s*([A-Za-z])/g, 'd$1')
  return normalized
}

function normalizeForFallback(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\\|/g, '\\Vert')
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\mathrm{$1}')
  normalized = normalized.replace(/\\(vec|hat|bar|tilde|dot|ddot|overline|underline)\s+([A-Za-z0-9])/g, (_, cmd: string, arg: string) => `\\${cmd}{${arg}}`)
  normalized = normalized.replace(/\\(sin|cos|tan|log|ln|exp|max|min)\{([A-Za-z0-9\\]+)\}/g, (_, fn: string, arg: string) => `\\${fn}${arg}`)
  normalized = normalized.replace(/(?<!\\)d\s*([A-Za-z])/g, 'd$1')
  normalized = normalized.replace(/\{([^{}=]+)=([^{}=]+)\}/g, (_, left: string, right: string) => {
    const a = left.trim()
    const b = right.trim()
    return `{${[a, b].sort().join('=')}}`
  })
  normalized = normalized.replace(/\\sum\^\{?([^{}_]+)\}?_\{?([^{}]+)\}?/g, '\\sum_{$2}^{$1}')
  normalized = normalized.replace(/\\sum_\{?([^{}]+)\}?\^\{?([^{}_]+)\}?/g, '\\sum_{$1}^{$2}')
  normalized = normalized.replace(/\\int\^\{?([^{}_]+)\}?_\{?([^{}]+)\}?/g, '\\int_{$2}^{$1}')
  normalized = normalized.replace(/\\int_\{?([^{}]+)\}?\^\{?([^{}_]+)\}?/g, '\\int_{$1}^{$2}')
  normalized = normalized.replace(/([A-Za-z0-9]+)_\{?([^{}]+)\}?\^\{?([^{}]+)\}?/g, '$1_{$2}^{$3}')
  normalized = normalized.replace(/([A-Za-z0-9]+)\^\{?([^{}]+)\}?_\{?([^{}]+)\}?/g, '$1_{$3}^{$2}')
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

  const isComplete = astEquivalent || fallbackEquivalent
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
