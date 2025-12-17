// Import React StrictMode for additional development checks
import { StrictMode } from 'react'
// Import createRoot for React 18+ concurrent rendering
import { createRoot } from 'react-dom/client'
// Import the main App component
import App from './App.tsx'
// Import global CSS styles
import './index.css'

// Get the root DOM element and render the React application
// StrictMode enables additional development checks and warnings
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
