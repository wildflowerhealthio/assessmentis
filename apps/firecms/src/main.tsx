import React from 'react'
import ReactDOM from 'react-dom/client'

import { BrowserRouter } from 'react-router-dom'

// eslint-disable-next-line import/no-unassigned-import
import './index.css'

import App from './app'

// If this fails, we'll know
// oxlint-disable-next-line typescript/no-unsafe-type-assertion
ReactDOM.createRoot(document.querySelector('#root')!).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
