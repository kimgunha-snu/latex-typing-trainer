import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { MathJax } from 'better-react-mathjax'
import './App.css'

import { compareLatex } from './latexCompare'
import { practiceSet } from './practiceSet'

function shuffleIndices(excludeIndex?: number) {
  const indices = practiceSet.map((_, index) => index).filter((index) => index !== excludeIndex)

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [, setQueue] = useState<number[]>(() => shuffleIndices(0))
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
    setQueue((currentQueue) => {
      if (currentQueue.length > 0) {
        const [nextIndex, ...rest] = currentQueue
        setCurrentIndex(nextIndex)
        return rest
      }

      const reshuffledQueue = shuffleIndices(currentIndex)
      const [nextIndex, ...rest] = reshuffledQueue
      setCurrentIndex(nextIndex)
      return rest
    })
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
            <span>문제 수</span>
            <strong>{practiceSet.length}</strong>
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
            공백, 간격 명령, 일부 큰 연산자 표기 순서, 단일 토큰 중괄호, left/right, 함수 인자 중괄호, dx 표기 차이는 판정에서 완화됨
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
