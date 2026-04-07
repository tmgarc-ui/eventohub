import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Fornecedores from './pages/Fornecedores'
import Perfil from './pages/Perfil'
import Cadastrar from './pages/Cadastrar'
import Painel from './pages/Painel'
import Blog from './pages/Blog'
import Artigo from './pages/Artigo'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/fornecedores"  element={<Fornecedores />} />
        <Route path="/f/:slug"       element={<Perfil />} />
        <Route path="/cadastrar"     element={<Cadastrar />} />
        <Route path="/painel"        element={<Painel />} />
        <Route path="/blog"          element={<Blog />} />
        <Route path="/blog/:slug"    element={<Artigo />} />
      </Routes>
    </BrowserRouter>
  )
}
