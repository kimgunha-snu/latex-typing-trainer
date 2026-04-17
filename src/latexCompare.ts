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
  return value.replace(/[\t\n\r ]+/g, '')
}

function preprocessLatex(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\mathrm{$1}')
  normalized = normalized.replace(/\\(sin|cos|tan|log|ln|exp|max|min)\{([A-Za-z0-9\\]+)\}/g, (_, fn: string, arg: string) => `\\${fn}${arg}`)
  normalized = normalized.replace(/(?<!\\)d\s*([A-Za-z])/g, 'd$1')
  return normalized
}

function canonicalFromAst(value: string) {
  try {
    const expr = ce.parse(value)
    if (!expr) return null
    const json = expr.simplify().json
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
  return -1
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
    else if (mismatchIndex === -1 && visibleCursor === normalizeWhitespace(input).length) state = 'current'

    targetDisplayStates.push(state)
    visibleCursor += 1
  }

  return targetDisplayStates
}

export function compareLatex(input: string, target: string): ComparisonResult {
  const normalizedInput = preprocessLatex(input)
  const normalizedTarget = preprocessLatex(target)

  const inputAst = canonicalFromAst(normalizedInput)
  const targetAst = canonicalFromAst(normalizedTarget)

  const astEquivalent = Boolean(inputAst && targetAst && inputAst === targetAst)

  const mismatchIndex = astEquivalent ? -1 : comparePrefix(normalizedInput, normalizedTarget)
  const correctChars = astEquivalent
    ? normalizedTarget.length
    : mismatchIndex === -1
      ? Math.min(normalizedInput.length, normalizedTarget.length)
      : mismatchIndex
  const isComplete = astEquivalent || normalizedInput === normalizedTarget

  return {
    normalizedInput: inputAst ?? normalizedInput,
    normalizedTarget: targetAst ?? normalizedTarget,
    isComplete,
    mismatchIndex,
    correctChars,
    targetDisplayStates: buildDisplayStates(target, input, mismatchIndex, correctChars),
  }
}
