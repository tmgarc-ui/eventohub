import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  { icon: '🎵', label: 'DJ' },
  { icon: '🍽️', label: 'Buffet' },
  { icon: '📷', label: 'Fotografia' },
  { icon: '🎬', label: 'Filmagem' },
  { icon: '🌸', label: 'Decoração' },
  { icon: '🏛️', label: 'Espaço para eventos' },
  { icon: '🎸', label: 'Banda / Música ao vivo' },
  { icon: '📋', label: 'Cerimonial' },
  { icon: '🎂', label: 'Bolo e doces' },
  { icon: '💡', label: 'Iluminação e som' },
]

export default function Home() {
  const navigate = useNavigate()
  const [busca, setBusca] = useState('')
  const [cidade, setCidade] = useState('')
  const [destaques, setDestaques] = useState([])
  const [stats, setStats] = useState({ fornecedores: 0, cidades: 0 })

  useEffect(() => {
    // Busca destaques
    supabase
      .from('eventhub_profiles')
      .select('id, slug, nome, segmento, cidade, estado, foto_perfil, foto_capa, verificado')
      .eq('status', 'active')
      .eq('destaque', true)
      .limit(6)
      .then(({ data }) => setDestaques(data || []))

    // Stats
    supabase
      .from('eventhub_profiles')
      .select('cidade', { count: 'exact' })
      .eq('status', 'active')
      .then(({ count, data }) => {
        const cidades = new Set((data || []).map(d => d.cidade)).size
        setStats({ fornecedores: count || 0, cidades })
      })
  }, [])

  const handleBusca = (segmento) => {
    const params = new URLSearchParams()
    if (segmento) params.set('segmento', segmento)
    if (cidade) params.set('cidade', cidade)
    if (busca && !segmento) params.set('q', busca)
    navigate(`/fornecedores?${params.toString()}`)
  }

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/fornecedores" className="text-sm text-white/70 hover:text-white transition-colors">Fornecedores</a>
            <a href="/blog" className="text-sm text-white/70 hover:text-white transition-colors">Guias</a>
            <a href="/cadastrar"
              className="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
              style={{ background: '#FFBD76', color: '#28374A' }}>
              Cadastre seu negócio
            </a>
          </nav>
          <a href="/cadastrar"
            className="md:hidden px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: '#FFBD76', color: '#28374A' }}>
            Cadastrar
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 text-center" style={{ background: '#28374A' }}>
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 leading-tight">
            Encontre os melhores<br />
            <span style={{ color: '#FFBD76' }}>fornecedores de eventos</span><br />
            na sua cidade
          </h1>
          <p className="text-white/70 mb-8 text-base">
            DJs, buffets, fotógrafos, decoração e muito mais —<br className="hidden sm:block" />
            todos verificados e prontos para o seu evento.
          </p>

          {/* Barra de busca */}
          <div className="flex flex-col sm:flex-row gap-2 max-w-lg mx-auto">
            <input
              type="text"
              placeholder="O que você precisa? DJ, buffet..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleBusca()}
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ color: '#28374A' }}
            />
            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={e => setCidade(e.target.value)}
              className="sm:w-36 px-4 py-3 rounded-xl text-sm outline-none"
              style={{ color: '#28374A' }}
            />
            <button
              onClick={() => handleBusca()}
              className="px-6 py-3 rounded-xl font-bold text-sm transition-colors"
              style={{ background: '#FFBD76', color: '#28374A' }}
            >
              Buscar
            </button>
          </div>

          {/* Stats */}
          {stats.fornecedores > 0 && (
            <p className="mt-5 text-sm text-white/50">
              {stats.fornecedores} fornecedores em {stats.cidades} cidades
            </p>
          )}
        </div>
      </section>

      {/* Segmentos */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-lg font-semibold mb-6" style={{ color: '#28374A' }}>
            Buscar por segmento
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {SEGMENTOS.map(seg => (
              <button
                key={seg.label}
                onClick={() => handleBusca(seg.label)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:scale-105"
                style={{ background: 'white' }}
              >
                <span className="text-2xl">{seg.icon}</span>
                <span className="text-xs font-medium leading-tight" style={{ color: '#28374A' }}>
                  {seg.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Destaques */}
      {destaques.length > 0 && (
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold" style={{ color: '#28374A' }}>
                Fornecedores em destaque
              </h2>
              <a href="/fornecedores" className="text-sm underline" style={{ color: '#754437' }}>
                Ver todos →
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {destaques.map(f => (
                <FornecedorCard key={f.id} fornecedor={f} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog / Guias */}
      <section className="py-10 px-4" style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-white mb-2">Guias e dicas</h2>
          <p className="text-sm text-white/60 mb-6">Para quem organiza eventos e para quem trabalha com eles.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { titulo: 'Checklist completo para organizar um casamento', href: '/blog/checklist-casamento', tag: 'Para clientes' },
              { titulo: 'Como precificar seus serviços de DJ', href: '/blog/como-precificar-dj', tag: 'Para prestadores' },
              { titulo: 'Quanto custa um evento para 150 pessoas', href: '/blog/custo-evento-150-pessoas', tag: 'Para clientes' },
              { titulo: 'Como conseguir mais clientes para seu buffet', href: '/blog/mais-clientes-buffet', tag: 'Para prestadores' },
            ].map(a => (
              <a key={a.href} href={a.href}
                className="flex items-start gap-3 p-4 rounded-xl transition-colors hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="text-xl flex-shrink-0">📚</span>
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block"
                    style={{
                      background: a.tag === 'Para clientes' ? '#FFF3DC' : 'rgba(255,255,255,0.1)',
                      color: a.tag === 'Para clientes' ? '#8B5E00' : '#FFBD76'
                    }}>
                    {a.tag}
                  </span>
                  <p className="text-sm font-medium text-white leading-snug">{a.titulo}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-6">
            <a href="/blog"
              className="inline-block px-6 py-2.5 rounded-full text-sm font-semibold border border-white/20 text-white hover:bg-white/10 transition-colors">
              Ver todos os guias →
            </a>
          </div>
        </div>
      </section>

      {/* CTA para prestadores */}
      <section className="py-12 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <div className="text-3xl mb-3">🚀</div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#28374A' }}>
            É prestador de serviços para eventos?
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6B6751' }}>
            Cadastre seu negócio gratuitamente e apareça nos resultados do Google quando clientes buscarem na sua cidade.
          </p>
          <a href="/cadastrar"
            className="inline-block px-8 py-3 rounded-full font-bold text-sm transition-all hover:opacity-90"
            style={{ background: '#FFBD76', color: '#28374A' }}>
            Cadastrar meu negócio grátis
          </a>
          <p className="text-xs mt-3" style={{ color: '#6B6751', opacity: 0.6 }}>
            Sem cartão de crédito. Perfil publicado em minutos.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center border-t" style={{ borderColor: '#C5B99A' }}>
        <p className="text-sm" style={{ color: '#6B6751' }}>
          © {new Date().getFullYear()} EventoHub · Feito com ☀️ no Brasil
        </p>
        <div className="flex justify-center gap-4 mt-2">
          <a href="/termos" className="text-xs underline" style={{ color: '#6B6751' }}>Termos</a>
          <a href="/privacidade" className="text-xs underline" style={{ color: '#6B6751' }}>Privacidade</a>
          <a href="/cadastrar" className="text-xs underline" style={{ color: '#754437' }}>Cadastre seu negócio</a>
        </div>
      </footer>

    </div>
  )
}

function FornecedorCard({ fornecedor }) {
  return (
    <a href={`/f/${fornecedor.slug}`}
      className="block rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      {/* Capa */}
      <div className="h-28 relative" style={{ background: '#D3C7AD' }}>
        {fornecedor.foto_capa
          ? <img src={fornecedor.foto_capa} alt={fornecedor.nome} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">🎉</div>
        }
        {fornecedor.verificado && (
          <span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: '#28374A', color: '#FFBD76' }}>
            ✓ Verificado
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3 flex items-start gap-3">
        {fornecedor.foto_perfil
          ? <img src={fornecedor.foto_perfil} alt={fornecedor.nome}
              className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0 -mt-6"
              style={{ borderColor: '#FFBD76', background: 'white' }} />
          : <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold -mt-6 flex-shrink-0 border-2"
              style={{ background: '#28374A', color: '#FFBD76', borderColor: 'white' }}>
              {fornecedor.nome.charAt(0)}
            </div>
        }
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: '#28374A' }}>{fornecedor.nome}</p>
          <p className="text-xs" style={{ color: '#6B6751' }}>
            {fornecedor.segmento} · {fornecedor.cidade}
          </p>
        </div>
      </div>
    </a>
  )
}
