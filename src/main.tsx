import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MathJaxContext } from 'better-react-mathjax'
import './index.css'
import App from './App.tsx'

const mathJaxConfig = {
  loader: { load: ['[tex]/ams'] },
  tex: {
    packages: { '[+]': ['ams'] },
    inlineMath: [['\\(', '\\)']],
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MathJaxContext version={3} config={mathJaxConfig}>
      <App />
    </MathJaxContext>
  </StrictMode>,
)
