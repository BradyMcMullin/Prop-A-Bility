import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

//system check, delete later
console.log("SYSTEM CHECK: Supabase URL is", import.meta.env.VITE_SUPABASE_URL ? "CONNECTED" : "MISSING");

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
