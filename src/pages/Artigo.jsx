import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Artigo() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [artigo, setArtigo] = useState(null)
  const [fornecedores, setFornecedores] = useState([])
  const [artigosRelacionados, setArtigosRelacionados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarArtigo()
  }, [slug])

  const carregarArtigo = async () => {
    const { data, error } = await supabase
      .from('eventhub_artigos')
      .select('*')
      .eq('slug', slug)
      .eq('publicado', true)
      .single()

    if (error || !data) {
      navigate('/blog')
      return
    }

    setArtigo(data)

    // Atualiza views
    supabase
      .from('eventhub_artigos')
      .update({ views: (data.views || 0) + 1 })
      .eq('id', data.id)
      .then(() => {})

    // Busca fornecedores do segmento+cidade
    if (data.segmento && data.cidade) {
      supabase
        .from('eventhub_profiles')
        .select('id, slug, nome, segmento, cidade, estado, foto_perfil, foto_capa, verificado, destaque, descricao_ia')
        .eq('status', 'active')
        .eq('segmento', data.segmento)
        .ilike('cidade', `%${data.cidade}%`)
        .order('destaque', { ascending: false })
        .order('verificado', { ascending: false })
        .limit(6)
        .then(({ data: fdata }) => setFornecedores(fdata || []))
    }

    // Artigos relacionados
    supabase
      .from('eventhub_artigos')
      .select('id, slug, titulo, segmento, cidade, tipo')
      .eq('publicado', true)
      .eq('tipo', data.tipo)
      .neq('slug', slug)
      .limit(4)
      .then(({ data: adata }) => setArtigosRelacionados(adata || []))

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#D3C7AD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#28374A', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const a = artigo

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>

      {/* Meta tags dinâmicas via document (React não tem SSR aqui — suficiente para MVP) */}
      {/* Para SEO real: migrar para Vite SSG ou Next.js no futuro */}
      <MetaTags titulo={a.titulo} descricao={a.meta_description} imagem={a.imagem_destaque} />

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href="/blog" className="text-sm text-white/70 hover:text-white transition-colors">
            ← Todos os guias
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Artigo principal */}
          <article className="lg:col-span-2">

            {/* Breadcrumb */}
            <nav className="text-xs mb-4 flex items-center gap-1" style={{ color: '#6B6751' }}>
              <a href="/" className="hover:underline">Home</a>
              <span>/</span>
              <a href="/blog" className="hover:underline">Guias</a>
              {a.segmento && <>
                <span>/</span>
                <a href={`/fornecedores?segmento=${encodeURIComponent(a.segmento)}`}
                  className="hover:underline">{a.segmento}</a>
              </>}
            </nav>

            {/* Header do artigo */}
            <div className="rounded-2xl overflow-hidden bg-white mb-4">
              {a.imagem_destaque && (
                <img src={a.imagem_destaque} alt={a.titulo}
                  className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TipoBadge tipo={a.tipo} />
                  {a.gerado_por_ia && (
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: '#f0ede6', color: '#6B6751' }}>
                      ✨ Gerado com IA
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold leading-tight mb-2" style={{ color: '#28374A' }}>
                  {a.titulo}
                </h1>
                {a.subtitulo && (
                  <p className="text-base" style={{ color: '#6B6751' }}>{a.subtitulo}</p>
                )}
                <p className="text-xs mt-3" style={{ color: '#6B6751' }}>
                  Atualizado em {new Date(a.updated_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'long', year: 'numeric'
                  })} · {a.views || 0} leituras
                </p>
              </div>
            </div>

            {/* Conteúdo HTML do artigo */}
            <div className="rounded-2xl bg-white p-6 mb-4">
              <div
                className="artigo-content"
                style={{ color: '#28374A' }}
                dangerouslySetInnerHTML={{ __html: a.conteudo }}
              />
            </div>

            {/* Lista de fornecedores (se artigo local) */}
            {fornecedores.length > 0 && (
              <div className="rounded-2xl bg-white p-6 mb-4">
                <h2 className="text-lg font-bold mb-1" style={{ color: '#28374A' }}>
                  {a.segmento}s em {a.cidade}
                </h2>
                <p className="text-sm mb-4" style={{ color: '#6B6751' }}>
                  Profissionais cadastrados no EventoHub
                </p>
                <div className="space-y-3">
                  {fornecedores.map(f => (
                    <a key={f.id} href={`/f/${f.slug}`}
                      className="flex items-start gap-3 p-3 rounded-xl border transition-colors hover:border-amber-300"
                      style={{ borderColor: '#f0ede6' }}>
                      {f.foto_perfil
                        ? <img src={f.foto_perfil} alt={f.nome}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                            style={{ background: '#28374A', color: '#FFBD76' }}>
                            {f.nome.charAt(0)}
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm" style={{ color: '#28374A' }}>{f.nome}</p>
                          {f.verificado && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: '#28374A', color: '#FFBD76' }}>✓</span>
                          )}
                          {f.destaque && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full"
                              style={{ background: '#FFF3DC', color: '#8B5E00' }}>⭐</span>
                          )}
                        </div>
                        {f.descricao_ia && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#6B6751' }}>
                            {f.descricao_ia.slice(0, 100)}...
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium flex-shrink-0 self-center"
                        style={{ color: '#754437' }}>Ver perfil →</span>
                    </a>
                  ))}
                </div>
                <a href={`/fornecedores?segmento=${encodeURIComponent(a.segmento)}&cidade=${encodeURIComponent(a.cidade)}`}
                  className="block text-center mt-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Ver todos os {a.segmento.toLowerCase()}s em {a.cidade}
                </a>
              </div>
            )}

            {/* CTA cadastro (para artigos de prestadores) */}
            {a.tipo === 'guia_prestador' && (
              <div className="rounded-2xl p-6 text-center" style={{ background: '#28374A' }}>
                <p className="text-xl font-bold text-white mb-2">
                  Quer aparecer no Google?
                </p>
                <p className="text-sm text-white/70 mb-4">
                  Cadastre seu negócio gratuitamente no EventoHub e seja encontrado por clientes na sua cidade.
                </p>
                <a href="/cadastrar"
                  className="inline-block px-8 py-3 rounded-full font-bold text-sm"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Criar meu perfil grátis →
                </a>
              </div>
            )}

            {/* CTA para clientes */}
            {a.tipo === 'guia_cliente' && (
              <div className="rounded-2xl p-6 text-center" style={{ background: '#754437' }}>
                <p className="text-xl font-bold text-white mb-2">
                  Pronto para encontrar seus fornecedores?
                </p>
                <p className="text-sm text-white/70 mb-4">
                  Explore nossa lista de profissionais verificados e entre em contato direto.
                </p>
                <a href="/fornecedores"
                  className="inline-block px-8 py-3 rounded-full font-bold text-sm"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Ver fornecedores →
                </a>
              </div>
            )}

          </article>

          {/* Sidebar */}
          <aside className="space-y-4">

            {/* Artigos relacionados */}
            {artigosRelacionados.length > 0 && (
              <div className="rounded-2xl bg-white p-4 sticky top-4">
                <h3 className="font-semibold text-sm mb-3" style={{ color: '#28374A' }}>
                  Leia também
                </h3>
                <div className="space-y-3">
                  {artigosRelacionados.map(ar => (
                    <a key={ar.id} href={`/blog/${ar.slug}`}
                      className="block p-3 rounded-xl transition-colors hover:opacity-80"
                      style={{ background: '#f5f2ec' }}>
                      <TipoBadge tipo={ar.tipo} small />
                      <p className="text-sm font-medium mt-1 leading-snug" style={{ color: '#28374A' }}>
                        {ar.titulo}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CTA cadastro sidebar */}
            <div className="rounded-2xl p-4 text-center" style={{ background: '#28374A' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#FFBD76' }}>
                É prestador de eventos?
              </p>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                Cadastre seu negócio e apareça neste artigo.
              </p>
              <a href="/cadastrar"
                className="block py-2 rounded-xl text-xs font-bold"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Cadastrar grátis
              </a>
            </div>

          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 text-center mt-8 border-t" style={{ borderColor: '#C5B99A' }}>
        <p className="text-sm" style={{ color: '#6B6751' }}>
          © {new Date().getFullYear()} EventoHub · Feito com ☀️ no Brasil
        </p>
      </footer>

      {/* CSS para conteúdo do artigo */}
      <style>{`
        .artigo-content h2 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; color: #28374A; }
        .artigo-content h3 { font-size: 1.05rem; font-weight: 600; margin: 1.25rem 0 0.5rem; color: #28374A; }
        .artigo-content p  { margin-bottom: 0.875rem; line-height: 1.75; font-size: 0.9375rem; color: #3a3a3a; }
        .artigo-content ul, .artigo-content ol { margin: 0.75rem 0 1rem 1.25rem; }
        .artigo-content li { margin-bottom: 0.4rem; line-height: 1.6; font-size: 0.9375rem; color: #3a3a3a; }
        .artigo-content strong { font-weight: 600; color: #28374A; }
        .artigo-content a { color: #754437; text-decoration: underline; }
      `}</style>
    </div>
  )
}

function TipoBadge({ tipo, small }) {
  const map = {
    local: { label: 'Guia local', bg: '#EBF5FF', color: '#28374A' },
    guia_cliente: { label: 'Para clientes', bg: '#FFF3DC', color: '#8B5E00' },
    guia_prestador: { label: 'Para prestadores', bg: '#E8F5E9', color: '#1B5E20' },
  }
  const t = map[tipo] || map.local
  return (
    <span className={`inline-block font-medium rounded-full ${small ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'}`}
      style={{ background: t.bg, color: t.color }}>
      {t.label}
    </span>
  )
}

function MetaTags({ titulo, descricao, imagem }) {
  useEffect(() => {
    if (titulo) document.title = `${titulo} | EventoHub`
    setMeta('description', descricao)
    setMeta('og:title', titulo)
    setMeta('og:description', descricao)
    if (imagem) setMeta('og:image', imagem)
  }, [titulo, descricao, imagem])

  return null
}

function setMeta(name, content) {
  if (!content) return
  const isOg = name.startsWith('og:')
  let el = isOg
    ? document.querySelector(`meta[property="${name}"]`)
    : document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    if (isOg) el.setAttribute('property', name)
    else el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
