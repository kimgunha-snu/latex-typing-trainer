import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { MathJax } from 'better-react-mathjax'
import './App.css'

type PracticeItem = {
  id: number
  title: string
  latex: string
  note: string
}

type DisplayCharState = 'pending' | 'correct' | 'wrong' | 'current'

type ComparisonResult = {
  normalizedInput: string
  normalizedTarget: string
  isComplete: boolean
  mismatchIndex: number
  correctChars: number
  targetDisplayStates: DisplayCharState[]
}

const practiceSet: PracticeItem[] = [
  {
    id: 1,
    title: '기본 분수',
    latex: String.raw`\frac{a+b}{c+d}`,
    note: '분자와 분모를 정확히 닫는 감각 익히기',
  },
  {
    id: 2,
    title: '제곱근과 지수',
    latex: String.raw`\sqrt{x^2 + y^2}`,
    note: '중괄호와 공백 없이도 구조를 읽는 연습',
  },
  {
    id: 3,
    title: '합 기호',
    latex: String.raw`\sum_{i=1}^{n} i^2`,
    note: '위첨자와 아래첨자의 순서 차이까지 허용',
  },
  {
    id: 4,
    title: '적분식',
    latex: String.raw`\int_{0}^{\pi} \sin x \, dx`,
    note: '간격 명령과 기본 토큰의 동치 처리 포함',
  },
  {
    id: 5,
    title: '행렬',
    latex: String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`,
    note: 'environment와 줄바꿈 처리 연습',
  },
]

function normalizeWhitespace(value: string) {
  return value.replace(/[\t\n\r ]+/g, '')
}

function stripOuterBraces(value: string) {
  if (!value.startsWith('{') || !value.endsWith('}')) return value

  let depth = 0
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '{') depth += 1
    if (value[index] === '}') depth -= 1
    if (depth === 0 && index < value.length - 1) return value
  }

  return value.slice(1, -1)
}

function extractGroup(value: string, startIndex: number) {
  if (value[startIndex] === '{') {
    let depth = 0

    for (let index = startIndex; index < value.length; index += 1) {
      if (value[index] === '{') depth += 1
      if (value[index] === '}') depth -= 1

      if (depth === 0) {
        return {
          content: value.slice(startIndex + 1, index),
          endIndex: index + 1,
        }
      }
    }
  }

  return {
    content: value[startIndex] ?? '',
    endIndex: startIndex + 1,
  }
}

function normalizeEquationOrder(value: string) {
  const match = value.match(/^([A-Za-z0-9\\]+)=([A-Za-z0-9\\]+)$/)
  if (!match) return value

  const [, left, right] = match
  return [left, right].sort().join('=')
}

function normalizeTokenGroup(value: string) {
  let normalized = stripOuterBraces(value)
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\mathrm\{([^{}]*)\}/g, '\\text{$1}')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\text{$1}')
  normalized = normalizeEquationOrder(normalized)
  return normalized
}

function collapseSingleArgumentBraces(value: string) {
  return value.replace(/([_^])\{([A-Za-z0-9])\}/g, '$1$2')
}

function canonicalizeBigOperatorScripts(value: string) {
  const operators = ['\\sum', '\\prod', '\\int', '\\lim']
  let result = ''
  let index = 0

  while (index < value.length) {
    const matchedOperator = operators.find((operator) => value.startsWith(operator, index))

    if (!matchedOperator) {
      result += value[index]
      index += 1
      continue
    }

    let cursor = index + matchedOperator.length
    let lower = ''
    let upper = ''

    while (cursor < value.length) {
      const token = value[cursor]
      if (token !== '_' && token !== '^') break

      const group = extractGroup(value, cursor + 1)
      const normalizedGroup = normalizeTokenGroup(group.content)

      if (token === '_') lower = normalizedGroup
      if (token === '^') upper = normalizedGroup
      cursor = group.endIndex
    }

    result += matchedOperator
    if (lower) result += `_{${lower}}`
    if (upper) result += `^{${upper}}`
    index = cursor
  }

  return result
}

function normalizeSemanticLatex(value: string) {
  let normalized = normalizeWhitespace(value)
  normalized = normalized.replace(/\\left/g, '').replace(/\\right/g, '')
  normalized = normalized.replace(/\\,/g, '').replace(/\\!/g, '').replace(/\\:/g, '')
  normalized = normalized.replace(/\\;/g, '').replace(/\\quad/g, '').replace(/\\qquad/g, '')
  normalized = normalized.replace(/\\dfrac/g, '\\frac').replace(/\\tfrac/g, '\\frac')
  normalized = normalized.replace(/\\limits/g, '').replace(/\\nolimits/g, '')
  normalized = normalized.replace(/\\mathrm\{([^{}]*)\}/g, '\\text{$1}')
  normalized = normalized.replace(/\\operatorname\{([^{}]*)\}/g, '\\text{$1}')
  normalized = collapseSingleArgumentBraces(normalized)
  normalized = canonicalizeBigOperatorScripts(normalized)
  return normalized
}

function compareLatex(input: string, target: string): ComparisonResult {
  const normalizedInput = normalizeSemanticLatex(input)
  const normalizedTarget = normalizeSemanticLatex(target)
  const minLength = Math.min(normalizedInput.length, normalizedTarget.length)

  let mismatchIndex = -1

  for (let i = 0; i < minLength; i += 1) {
    if (normalizedInput[i] !== normalizedTarget[i]) {
      mismatchIndex = i
      break
    }
  }

  const correctChars = mismatchIndex === -1 ? minLength : mismatchIndex
  const isComplete = mismatchIndex === -1 && normalizedInput.length === normalizedTarget.length

  const targetDisplayStates: DisplayCharState[] = []
  let visibleCursor = 0

  for (const char of target) {
    if (/\s/.test(char)) {
      targetDisplayStates.push('pending')
      continue
    }

    let state: DisplayCharState = 'pending'

    if (mismatchIndex >= 0 && visibleCursor === mismatchIndex) {
      state = 'wrong'
    } else if (visibleCursor < correctChars) {
      state = 'correct'
    } else if (mismatchIndex === -1 && visibleCursor === normalizeWhitespace(input).length) {
      state = 'current'
    }

    targetDisplayStates.push(state)
    visibleCursor += 1
  }

  return {
    normalizedInput,
    normalizedTarget,
    isComplete,
    mismatchIndex,
    correctChars,
    targetDisplayStates,
  }
}

function getRandomNextIndex(currentIndex: number) {
  if (practiceSet.length <= 1) return currentIndex

  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * practiceSet.length)
  }
  return nextIndex
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedCount, setFinishedCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const current = practiceSet[currentIndex]
  const target = current.latex
  const comparison = useMemo(() => compareLatex(input, target), [input, target])
  const { normalizedInput, normalizedTarget, isComplete, mismatchIndex, correctChars, targetDisplayStates } = comparison
  const progress = normalizedTarget.length === 0 ? 0 : (correctChars / normalizedTarget.length) * 100

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex])

  useEffect(() => {
    if (!startedAt && input.length > 0) {
      setStartedAt(Date.now())
    }
  }, [input, startedAt])

  const elapsedMinutes = useMemo(() => {
    if (!startedAt) return 0
    return Math.max((Date.now() - startedAt) / 1000 / 60, 1 / 60)
  }, [startedAt, input, currentIndex])

  const cpm = Math.round(normalizedInput.length / elapsedMinutes)
  const accuracy = normalizedInput.length === 0 ? 100 : Math.round((correctChars / normalizedInput.length) * 100)

  const handleChange = (value: string) => {
    if (isComplete) return
    setInput(value)
  }

  const goNext = () => {
    setFinishedCount((count) => count + 1)
    setCurrentIndex((index) => getRandomNextIndex(index))
    setInput('')
    setStartedAt(null)
    setShowAnswer(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && isComplete) {
      event.preventDefault()
      goNext()
    }
  }

  const resetCurrent = () => {
    setInput('')
    setStartedAt(null)
    inputRef.current?.focus()
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Web LaTeX Typing Trainer</p>
          <h1>LaTeX 타자연습기</h1>
          <p className="subtitle">
            답안은 숨겨두고, 필요할 때만 펼쳐 보면서 연습하는 웹 기반 LaTeX 타자연습기.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <span>현재 문제</span>
            <strong>{current.title}</strong>
          </div>
          <div>
            <span>완료</span>
            <strong>{finishedCount}</strong>
          </div>
          <div>
            <span>정확도</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>CPM</span>
            <strong>{cpm}</strong>
          </div>
        </div>
      </section>

      <section className="trainer-grid">
        <article className="panel reference-panel">
          <div className="panel-head">
            <div>
              <p className="label">문제</p>
              <h2>{current.title}</h2>
            </div>
            <span className="hint">{current.note}</span>
          </div>

          <div className="formula-preview">
            <MathJax inline dynamic>{`\\(${target}\\)`}</MathJax>
          </div>

          <div className="answer-toggle-row">
            <button type="button" className="secondary" onClick={() => setShowAnswer((value) => !value)}>
              {showAnswer ? '정답 가리기' : '정답 보기'}
            </button>
          </div>

          {showAnswer ? (
            <div className="target-code" aria-label="target latex">
              {target.split('').map((char, index) => {
                const state = char.trim() === '' ? 'space' : targetDisplayStates[index]

                return (
                  <span
                    key={`${char}-${index}`}
                    className={[
                      'char',
                      state === 'space' ? 'space' : '',
                      state === 'correct' ? 'correct' : '',
                      state === 'wrong' ? 'wrong' : '',
                      state === 'current' ? 'current' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {char === ' ' ? '␣' : char}
                  </span>
                )
              })}
            </div>
          ) : (
            <div className="answer-hidden">정답은 숨겨져 있어. 필요하면 버튼 눌러서 확인해.</div>
          )}
        </article>

        <article className="panel input-panel">
          <div className="panel-head">
            <div>
              <p className="label">입력</p>
              <h2>그대로 입력해봐</h2>
            </div>
            <div className="progress-badge">진행률 {Math.round(progress)}%</div>
          </div>

          <textarea
            ref={inputRef}
            className="typing-input"
            value={input}
            onChange={(event) => handleChange(event.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            placeholder="여기에 LaTeX를 입력"
          />

          <div className="helper-text">
            공백, 간격 명령, 일부 큰 연산자 표기 순서, 단일 토큰 중괄호, left/right 차이는 판정에서 완화됨
          </div>

          <div className="status-row">
            <div className={`status ${isComplete ? 'success' : mismatchIndex >= 0 ? 'error' : 'idle'}`}>
              {isComplete
                ? '좋아, 동치 처리까지 반영해서 정답이야.'
                : mismatchIndex >= 0
                  ? `${mismatchIndex + 1}번째 유효 문자부터 다름`
                  : '좋아, 그대로 이어서 입력하면 돼.'}
            </div>
            <div className="button-row">
              <button type="button" className="secondary" onClick={resetCurrent}>
                다시 입력
              </button>
              <button type="button" className="primary" onClick={goNext} disabled={!isComplete}>
                다음 문제
              </button>
            </div>
          </div>

          <div className="live-preview">
            <p className="label">실시간 렌더 미리보기</p>
            <div className="preview-box">
              {input ? <MathJax inline dynamic>{`\\(${input}\\)`}</MathJax> : <span>입력한 LaTeX가 여기 렌더링돼.</span>}
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default App
