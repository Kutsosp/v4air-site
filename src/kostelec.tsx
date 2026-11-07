import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { KostelecPage } from '@/components/kostelec/KostelecPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <KostelecPage />
  </StrictMode>,
)
