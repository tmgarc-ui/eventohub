import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TIPOS = [
  { id: '', label: 'Todos' },
  { id: 'guia_cliente', label: 'Para clientes' },
  { id: 'guia_prestador', label: 'Para prestadores' },
  { id: 'local', label: 'Por cidade' },
]

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [artigos, setArtigos] = useState([])
  const [loading, setLoading] = useState(true)
  const tipo = searchParams.get('tipo') || ''

  useEffect(() => {
    buscarArtigos()
  }, [tipo])

  const buscarArtigos = async () => {
    setLoading(true)
    let query = supabase
      .from('eventhub_artigos')
      .select('id, slug, titulo, subtitulo, tipo, segmento, cidade, meta_description, views, created_at')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (tipo) query = query.eq('tipo', tipo)

    const { data } = await query
    setArtigos(data || [])
    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>
      <header style={{ background: '#28374A' }}>
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href="/cadastrar"
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: '#FFBD76', color: '#28374A' }}>
            Cadastre seu negócio
          </a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#28374A' }}>Guias e dicas para eventos</h1>
          <p className="text-sm" style={{ color: '#6B6751' }}>
            Para quem organiza eventos e para quem trabalha com eles.
          </p>
        </div>

        {/* Filtro de tipo */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TIPOS.map(t => (
            <button
              key={t.id}
              onClick={() => setSearchParams(t.id ? { tipo: t.id } : {})}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
              style={{
                background: tipo === t.id ? '#28374A' : 'white',
                color: tipo === t.id ? 'white' : '#28374A',
                borderColor: tipo === t.id ? '#28374A' : '#D3C7AD'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl bg-white overflow-hidden animate-pulse">
                <div className="h-4 m-4 rounded" style={{ background: '#D3C7AD' }} />
                <div className="h-3 mx-4 mb-4 rounded" style={{ background: '#D3C7AD', width: '70%' }} />
              </div>
            ))}
          </div>
        ) : artigos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📚</p>
            <p className="font-medium" style={{ color: '#28374A' }}>Nenhum artigo ainda</p>
            <p className="text-sm" style={{ color: '#6B6751' }}>Os artigos são gerados automaticamente quando fornecedores se cadastram.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {artigos.map(a => (
              <a key={a.id} href={`/blog/${a.slug}`}
                className="block rounded-xl bg-white p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                <TipoBadge tipo={a.tipo} />
                <h2 className="text-sm font-semibold mt-2 mb-1 leading-snug" style={{ color: '#28374A' }}>
                  {a.titulo}
                </h2>
                {a.meta_description && (
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6B6751' }}>
                    {a.meta_description}
                  </p>
                )}
                <p className="text-xs mt-3" style={{ color: '#6B6751', opacity: 0.6 }}>
                  {a.views || 0} leituras
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TipoBadge({ tipo }) {
  const map = {
    local: { label: 'Guia local', bg: '#EBF5FF', color: '#28374A' },
    guia_cliente: { label: 'Para clientes', bg: '#FFF3DC', color: '#8B5E00' },
    guia_prestador: { label: 'Para prestadores', bg: '#E8F5E9', color: '#1B5E20' },
  }
  const t = map[tipo] || map.local
  return (
    <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ background: t.bg, color: t.color }}>
      {t.label}
    </span>
  )
}
