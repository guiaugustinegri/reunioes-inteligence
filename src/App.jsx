import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import ReunioesLista from './components/ReunioesLista'
import ReuniaoForm from './components/ReuniaoForm'
import ReuniaoDetalhes from './components/ReuniaoDetalhes'
import ResumoIA from './components/ResumoIA'
import Gerenciar from './components/Gerenciar'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1>Painel de Reuniões</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Reuniões</Link>
              <Link to="/gerenciar" className="nav-link">Gerenciar</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ReunioesLista />} />
            <Route path="/reuniao/nova" element={<ReuniaoForm />} />
            <Route path="/reuniao/detalhes/:id" element={<ReuniaoDetalhes />} />
            <Route path="/reuniao/:id" element={<ReuniaoForm />} />
            <Route path="/resumo-ia/:id" element={<ResumoIA />} />
            <Route path="/gerenciar" element={<Gerenciar />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
