import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Perfil() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [fornecedor, setFornecedor] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const [showFormAvaliacao, setShowFormAvaliacao] = useState(false)
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false)
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false)
  const [formAval, setFormAval] = useState({
    autor_nome: '', autor_email: '', servico_contratado: '', nota: 5, comentario: ''
  })

  useEffect(() => { carregarPerfil() }, [slug])

  const carregarPerfil = async () => {
    const { data, error } = await supabase
      .from('eventhub_profiles')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error || !data) { navigate('/fornecedores'); return }
    setFornecedor(data)

    if (data.aceita_avaliacoes) {
      const { data: avals } = await supabase
        .from('eventhub_avaliacoes')
        .select('id, autor_nome, servico_contratado, nota, comentario, created_at')
        .eq('profile_id', data.id)
        .eq('aprovado', true)
        .order('created_at', { ascending: false })
      setAvaliacoes(avals || [])
    }

    setLoading(false)
    registrarEvento(data.id, 'view')
  }

  const registrarEvento = async (profileId, tipo) => {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, tipo, origem: document.referrer })
    }).catch(() => {})
  }

  const abrirWhatsApp = () => {
    if (!fornecedor?.whatsapp) return
    registrarEvento(fornecedor.id, 'whatsapp')
    const numero = fornecedor.whatsapp.replace(/\D/g, '')
    const msg = encodeURIComponent('Olá ' + fornecedor.nome + '! Encontrei seu perfil no EventoHub e gostaria de saber mais sobre seus serviços.')
    window.open('https://wa.me/' + numero + '?text=' + msg, '_blank')
  }

  const abrirEmail = () => {
    if (!fornecedor?.email) return
    registrarEvento(fornecedor.id, 'email')
    window.location.href = 'mailto:' + fornecedor.email + '?subject=Interesse nos seus serviços'
  }

  const enviarAvaliacao = async () => {
    if (!formAval.autor_nome || !formAval.autor_email ) return
    setEnviandoAvaliacao(true)
    const { error } = await supabase
      .from('eventhub_avaliacoes')
      .insert({
        profile_id: fornecedor.id,
        autor_nome: formAval.autor_nome,
        autor_email: formAval.autor_email,
        servico_contratado: formAval.servico_contratado,
        nota: formAval.nota,
        comentario: formAval.comentario,
        aprovado: true
      })
    setEnviandoAvaliacao(false)
    if (!error) {
      setAvaliacaoEnviada(true)
      setShowFormAvaliacao(false)
      carregarPerfil()
    }
  }

  const setAval = (field, value) => setFormAval(f => ({ ...f, [field]: value }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#D3C7AD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#28374A', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const f = fornecedor
  const galeria = (f.galeria || []).filter(Boolean)
  const mediaNotas = avaliacoes.length
    ? (avaliacoes.reduce((acc, a) => acc + a.nota, 0) / avaliacoes.length).toFixed(1)
    : null

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>
      <header style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href={'/fornecedores?segmento=' + encodeURIComponent(f.segmento)}
            className="text-sm text-white/70 hover:text-white transition-colors">
            ← {f.segmento}s
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 space-y-4">

            {/* Card principal — sem capa separada */}
            <div className="rounded-2xl overflow-hidden bg-white">

              {/* Capa — só exibe se tiver foto */}
              {f.foto_capa && (
                <div style={{ height: '160px' }}>
                  <img src={f.foto_capa} alt={f.nome} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="px-5 py-5">
                {/* Avatar + nome em linha */}
                <div className="flex items-center gap-4 mb-4">
                  {f.foto_perfil
                    ? <img src={f.foto_perfil} alt={f.nome}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2"
                        style={{ borderColor: '#FFBD76' }} />
                    : <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                        style={{ background: '#28374A', color: '#FFBD76' }}>
                        {f.nome.charAt(0)}
                      </div>
                  }
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl font-bold" style={{ color: '#28374A' }}>{f.nome}</h1>
                      {f.verificado && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#28374A', color: '#FFBD76' }}>✓ Verificado</span>
                      )}
                      {f.destaque && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#FFBD76', color: '#28374A' }}>⭐ Destaque</span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: '#6B6751' }}>
                      {f.segmento} · {f.cidade}/{f.estado}
                    </p>
                    {mediaNotas && (
                      <div className="flex items-center gap-1 mt-1">
                        <span style={{ color: '#FFBD76' }}>{'★'.repeat(Math.round(Number(mediaNotas)))}</span>
                        <span className="text-xs font-medium" style={{ color: '#28374A' }}>{mediaNotas}</span>
                        <span className="text-xs" style={{ color: '#6B6751' }}>({avaliacoes.length} avaliações)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {(f.descricao || f.descricao_ia) && (
                  <div className="mb-4">
                    {(f.descricao || f.descricao_ia).split('\n').map((p, i) => p.trim() && (
                      <p key={i} className="text-sm leading-relaxed mb-2" style={{ color: '#28374A' }}>{p}</p>
                    ))}
                  </div>
                )}

                {/* Serviços */}
                {f.servicos?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#6B6751' }}>SERVIÇOS</p>
                    <div className="flex flex-wrap gap-2">
                      {f.servicos.map(s => (
                        <span key={s} className="text-sm px-3 py-1 rounded-full"
                          style={{ background: '#f5f2ec', color: '#28374A' }}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cidades atendidas */}
                {f.cidades_atendidas?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold mb-1" style={{ color: '#6B6751' }}>ATENDE EM</p>
                    <p className="text-sm" style={{ color: '#28374A' }}>{f.cidades_atendidas.join(' · ')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Galeria — só se tiver fotos */}
            {galeria.length > 0 && (
              <div className="rounded-2xl overflow-hidden bg-white p-4">
                <h2 className="text-sm font-semibold mb-3" style={{ color: '#28374A' }}>Galeria</h2>
                <div className="rounded-xl overflow-hidden mb-3" style={{ height: '200px' }}>
                  <img src={galeria[fotoAtiva]} alt={'Foto ' + (fotoAtiva + 1)} className="w-full h-full object-cover" />
                </div>
                {galeria.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {galeria.map((foto, i) => (
                      <button key={i} onClick={() => setFotoAtiva(i)}
                        className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                        style={{ borderColor: fotoAtiva === i ? '#FFBD76' : 'transparent', opacity: fotoAtiva === i ? 1 : 0.6 }}>
                        <img src={foto} alt={'Miniatura ' + (i + 1)} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Avaliações */}
            {f.aceita_avaliacoes && (
              <div className="rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold" style={{ color: '#28374A' }}>
                    Avaliações
                    {avaliacoes.length > 0 && (
                      <span className="font-normal text-sm ml-1" style={{ color: '#6B6751' }}>({avaliacoes.length})</span>
                    )}
                  </h2>
                  {!avaliacaoEnviada && !showFormAvaliacao && (
                    <button onClick={() => setShowFormAvaliacao(true)}
                      className="text-sm font-medium px-4 py-2 rounded-full border transition-colors"
                      style={{ borderColor: '#28374A', color: '#28374A' }}>
                      + Avaliar
                    </button>
                  )}
                </div>

                {avaliacaoEnviada && (
                  <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                    ✓ Avaliação enviada! Obrigado pelo feedback.
                  </div>
                )}

                {showFormAvaliacao && (
                  <div className="rounded-xl p-4 mb-4 space-y-3" style={{ background: '#f5f2ec' }}>
                    <h3 className="font-medium text-sm" style={{ color: '#28374A' }}>Sua avaliação</h3>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Nota *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button key={n} onClick={() => setAval('nota', n)}
                            className="text-2xl transition-transform hover:scale-110"
                            style={{ color: n <= formAval.nota ? '#FFBD76' : '#D3C7AD' }}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Seu nome *</label>
                      <input type="text" placeholder="Como você se chama" value={formAval.autor_nome}
                        onChange={e => setAval('autor_nome', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white"
                        style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>
                        Seu e-mail * <span className="font-normal">(não será exibido publicamente)</span>
                      </label>
                      <input type="email" placeholder="seu@email.com" value={formAval.autor_email}
                        onChange={e => setAval('autor_email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white"
                        style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Comentário</label>
                      <textarea placeholder="Conte como foi sua experiência..." value={formAval.comentario}
                        onChange={e => setAval('comentario', e.target.value)} rows={3}
                        className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white"
                        style={{ borderColor: '#D3C7AD', color: '#28374A', resize: 'vertical' }} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowFormAvaliacao(false)}
                        className="flex-1 py-2 rounded-xl border text-sm"
                        style={{ borderColor: '#D3C7AD', color: '#6B6751' }}>Cancelar</button>
                      <button onClick={enviarAvaliacao}
                        disabled={enviandoAvaliacao || !formAval.autor_nome || !formAval.autor_email}
                        className="flex-1 py-2 rounded-xl text-sm font-bold disabled:opacity-40"
                        style={{ background: '#FFBD76', color: '#28374A' }}>
                        {enviandoAvaliacao ? 'Enviando...' : 'Enviar avaliação'}
                      </button>
                    </div>
                  </div>
                )}

                {avaliacoes.length === 0 && !showFormAvaliacao && (
                  <p className="text-sm text-center py-4" style={{ color: '#6B6751' }}>
                    Ainda sem avaliações. Seja o primeiro!
                  </p>
                )}

                <div className="space-y-3">
                  {avaliacoes.map(a => (
                    <div key={a.id} className="p-3 rounded-xl" style={{ background: '#f5f2ec' }}>
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#28374A' }}>{a.autor_nome}</span>
                          <span className="text-xs ml-2" style={{ color: '#6B6751' }}>{a.servico_contratado}</span>
                        </div>
                        <span style={{ color: '#FFBD76' }}>{'★'.repeat(a.nota)}</span>
                      </div>
                      {a.comentario && <p className="text-sm" style={{ color: '#28374A' }}>{a.comentario}</p>}
                      <p className="text-xs mt-1" style={{ color: '#6B6751', opacity: 0.6 }}>
                        {new Date(a.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Sidebar contato */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5 bg-white sticky top-4">
              <h2 className="font-semibold mb-4" style={{ color: '#28374A' }}>Entre em contato</h2>
              <div className="space-y-3">
                {f.whatsapp && (
                  <button onClick={abrirWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                    style={{ background: '#25D366', color: 'white' }}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Chamar no WhatsApp
                  </button>
                )}
                {f.email && (
                  <button onClick={abrirEmail}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2"
                    style={{ borderColor: '#28374A', color: '#28374A' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Enviar e-mail
                  </button>
                )}
                {f.instagram && (
                  <a href={'https://instagram.com/' + f.instagram} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border"
                    style={{ borderColor: '#D3C7AD', color: '#6B6751' }}>
                    @{f.instagram}
                  </a>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex gap-4" style={{ borderColor: '#f0ede6' }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#28374A' }}>{f.views || 0}</p>
                  <p className="text-xs" style={{ color: '#6B6751' }}>Visualizações</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: '#28374A' }}>{f.cliques_whatsapp || 0}</p>
                  <p className="text-xs" style={{ color: '#6B6751' }}>Contatos</p>
                </div>
                {mediaNotas && (
                  <div className="text-center">
                    <p className="text-lg font-bold" style={{ color: '#28374A' }}>{mediaNotas}</p>
                    <p className="text-xs" style={{ color: '#6B6751' }}>Avaliação</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl p-4 text-center" style={{ background: '#28374A' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#FFBD76' }}>Para fornecedores</p>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Gerencie seus eventos, contratos e financeiro em um só lugar.
              </p>
              <a href="https://evento360.vercel.app" target="_blank" rel="noopener noreferrer"
                className="block py-2 rounded-xl text-xs font-bold"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Experimentar Evento360 grátis por 7 dias
              </a>
            </div>
          </div>
        </div>

        <OutrosFornecedores segmento={f.segmento} slugAtual={f.slug} />
      </div>
    </div>
  )
}

function OutrosFornecedores({ segmento, slugAtual }) {
  const [outros, setOutros] = useState([])
  useEffect(() => {
    supabase.from('eventhub_profiles')
      .select('id, slug, nome, segmento, cidade, estado, foto_perfil, verificado')
      .eq('status', 'active').eq('segmento', segmento).neq('slug', slugAtual).limit(3)
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
          <a key={f.id} href={'/f/' + f.slug}
            className="flex items-center gap-3 p-3 rounded-xl bg-white hover:shadow-sm transition-all">
            {f.foto_perfil
              ? <img src={f.foto_perfil} alt={f.nome} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                  style={{ background: '#28374A', color: '#FFBD76' }}>{f.nome.charAt(0)}</div>
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
