import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Perfil() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [fornecedor, setFornecedor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fotoAtiva, setFotoAtiva] = useState(0)

  useEffect(() => {
    carregarPerfil()
  }, [slug])

  const carregarPerfil = async () => {
    const { data, error } = await supabase
      .from('eventhub_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !data) {
      navigate('/fornecedores')
      return
    }
    setFornecedor(data)
    setLoading(false)

    // Registra visualização (fire and forget)
    registrarEvento(data.id, 'view')
  }

  const registrarEvento = async (profileId, tipo, origem) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, tipo, origem: origem || document.referrer })
    }).catch(() => {})
  }

  const abrirWhatsApp = () => {
    if (!fornecedor?.whatsapp) return
    registrarEvento(fornecedor.id, 'whatsapp')
    const numero = fornecedor.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent(
      `Olá ${fornecedor.nome}! Encontrei seu perfil no EventoHub e gostaria de saber mais sobre seus serviços.`
    )
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank')
  }

  const abrirEmail = () => {
    if (!fornecedor?.email) return
    registrarEvento(fornecedor.id, 'email')
    window.location.href = `mailto:${fornecedor.email}?subject=Interesse nos seus serviços&body=Olá ${fornecedor.nome}, encontrei seu perfil no EventoHub...`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#D3C7AD' }}>
        <div className="text-center">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-3"
            style={{ borderColor: '#28374A', borderTopColor: 'transparent' }} />
          <p className="text-sm" style={{ color: '#6B6751' }}>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const f = fornecedor
  const galeria = [f.foto_capa, ...(f.galeria || [])].filter(Boolean)

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href={`/fornecedores?segmento=${encodeURIComponent(f.segmento)}`}
            className="text-sm text-white/70 hover:text-white transition-colors">
            ← {f.segmento}s
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-4">

            {/* Card principal */}
            <div className="rounded-2xl overflow-hidden bg-white">
              {/* Capa */}
              <div className="h-44 relative" style={{ background: '#28374A' }}>
                {f.foto_capa
                  ? <img src={f.foto_capa} alt={f.nome} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🎉</div>
                }
                <div className="absolute top-3 right-3 flex gap-2">
                  {f.destaque && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ background: '#FFBD76', color: '#28374A' }}>⭐ Destaque</span>
                  )}
                  {f.verificado && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full"
                      style={{ background: '#28374A', color: '#FFBD76' }}>✓ Verificado</span>
                  )}
                </div>
              </div>

              {/* Info do perfil */}
              <div className="px-5 pb-5">
                <div className="flex items-end gap-4 -mt-6 mb-4">
                  {f.foto_perfil
                    ? <img src={f.foto_perfil} alt={f.nome}
                        className="w-16 h-16 rounded-full object-cover border-4 flex-shrink-0"
                        style={{ borderColor: 'white', background: 'white' }} />
                    : <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 flex-shrink-0"
                        style={{ background: '#28374A', color: '#FFBD76', borderColor: 'white' }}>
                        {f.nome.charAt(0)}
                      </div>
                  }
                  <div className="pb-1">
                    <h1 className="text-xl font-bold leading-tight" style={{ color: '#28374A' }}>{f.nome}</h1>
                    <p className="text-sm" style={{ color: '#6B6751' }}>
                      {f.segmento} · {f.cidade}/{f.estado}
                    </p>
                  </div>
                </div>

                {/* Descrição */}
                {f.descricao_ia && (
                  <div className="prose prose-sm max-w-none">
                    {f.descricao_ia.split('\n').map((p, i) => p.trim() && (
                      <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: '#28374A' }}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Serviços */}
                {f.servicos?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#6B6751' }}>SERVIÇOS</p>
                    <div className="flex flex-wrap gap-2">
                      {f.servicos.map(s => (
                        <span key={s} className="text-sm px-3 py-1 rounded-full"
                          style={{ background: '#f5f2ec', color: '#28374A' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cidades atendidas */}
                {f.cidades_atendidas?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#6B6751' }}>ATENDE EM</p>
                    <p className="text-sm" style={{ color: '#28374A' }}>
                      {f.cidades_atendidas.join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Galeria */}
            {galeria.length > 0 && (
              <div className="rounded-2xl overflow-hidden bg-white p-4">
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#28374A' }}>Galeria</h2>
                <div className="rounded-xl overflow-hidden mb-3 h-52">
                  <img src={galeria[fotoAtiva]} alt={`Foto ${fotoAtiva + 1}`}
                    className="w-full h-full object-cover" />
                </div>
                {galeria.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galeria.map((foto, i) => (
                      <button key={i} onClick={() => setFotoAtiva(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                          fotoAtiva === i ? '' : 'opacity-60'
                        }`}
                        style={{ borderColor: fotoAtiva === i ? '#FFBD76' : 'transparent' }}>
                        <img src={foto} alt={`Miniatura ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar de contato */}
          <div className="space-y-4">

            {/* Card de contato */}
            <div className="rounded-2xl p-5 bg-white sticky top-4">
              <h2 className="font-semibold mb-4" style={{ color: '#28374A' }}>Entre em contato</h2>

              <div className="space-y-3">
                {f.whatsapp && (
                  <button
                    onClick={abrirWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-95"
                    style={{ background: '#25D366', color: 'white' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chamar no WhatsApp
                  </button>
                )}

                {f.email && (
                  <button
                    onClick={abrirEmail}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:opacity-80"
                    style={{ borderColor: '#28374A', color: '#28374A' }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar e-mail
                  </button>
                )}

                {f.instagram && (
                  <a
                    href={`https://instagram.com/${f.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border transition-all hover:opacity-80"
                    style={{ borderColor: '#D3C7AD', color: '#6B6751' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{f.instagram}
                  </a>
                )}
              </div>

              {/* Localização */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f0ede6' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#6B6751' }}>LOCALIZAÇÃO</p>
                <p className="text-sm font-medium" style={{ color: '#28374A' }}>
                  {f.cidade} — {f.estado}
                </p>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t flex gap-4" style={{ borderColor: '#f0ede6' }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#28374A' }}>{f.views || 0}</p>
                  <p className="text-xs" style={{ color: '#6B6751' }}>Visualizações</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#28374A' }}>{f.cliques_whatsapp || 0}</p>
                  <p className="text-xs" style={{ color: '#6B6751' }}>Contatos</p>
                </div>
              </div>
            </div>

            {/* CTA Evento360 */}
            <div className="rounded-2xl p-4 text-center" style={{ background: '#28374A' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#FFBD76' }}>Para fornecedores</p>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Gerencie seus eventos, contratos e financeiro em um só lugar.
              </p>
              <a href="https://evento360.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-2 rounded-xl text-xs font-bold transition-colors hover:opacity-90"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Conhecer o Evento360
              </a>
            </div>

          </div>
        </div>

        {/* Outros fornecedores do mesmo segmento */}
        <OutrosFornecedores segmento={f.segmento} cidade={f.cidade} slugAtual={f.slug} />

      </div>
    </div>
  )
}

function OutrosFornecedores({ segmento, cidade, slugAtual }) {
  const [outros, setOutros] = useState([])

  useEffect(() => {
    supabase
      .from('eventhub_profiles')
      .select('id, slug, nome, segmento, cidade, estado, foto_perfil, verificado')
      .eq('status', 'active')
      .eq('segmento', segmento)
      .neq('slug', slugAtual)
      .limit(3)
      .then(({ data }) => setOutros(data || []))
  }, [segmento, slugAtual])

  if (outros.length === 0) return null

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold mb-4" style={{ color: '#28374A' }}>
        Outros {segmento.toLowerCase()}s
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {outros.map(f => (
          <a key={f.id} href={`/f/${f.slug}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white hover:shadow-sm transition-all">
            {f.foto_perfil
              ? <img src={f.foto_perfil} alt={f.nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: '#28374A', color: '#FFBD76' }}>
                  {f.nome.charAt(0)}
                </div>
            }
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#28374A' }}>{f.nome}</p>
              <p className="text-xs" style={{ color: '#6B6751' }}>{f.cidade}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
