import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { MathJax } from 'better-react-mathjax'
import './App.css'

import { compareLatex } from './latexCompare'
import { practiceCategories, practiceSet, type PracticeCategory, type PracticeItem } from './practiceSet'

const customCategoryPrefix = '업로드:'
const uploadedSetsStorageKey = 'latex-typing-trainer-uploaded-sets'

type UploadedItem = {
  title: string
  latex: string
  note?: string
  meaning?: string
}

type UploadedPracticeFile = {
  category: string
  items: UploadedItem[]
}

type UploadedSet = {
  key: string
  label: string
  items: PracticeItem[]
}

function isUploadedPracticeFile(value: unknown): value is UploadedPracticeFile {
  if (!value || typeof value !== 'object') return false

  const candidate = value as UploadedPracticeFile
  return (
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0 &&
    Array.isArray(candidate.items) &&
    candidate.items.length > 0 &&
    candidate.items.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        item.title.trim().length > 0 &&
        typeof item.latex === 'string' &&
        item.latex.trim().length > 0 &&
        (item.note === undefined || typeof item.note === 'string') &&
        (item.meaning === undefined || typeof item.meaning === 'string'),
    )
  )
}

function shuffleIndices(items: number[], excludeIndex?: number) {
  const indices = items.filter((index) => index !== excludeIndex)

  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }

  return indices
}

function App() {
  const [uploadedSets, setUploadedSets] = useState<UploadedSet[]>(() => {
    try {
      const raw = window.localStorage.getItem(uploadedSetsStorageKey)
      if (!raw) return []
      const parsed = JSON.parse(raw) as UploadedSet[]
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [uploadMessage, setUploadMessage] = useState('JSON 파일을 올리면 사용자 문제셋을 바로 추가할 수 있어.')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [category, setCategory] = useState<PracticeCategory | string>('전체')
  const allPracticeItems = useMemo(() => [...practiceSet, ...uploadedSets.flatMap((set) => set.items)], [uploadedSets])
  const allCategories = useMemo(
    () => [...practiceCategories, ...uploadedSets.map((set) => set.key)],
    [uploadedSets],
  )
  const queueRef = useRef<number[]>(shuffleIndices(allPracticeItems.map((_, index) => index), 0))
  const [input, setInput] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [finishedCount, setFinishedCount] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const visibleSet =
    category === '전체'
      ? allPracticeItems
      : allPracticeItems.filter((item) => item.category === category)
  const current = visibleSet[currentIndex] ?? visibleSet[0] ?? practiceSet[0]
  const target = current.latex
  const comparison = useMemo(() => compareLatex(input, target), [input, target])
  const { normalizedInput, normalizedTarget, isComplete, mismatchIndex, correctChars, targetDisplayStates } = comparison
  const progress = normalizedTarget.length === 0 ? 0 : (correctChars / normalizedTarget.length) * 100

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentIndex, category])

  useEffect(() => {
    if (!startedAt && input.length > 0) {
      setStartedAt(Date.now())
    }
  }, [input, startedAt])

  useEffect(() => {
    window.localStorage.setItem(uploadedSetsStorageKey, JSON.stringify(uploadedSets))
  }, [uploadedSets])

  const elapsedMinutes = useMemo(() => {
    if (!startedAt) return 0
    return Math.max((Date.now() - startedAt) / 1000 / 60, 1 / 60)
  }, [startedAt, input, currentIndex])

  const cpm = startedAt ? Math.round(normalizedInput.length / elapsedMinutes) : 0

  const handleChange = (value: string) => {
    if (isComplete) return
    setInput(value)
  }

  const resetSessionState = () => {
    setInput('')
    setStartedAt(null)
    setShowAnswer(false)
  }

  const selectCategory = (nextCategory: string) => {
    const nextVisibleSet = nextCategory === '전체' ? allPracticeItems : allPracticeItems.filter((p) => p.category === nextCategory)
    const initialQueue = shuffleIndices(nextVisibleSet.map((_, index) => index))
    const [firstIndex, ...rest] = initialQueue
    setCategory(nextCategory)
    setCurrentIndex(firstIndex ?? 0)
    queueRef.current = rest
    resetSessionState()
  }

  const goNext = () => {
    setFinishedCount((count) => count + 1)
    if (queueRef.current.length > 0) {
      const [nextIndex, ...rest] = queueRef.current
      queueRef.current = rest
      setCurrentIndex(nextIndex)
    } else {
      const nextItems = visibleSet.map((_, index) => index)
      const reshuffledQueue = shuffleIndices(nextItems, currentIndex)
      const [nextIndex, ...rest] = reshuffledQueue
      queueRef.current = rest
      setCurrentIndex(nextIndex ?? 0)
    }
    resetSessionState()
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const raw = await file.text()
      const parsed = JSON.parse(raw) as unknown

      if (!isUploadedPracticeFile(parsed)) {
        setUploadMessage('형식이 맞지 않아. category 문자열과 items 배열이 있는 JSON이어야 해.')
        return
      }

      const label = parsed.category.trim()
      const key = `${customCategoryPrefix}${label}`
      const nextUploadedItems: PracticeItem[] = parsed.items.map((item, index) => ({
        id: Date.now() + index,
        category: key,
        title: item.title.trim(),
        latex: item.latex.trim(),
        note: item.note?.trim() || '업로드한 문제',
        meaning: item.meaning?.trim() || undefined,
      }))

      setUploadedSets((prev) => [...prev.filter((set) => set.key !== key), { key, label, items: nextUploadedItems }])
      setUploadMessage(`업로드 완료, ${label} 카테고리 ${nextUploadedItems.length}문항 추가됨.`)
      setIsUploadModalOpen(false)
      setCategory(key)
      setCurrentIndex(0)
      queueRef.current = shuffleIndices(nextUploadedItems.map((_, index) => index), 0)
      resetSessionState()
    } catch {
      setUploadMessage('파일을 읽지 못했어. JSON 문법이 맞는지 확인해줘.')
    } finally {
      event.target.value = ''
    }
  }

  const removeUploadedSet = (key: string) => {
    setUploadedSets((prev) => prev.filter((set) => set.key !== key))

    if (category === key) {
      setCategory('전체')
      setCurrentIndex(0)
      queueRef.current = shuffleIndices(practiceSet.map((_, index) => index), 0)
      resetSessionState()
    }
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
      <section className="hero-card compact">
        <div className="hero-copy">
          <p className="eyebrow">Web LaTeX Typing Trainer</p>
          <h1>LaTeX 타자연습기</h1>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary" onClick={() => setIsUploadModalOpen(true)}>
            문제 업로드 관리
          </button>
        </div>
        <div className="hero-stats compact">
          <div>
            <span>문제</span>
            <strong>{current.title}</strong>
          </div>
          <div>
            <span>완료</span>
            <strong>{finishedCount}</strong>
          </div>
          <div>
            <span>전체</span>
            <strong>{allPracticeItems.length}</strong>
          </div>
          <div>
            <span>CPM</span>
            <strong>{cpm}</strong>
          </div>
        </div>
      </section>

      <section className="panel category-panel">
        <div className="panel-head">
          <div>
            <p className="label">분야</p>
            <h2>문제 범위 선택</h2>
          </div>
        </div>
        <div className="category-row">
          {allCategories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? 'primary' : 'secondary'}
              onClick={() => selectCategory(item)}
            >
              {item.startsWith(customCategoryPrefix) ? item.replace(customCategoryPrefix, '') : item}
            </button>
          ))}
        </div>
        <div className="category-meta">현재 선택된 분야 문제 수, {visibleSet.length}개</div>
      </section>

      {isUploadModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="문제 업로드 관리 창">
          <div className="modal-card panel">
            <div className="panel-head">
              <div>
                <p className="label">업로드</p>
                <h2>사용자 문제셋 관리</h2>
              </div>
              <button type="button" className="secondary" onClick={() => setIsUploadModalOpen(false)}>
                닫기
              </button>
            </div>

            <div className="upload-section">
              <label className="upload-label" htmlFor="practice-upload">
                JSON 파일 업로드
              </label>
              <input id="practice-upload" type="file" accept="application/json,.json" onChange={handleUpload} />
              <div className="upload-help">{uploadMessage}</div>
            </div>

            <div className="upload-section">
              <p className="label">형식 안내</p>
              <div className="format-box">
                <pre>{`{
  "category": "사용자문제",
  "items": [
    {
      "title": "문제명",
      "latex": "x^2+y^2",
      "note": "짧은 메모",
      "meaning": "짧은 설명"
    },
    {
      "title": "다음 문제",
      "latex": "\\frac{a}{b}",
      "note": "분수",
      "meaning": "a를 b로 나눈 분수야."
    }
  ]
}`}</pre>
              </div>
              <div className="upload-help">
                필수 필드, category, items[].title, items[].latex
                <br />
                선택 필드, items[].note, items[].meaning
                <br />
                같은 category 이름으로 다시 올리면 기존 업로드 세트를 새 파일 내용으로 교체해.
              </div>
            </div>

            <div className="upload-section">
              <p className="label">업로드된 문제셋</p>
              {uploadedSets.length === 0 ? (
                <div className="empty-uploaded">아직 업로드된 사용자 문제셋이 없어.</div>
              ) : (
                <div className="uploaded-set-list">
                  {uploadedSets.map((set) => (
                    <div key={set.key} className="uploaded-set-item">
                      <div>
                        <strong>{set.label}</strong>
                        <div className="upload-help">문항 수, {set.items.length}개</div>
                      </div>
                      <div className="button-row">
                        <button type="button" className="secondary" onClick={() => selectCategory(set.key)}>
                          바로 풀기
                        </button>
                        <button type="button" className="secondary" onClick={() => removeUploadedSet(set.key)}>
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

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

          {current.meaning ? <div className="meaning-box">{current.meaning}</div> : null}

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
