import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ToastContainer } from 'react-toastify' // 1. Import the component
import 'react-toastify/dist/ReactToastify.css'   // 2. Import the styles
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <ToastContainer /> 
  </StrictMode>
)