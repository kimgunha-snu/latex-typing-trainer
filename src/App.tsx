import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type UIEvent } from 'react'
import { MathJax } from 'better-react-mathjax'
import './App.css'

import { compareLatex } from './latexCompare'
import { practiceCategories, practiceSet, type PracticeCategory, type PracticeItem } from './practiceSet'

const customCategoryPrefix = '업로드:'
const uploadedSetsStorageKey = 'latex-typing-trainer-uploaded-sets'
const languageStorageKey = 'latex-typing-trainer-language'
const cheatsheetSymbols = [
  String.raw`\pm`, String.raw`\mp`, String.raw`\dotplus`,
  String.raw`\times`, String.raw`\div`, String.raw`\divideontimes`, String.raw`\backslash`,
  String.raw`\cdot`, String.raw`\ast`, String.raw`\star`, String.raw`\circ`, String.raw`\bullet`,
  String.raw`\boxplus`, String.raw`\boxminus`, String.raw`\boxtimes`, String.raw`\boxdot`,
  String.raw`\oplus`, String.raw`\ominus`, String.raw`\otimes`, String.raw`\oslash`, String.raw`\odot`,
  String.raw`\circleddash`, String.raw`\circledcirc`, String.raw`\circledast`,
  String.raw`\bigoplus`, String.raw`\bigotimes`, String.raw`\bigodot`,
  String.raw`\ltimes`, String.raw`\rtimes`,
  String.raw`\centerdot`, String.raw`\leftthreetimes`, String.raw`\rightthreetimes`,
  String.raw`\intercal`, String.raw`\barwedge`, String.raw`\veebar`, String.raw`\doublebarwedge`,
  String.raw`\amalg`, String.raw`\dagger`, String.raw`\ddagger`,
  String.raw`\wr`, String.raw`\triangleleft`, String.raw`\triangleright`,

  String.raw`\{`, String.raw`\}`, String.raw`\emptyset`, String.raw`\varnothing`,
  String.raw`\in`, String.raw`\notin`, String.raw`\not\in`, String.raw`\ni`, String.raw`\not\ni`,
  String.raw`\cap`, String.raw`\Cap`, String.raw`\sqcap`, String.raw`\bigcap`,
  String.raw`\cup`, String.raw`\Cup`, String.raw`\sqcup`, String.raw`\bigcup`, String.raw`\bigsqcup`, String.raw`\uplus`, String.raw`\biguplus`,
  String.raw`\setminus`, String.raw`\smallsetminus`,
  String.raw`\subset`, String.raw`\not\subset`, String.raw`\Subset`, String.raw`\sqsubset`,
  String.raw`\supset`, String.raw`\not\supset`, String.raw`\Supset`, String.raw`\sqsupset`,
  String.raw`\subseteq`, String.raw`\nsubseteq`, String.raw`\subsetneq`, String.raw`\varsubsetneq`, String.raw`\sqsubseteq`,
  String.raw`\supseteq`, String.raw`\nsupseteq`, String.raw`\supsetneq`, String.raw`\varsupsetneq`, String.raw`\sqsupseteq`,
  String.raw`\subseteqq`, String.raw`\nsubseteqq`, String.raw`\subsetneqq`, String.raw`\varsubsetneqq`,
  String.raw`\supseteqq`, String.raw`\nsupseteqq`, String.raw`\supsetneqq`, String.raw`\varsupsetneqq`,

  String.raw`\ne`, String.raw`\neq`, String.raw`\equiv`, String.raw`\not\equiv`,
  String.raw`\doteq`, String.raw`\doteqdot`, String.raw`\overset{\underset{\mathrm{def}}{}}{=}`, String.raw`:=`,
  String.raw`\sim`, String.raw`\nsim`, String.raw`\backsim`, String.raw`\thicksim`, String.raw`\simeq`, String.raw`\backsimeq`, String.raw`\eqsim`, String.raw`\cong`, String.raw`\ncong`,
  String.raw`\approx`, String.raw`\thickapprox`, String.raw`\approxeq`, String.raw`\asymp`, String.raw`\propto`, String.raw`\varpropto`,
  String.raw`\nless`, String.raw`\ll`, String.raw`\not\ll`, String.raw`\lll`, String.raw`\not\lll`, String.raw`\lessdot`,
  String.raw`\ngtr`, String.raw`\gg`, String.raw`\not\gg`, String.raw`\ggg`, String.raw`\not\ggg`, String.raw`\gtrdot`,
  String.raw`\le`, String.raw`\leq`, String.raw`\lneq`, String.raw`\leqq`, String.raw`\nleq`, String.raw`\nleqq`, String.raw`\lneqq`, String.raw`\lvertneqq`,
  String.raw`\ge`, String.raw`\geq`, String.raw`\gneq`, String.raw`\geqq`, String.raw`\ngeq`, String.raw`\ngeqq`, String.raw`\gneqq`, String.raw`\gvertneqq`,
  String.raw`\lessgtr`, String.raw`\lesseqgtr`, String.raw`\lesseqqgtr`, String.raw`\gtrless`, String.raw`\gtreqless`, String.raw`\gtreqqless`,
  String.raw`\leqslant`, String.raw`\nleqslant`, String.raw`\eqslantless`,
  String.raw`\geqslant`, String.raw`\ngeqslant`, String.raw`\eqslantgtr`,
  String.raw`\lesssim`, String.raw`\lnsim`, String.raw`\lessapprox`, String.raw`\lnapprox`,
  String.raw`\gtrsim`, String.raw`\gnsim`, String.raw`\gtrapprox`, String.raw`\gnapprox`,
  String.raw`\prec`, String.raw`\nprec`, String.raw`\preceq`, String.raw`\npreceq`, String.raw`\precneqq`,
  String.raw`\succ`, String.raw`\nsucc`, String.raw`\succeq`, String.raw`\nsucceq`, String.raw`\succneqq`,
  String.raw`\preccurlyeq`, String.raw`\curlyeqprec`,
  String.raw`\succcurlyeq`, String.raw`\curlyeqsucc`,
  String.raw`\precsim`, String.raw`\precnsim`, String.raw`\precapprox`, String.raw`\precnapprox`,
  String.raw`\succsim`, String.raw`\succnsim`, String.raw`\succapprox`, String.raw`\succnapprox`,
  String.raw`\vartriangleleft`, String.raw`\ntriangleleft`, String.raw`\vartriangleright`, String.raw`\ntriangleright`,
  String.raw`\trianglelefteq`, String.raw`\ntrianglelefteq`, String.raw`\trianglerighteq`, String.raw`\ntrianglerighteq`,
  String.raw`\diagup`, String.raw`\diagdown`,
  String.raw`\eqcirc`, String.raw`\circeq`, String.raw`\triangleq`, String.raw`\bumpeq`, String.raw`\Bumpeq`, String.raw`\risingdotseq`, String.raw`\fallingdotseq`,
  String.raw`\between`, String.raw`\pitchfork`,
  String.raw`\smile`, String.raw`\frown`,

  String.raw`\parallel`, String.raw`\nparallel`, String.raw`\shortparallel`, String.raw`\nshortparallel`,
  String.raw`\perp`, String.raw`\angle`, String.raw`\sphericalangle`, String.raw`\measuredangle`, String.raw`45^\circ`,
  String.raw`\Box`, String.raw`\blacksquare`, String.raw`\diamond`, String.raw`\Diamond`, String.raw`\lozenge`, String.raw`\blacklozenge`, String.raw`\bigstar`,
  String.raw`\bigcirc`, String.raw`\triangle`, String.raw`\bigtriangleup`, String.raw`\bigtriangledown`,
  String.raw`\vartriangle`, String.raw`\triangledown`,
  String.raw`\blacktriangle`, String.raw`\blacktriangledown`, String.raw`\blacktriangleleft`, String.raw`\blacktriangleright`,

  String.raw`\forall`, String.raw`\exists`, String.raw`\nexists`,
  String.raw`\therefore`, String.raw`\because`, String.raw`\And`,
  String.raw`\lor`, String.raw`\vee`, String.raw`\curlyvee`, String.raw`\bigvee`,
  String.raw`\land`, String.raw`\wedge`, String.raw`\curlywedge`, String.raw`\bigwedge`,
  String.raw`\lnot`, String.raw`\neg`, String.raw`\not\operatorname{R}`, String.raw`\bot`, String.raw`\top`,
  String.raw`\vdash`, String.raw`\dashv`, String.raw`\vDash`, String.raw`\Vdash`, String.raw`\models`,
  String.raw`\Vvdash`, String.raw`\nvdash`, String.raw`\nVdash`, String.raw`\nvDash`, String.raw`\nVDash`,
  String.raw`\ulcorner`, String.raw`\urcorner`, String.raw`\llcorner`, String.raw`\lrcorner`,

  String.raw`\Rrightarrow`, String.raw`\Lleftarrow`,
  String.raw`\Rightarrow`, String.raw`\nRightarrow`, String.raw`\Longrightarrow`, String.raw`\implies`,
  String.raw`\Leftarrow`, String.raw`\nLeftarrow`, String.raw`\Longleftarrow`,
  String.raw`\Leftrightarrow`, String.raw`\nLeftrightarrow`, String.raw`\Longleftrightarrow`, String.raw`\iff`,
  String.raw`\Uparrow`, String.raw`\Downarrow`, String.raw`\Updownarrow`,
  String.raw`\rightarrow`, String.raw`\to`, String.raw`\nrightarrow`, String.raw`\longrightarrow`,
  String.raw`\leftarrow`, String.raw`\gets`, String.raw`\nleftarrow`, String.raw`\longleftarrow`,
  String.raw`\leftrightarrow`, String.raw`\nleftrightarrow`, String.raw`\longleftrightarrow`,
  String.raw`\uparrow`, String.raw`\downarrow`, String.raw`\updownarrow`,
  String.raw`\nearrow`, String.raw`\swarrow`, String.raw`\nwarrow`, String.raw`\searrow`,
  String.raw`\mapsto`, String.raw`\longmapsto`,
  String.raw`\rightharpoonup`, String.raw`\rightharpoondown`, String.raw`\leftharpoonup`, String.raw`\leftharpoondown`, String.raw`\upharpoonleft`, String.raw`\upharpoonright`, String.raw`\downharpoonleft`, String.raw`\downharpoonright`, String.raw`\rightleftharpoons`, String.raw`\leftrightharpoons`,
  String.raw`\curvearrowleft`, String.raw`\circlearrowleft`, String.raw`\Lsh`, String.raw`\upuparrows`, String.raw`\rightrightarrows`, String.raw`\rightleftarrows`, String.raw`\rightarrowtail`, String.raw`\looparrowright`,
  String.raw`\curvearrowright`, String.raw`\circlearrowright`, String.raw`\Rsh`, String.raw`\downdownarrows`, String.raw`\leftleftarrows`, String.raw`\leftrightarrows`, String.raw`\leftarrowtail`, String.raw`\looparrowleft`,
  String.raw`\hookrightarrow`, String.raw`\hookleftarrow`, String.raw`\multimap`, String.raw`\leftrightsquigarrow`, String.raw`\rightsquigarrow`, String.raw`\twoheadrightarrow`, String.raw`\twoheadleftarrow`,
] as const

type SymbolQuizItem = {
  symbol: string
  latex: string
}

const symbolQuizItems: SymbolQuizItem[] = cheatsheetSymbols.map((latex) => ({
  symbol: latex,
  latex,
}))
const cheatsheetPageSize = 48

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

type RecentResult = {
  title: string
  cpm: number
}

type Language = 'ko' | 'en'

const messages = {
  ko: {
    appTitle: 'LaTeX 타자연습기',
    cheatsheet: 'LaTeX 치트시트',
    symbolQuiz: '기호 퀴즈',
    uploadManager: '문제 업로드 관리',
    problem: '문제',
    completed: '완료',
    total: '전체',
    categoryLabel: '분야',
    categoryTitle: '문제 범위 선택',
    currentCategoryCount: '현재 선택된 분야 문제 수',
    close: '닫기',
    miniGame: '미니 게임',
    symbolQuizTitle: '기호 보고 명령어 맞히기',
    symbolQuizPrompt: '이 기호의 LaTeX 명령어는?',
    grade: '채점',
    revealAnswer: '정답 보기',
    nextProblem: '다음 문제',
    summaryTitle: '최근 3문제 결과',
    summaryLabel: '세션 요약',
    adSlot: '광고 / 추천 / 보상 자리',
    uploadLabel: '업로드',
    uploadTitle: '사용자 문제셋 관리',
  },
  en: {
    appTitle: 'LaTeX Typing Trainer',
    cheatsheet: 'LaTeX Cheatsheet',
    symbolQuiz: 'Symbol Quiz',
    uploadManager: 'Upload Sets',
    problem: 'Problem',
    completed: 'Done',
    total: 'Total',
    categoryLabel: 'Category',
    categoryTitle: 'Choose Practice Scope',
    currentCategoryCount: 'Problems in current selection',
    close: 'Close',
    miniGame: 'Mini Game',
    symbolQuizTitle: 'Guess the command from the symbol',
    symbolQuizPrompt: 'What is the LaTeX command for this symbol?',
    grade: 'Check',
    revealAnswer: 'Show Answer',
    nextProblem: 'Next',
    summaryTitle: 'Last 3 Problems Summary',
    summaryLabel: 'Session Summary',
    adSlot: 'Ad / recommendation / reward slot',
    uploadLabel: 'Upload',
    uploadTitle: 'Custom Practice Sets',
  },
} as const

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
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = window.localStorage.getItem(languageStorageKey)
      return stored === 'en' ? 'en' : 'ko'
    } catch {
      return 'ko'
    }
  })
  const [uploadMessage, setUploadMessage] = useState('JSON 파일을 올리면 사용자 문제셋을 바로 추가할 수 있어.')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isCheatsheetOpen, setIsCheatsheetOpen] = useState(false)
  const [isSymbolQuizOpen, setIsSymbolQuizOpen] = useState(false)
  const [cheatsheetVisibleCount, setCheatsheetVisibleCount] = useState(cheatsheetPageSize)
  const [isCheatsheetLoading, setIsCheatsheetLoading] = useState(false)
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
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [isSessionSummaryOpen, setIsSessionSummaryOpen] = useState(false)
  const [symbolQuizIndex, setSymbolQuizIndex] = useState(() => Math.floor(Math.random() * symbolQuizItems.length))
  const [symbolQuizInput, setSymbolQuizInput] = useState('\\')
  const [symbolQuizResult, setSymbolQuizResult] = useState<'idle' | 'correct' | 'wrong' | 'revealed'>('idle')

  const t = messages[language]

  const visibleSet =
    category === '전체'
      ? allPracticeItems
      : allPracticeItems.filter((item) => item.category === category)
  const current = visibleSet[currentIndex] ?? visibleSet[0] ?? practiceSet[0]
  const currentSymbolQuiz = symbolQuizItems[symbolQuizIndex] ?? symbolQuizItems[0]
  const visibleCheatsheetSymbols = cheatsheetSymbols.slice(0, cheatsheetVisibleCount)
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

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language)
    document.documentElement.lang = language
  }, [language])

  useEffect(() => {
    const hasOpenModal = isCheatsheetOpen || isSymbolQuizOpen || isUploadModalOpen || isSessionSummaryOpen
    if (!hasOpenModal) return

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsCheatsheetOpen(false)
      setIsSymbolQuizOpen(false)
      setIsUploadModalOpen(false)
      setIsSessionSummaryOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCheatsheetOpen, isSymbolQuizOpen, isUploadModalOpen, isSessionSummaryOpen])

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
    const currentCpm = startedAt ? Math.round(normalizedInput.length / elapsedMinutes) : 0
    const nextResults = [...recentResults, { title: current.title, cpm: currentCpm }]

    setFinishedCount((count) => count + 1)
    setRecentResults(nextResults.length >= 3 ? nextResults.slice(-3) : nextResults)
    if (nextResults.length >= 3) {
      setIsSessionSummaryOpen(true)
    }

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

  const loadMoreCheatsheetSymbols = () => {
    if (isCheatsheetLoading || cheatsheetVisibleCount >= cheatsheetSymbols.length) return
    setIsCheatsheetLoading(true)
    window.setTimeout(() => {
      setCheatsheetVisibleCount((count) => Math.min(count + cheatsheetPageSize, cheatsheetSymbols.length))
      setIsCheatsheetLoading(false)
    }, 250)
  }

  const handleCheatsheetScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget
    const remaining = element.scrollHeight - element.scrollTop - element.clientHeight
    if (remaining < 120) {
      loadMoreCheatsheetSymbols()
    }
  }

  const nextSymbolQuiz = () => {
    let nextIndex = Math.floor(Math.random() * symbolQuizItems.length)
    if (symbolQuizItems.length > 1 && nextIndex === symbolQuizIndex) {
      nextIndex = (nextIndex + 1) % symbolQuizItems.length
    }
    setSymbolQuizIndex(nextIndex)
    setSymbolQuizInput('\\')
    setSymbolQuizResult('idle')
  }

  const checkSymbolQuizAnswer = () => {
    const answer = symbolQuizInput.trim()

    if (answer === currentSymbolQuiz.latex) {
      setSymbolQuizResult('correct')
      return
    }

    setSymbolQuizResult('wrong')
  }

  const revealSymbolQuizAnswer = () => {
    setSymbolQuizInput(currentSymbolQuiz.latex)
    setSymbolQuizResult('revealed')
  }

  const closeSessionSummary = () => {
    setIsSessionSummaryOpen(false)
    setRecentResults([])
  }

  return (
    <main className="app-shell">
      <section className="hero-card compact">
        <div className="hero-copy">
          <p className="eyebrow">Web LaTeX Typing Trainer</p>
          <h1>{t.appTitle}</h1>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setCheatsheetVisibleCount(cheatsheetPageSize)
              setIsCheatsheetOpen(true)
            }}
          >
            {t.cheatsheet}
          </button>
          <button type="button" className="secondary" onClick={() => setIsSymbolQuizOpen(true)}>
            {t.symbolQuiz}
          </button>
          <button type="button" className="secondary" onClick={() => setIsUploadModalOpen(true)}>
            {t.uploadManager}
          </button>
        </div>
+        <div className="hero-language">
+          <button type="button" className="secondary language-toggle" onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}>
+            {language === 'ko' ? 'EN' : 'KO'}
+          </button>
+        </div>
        <div className="hero-stats compact">
          <div>
            <span>{t.problem}</span>
            <strong>{current.title}</strong>
          </div>
          <div>
            <span>{t.completed}</span>
            <strong>{finishedCount}</strong>
          </div>
          <div>
            <span>{t.total}</span>
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
            <p className="label">{t.categoryLabel}</p>
            <h2>{t.categoryTitle}</h2>
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
        <div className="category-meta">{t.currentCategoryCount}, {visibleSet.length}</div>
      </section>

      {isSymbolQuizOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="LaTeX 기호 퀴즈 창">
          <div className="modal-card panel symbol-quiz-modal">
            <div className="panel-head">
              <div>
                <p className="label">{t.miniGame}</p>
                <h2>{t.symbolQuizTitle}</h2>
              </div>
              <button type="button" className="secondary" onClick={() => setIsSymbolQuizOpen(false)}>
                {t.close}
              </button>
            </div>

            <div className="symbol-quiz-card">
              <p className="symbol-quiz-label">{t.symbolQuizPrompt}</p>
              <div className="symbol-quiz-symbol">
                <MathJax inline dynamic>{`\\(${currentSymbolQuiz.symbol}\\)`}</MathJax>
              </div>
              <input
                className="symbol-quiz-input"
                value={symbolQuizInput}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setSymbolQuizInput(nextValue.startsWith('\\') || nextValue.length === 0 ? nextValue || '\\' : `\\${nextValue}`)
                  if (symbolQuizResult !== 'idle') setSymbolQuizResult('idle')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    if (symbolQuizResult === 'correct') nextSymbolQuiz()
                    else checkSymbolQuizAnswer()
                  }
                }}
                placeholder="예: \\subseteq"
              />
              <div className="button-row">
                <button type="button" className="primary" onClick={checkSymbolQuizAnswer}>
                  {t.grade}
                </button>
                <button type="button" className="secondary" onClick={revealSymbolQuizAnswer}>
                  {t.revealAnswer}
                </button>
                <button type="button" className="secondary" onClick={nextSymbolQuiz}>
                  {t.nextProblem}
                </button>
              </div>
              <div className={`symbol-quiz-feedback ${symbolQuizResult}`}>
                {symbolQuizResult === 'correct'
                  ? '정답! Enter를 누르거나 다음 문제 버튼으로 계속 갈 수 있어.'
                  : symbolQuizResult === 'wrong'
                    ? '아직 아니야. 다시 입력해보거나 정답 보기를 눌러봐.'
                    : symbolQuizResult === 'revealed'
                      ? '정답을 입력창에 채워뒀어.'
                      : ''}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isCheatsheetOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="LaTeX 치트시트 창">
          <div className="modal-card panel" onScroll={handleCheatsheetScroll}>
            <div className="panel-head">
              <div>
                <p className="label">{t.cheatsheet}</p>
                <h2>{t.cheatsheet}</h2>
              </div>
              <button type="button" className="secondary" onClick={() => setIsCheatsheetOpen(false)}>
                {t.close}
              </button>
            </div>

            <div className="cheatsheet-table" role="table" aria-label="LaTeX 기호 치트시트 표">
              {visibleCheatsheetSymbols.map((latex) => (
                <div key={latex} className="cheatsheet-row" role="row">
                  <div className="cheatsheet-render" role="cell">
                    <MathJax inline dynamic>{`\\(${latex}\\)`}</MathJax>
                  </div>
                  <code className="cheatsheet-code" role="cell">{latex}</code>
                </div>
              ))}
            </div>

            {cheatsheetVisibleCount < cheatsheetSymbols.length ? (
              <div className="cheatsheet-actions">
                {isCheatsheetLoading ? (
                  <div className="cheatsheet-loading">
                    <span className="spinner" aria-hidden="true" />
                    불러오는 중... ({visibleCheatsheetSymbols.length}/{cheatsheetSymbols.length})
                  </div>
                ) : (
                  <div className="cheatsheet-loading cheatsheet-loading-idle">
                    아래로 스크롤하면 자동으로 더 불러와. ({visibleCheatsheetSymbols.length}/{cheatsheetSymbols.length})
                  </div>
                )}
              </div>
            ) : null}

          </div>
        </div>
      ) : null}

      {isSessionSummaryOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="최근 문제 결과 요약 창">
          <div className="modal-card panel summary-modal">
            <div className="panel-head">
              <div>
                <p className="label">{t.summaryLabel}</p>
                <h2>{t.summaryTitle}</h2>
              </div>
              <button type="button" className="secondary" onClick={closeSessionSummary}>
                {t.close}
              </button>
            </div>

            <div className="summary-stats-grid">
              <div className="summary-stat-card">
                <span>문제 수</span>
                <strong>{recentResults.length}</strong>
              </div>
              <div className="summary-stat-card">
                <span>평균 CPM</span>
                <strong>
                  {recentResults.length > 0
                    ? Math.round(recentResults.reduce((sum, item) => sum + item.cpm, 0) / recentResults.length)
                    : 0}
                </strong>
              </div>
              <div className="summary-stat-card ad-slot-card">
                <span>Slot</span>
                <strong>{t.adSlot}</strong>
              </div>
            </div>

            <div className="summary-result-list">
              {recentResults.map((item, index) => (
                <div key={`${item.title}-${index}`} className="summary-result-item">
                  <div>
                    <div className="summary-result-index">문제 {index + 1}</div>
                    <strong>{item.title}</strong>
                  </div>
                  <div className="summary-result-cpm">{item.cpm} CPM</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {isUploadModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="문제 업로드 관리 창">
          <div className="modal-card panel">
            <div className="panel-head">
              <div>
                <p className="label">{t.uploadLabel}</p>
                <h2>{t.uploadTitle}</h2>
              </div>
              <button type="button" className="secondary" onClick={() => setIsUploadModalOpen(false)}>
                {t.close}
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
      "latex": "\\\\frac{a}{b}",
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
                JSON 문자열 안에 LaTeX를 넣을 땐 역슬래시를 두 번 써야 해. 예: <code>{String.raw`\\frac{a}{b}`}</code>
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
