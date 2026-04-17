import { useEffect, useMemo, useRef, useState } from 'react'
import { MathJax } from 'better-react-mathjax'
import './App.css'

type PracticeItem = {
  id: number
  title: string
  latex: string
  note: string
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
    note: '아래첨자와 위첨자 순서에 익숙해지기',
  },
  {
    id: 4,
    title: '적분식',
    latex: String.raw`\int_{0}^{\pi} \sin x \, dx`,
    note: '이스케이프와 간격 명령까지 포함한 식',
  },
  {
    id: 5,
    title: '행렬',
    latex: String.raw`\begin{bmatrix} a & b \\ c & d \end{bmatrix}`,
    note: 'environment와 줄바꿈 처리 연습',
  },
]

function getMismatchIndex(input: string, target: string) {
  const minLength = Math.min(input.length, target.length)

  for (let i = 0; i < minLength; i += 1) {
    if (input[i] !== target[i]) return i
  }

  return input.length > target.length ? target.length : -1
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedCount, setFinishedCount] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const current = practiceSet[currentIndex]
  const target = current.latex
  const isComplete = input === target
  const mismatchIndex = getMismatchIndex(input, target)
  const correctChars = mismatchIndex === -1 ? Math.min(input.length, target.length) : mismatchIndex
  const progress = (correctChars / target.length) * 100

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

  const cpm = Math.round(input.length / elapsedMinutes)
  const accuracy = input.length === 0 ? 100 : Math.round((correctChars / input.length) * 100)

  const handleChange = (value: string) => {
    if (isComplete) return
    setInput(value)
  }

  const goNext = () => {
    setFinishedCount((count) => count + 1)
    setCurrentIndex((index) => (index + 1) % practiceSet.length)
    setInput('')
    setStartedAt(null)
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
            식을 눈으로 보고 그대로 타이핑하면서 수식 입력 속도와 정확도를 올리는 연습용 MVP.
          </p>
        </div>
        <div className="hero-stats">
          <div>
            <span>문제</span>
            <strong>
              {currentIndex + 1}/{practiceSet.length}
            </strong>
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

          <div className="target-code" aria-label="target latex">
            {target.split('').map((char, index) => {
              const typed = input[index]
              const isCorrect = typed === char && index < input.length
              const isWrong = typed !== undefined && typed !== char
              const isCurrent = index === input.length

              return (
                <span
                  key={`${char}-${index}`}
                  className={[
                    'char',
                    isCorrect ? 'correct' : '',
                    isWrong ? 'wrong' : '',
                    isCurrent ? 'current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {char === ' ' ? '␣' : char}
                </span>
              )
            })}
          </div>
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
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            placeholder="여기에 LaTeX를 그대로 입력"
          />

          <div className="status-row">
            <div className={`status ${isComplete ? 'success' : mismatchIndex >= 0 ? 'error' : 'idle'}`}>
              {isComplete
                ? '완벽해. 다음 문제로 넘어갈 수 있어.'
                : mismatchIndex >= 0
                  ? `${mismatchIndex + 1}번째 문자부터 다름`
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
