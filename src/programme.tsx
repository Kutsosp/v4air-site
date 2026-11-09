import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ProgrammePage } from '@/components/programme/ProgrammePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgrammePage />
  </StrictMode>,
)
