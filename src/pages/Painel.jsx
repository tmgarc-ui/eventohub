import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Painel() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [fornecedor, setFornecedor] = useState(null)
  const [avaliacoes, setAvaliacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [aba, setAba] = useState('perfil')
  const [showPopup, setShowPopup] = useState(false)
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!token) { navigate('/cadastrar'); return }
    carregarPerfil()
  }, [token])

  // Popup Evento360 — exibe 1x por token
  useEffect(() => {
    if (!fornecedor) return
    const chave = 'popup_evento360_' + token
    if (!localStorage.getItem(chave)) {
      setTimeout(() => setShowPopup(true), 30000)
      localStorage.setItem(chave, '1')
    }
  }, [fornecedor])

  const carregarPerfil = async () => {
    const { data, error } = await supabase
      .from('eventhub_profiles')
      .select('*')
      .eq('token_edicao', token)
      .single()

    if (error || !data) { navigate('/cadastrar'); return }

    setFornecedor(data)
    setForm({
      nome: data.nome || '',
      descricao: data.descricao || data.descricao_ia || '',
      whatsapp: data.whatsapp || '',
      email: data.email || '',
      instagram: data.instagram || '',
      site: data.site || '',
      servicos: (data.servicos || []).join(', '),
      cidades_atendidas: (data.cidades_atendidas || []).join(', '),
      aceita_avaliacoes: data.aceita_avaliacoes !== false,
    })

    // Busca avaliações (todas, incluindo pendentes — para o fornecedor gerenciar)
    const { data: avals } = await supabase
      .from('eventhub_avaliacoes')
      .select('*')
      .eq('profile_id', data.id)
      .order('created_at', { ascending: false })
    setAvaliacoes(avals || [])

    setLoading(false)
  }

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const salvar = async () => {
    setSalvando(true)
    setMensagem('')
    const { error } = await supabase
      .from('eventhub_profiles')
      .update({
        nome: form.nome,
        descricao: form.descricao,
        whatsapp: form.whatsapp,
        email: form.email,
        instagram: form.instagram,
        site: form.site,
        servicos: form.servicos.split(',').map(s => s.trim()).filter(Boolean),
        cidades_atendidas: form.cidades_atendidas.split(',').map(s => s.trim()).filter(Boolean),
        aceita_avaliacoes: form.aceita_avaliacoes,
      })
      .eq('token_edicao', token)

    setSalvando(false)
    if (error) {
      setMensagem('Erro ao salvar. Tente novamente.')
    } else {
      setMensagem('Perfil atualizado com sucesso!')
      carregarPerfil()
      setTimeout(() => setMensagem(''), 3000)
    }
  }

  const excluirAvaliacao = async (id) => {
    if (!confirm('Excluir esta avaliação?')) return
    await supabase.from('eventhub_avaliacoes').delete().eq('id', id)
    setAvaliacoes(prev => prev.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#D3C7AD' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#28374A', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const f = fornecedor

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>

      {/* Popup Evento360 */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl overflow-hidden max-w-sm w-full" style={{ background: '#28374A' }}>
            <div className="p-6 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Seu perfil está no ar!
              </h2>
              <p className="text-sm text-white/70 mb-1">
                Agora dê o próximo passo:
              </p>
              <p className="text-sm text-white/90 mb-5 font-medium">
                Gerencie seus eventos, contratos e financeiro com o Evento360.
              </p>
              <a href="https://evento360.vercel.app" target="_blank" rel="noopener noreferrer"
                className="block py-3 rounded-xl font-bold text-sm mb-3"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Experimentar grátis por 7 dias →
              </a>
              <button onClick={() => setShowPopup(false)}
                className="text-sm text-white/50 hover:text-white/80 transition-colors">
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href={'/f/' + f.slug} target="_blank" rel="noopener noreferrer"
            className="text-sm text-white/70 hover:text-white transition-colors">
            Ver meu perfil →
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Boas-vindas */}
        <div className="mb-6 flex items-center gap-4">
          {f.foto_perfil
            ? <img src={f.foto_perfil} alt={f.nome} className="w-14 h-14 rounded-full object-cover border-2"
                style={{ borderColor: '#FFBD76' }} />
            : <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: '#28374A', color: '#FFBD76' }}>
                {f.nome.charAt(0)}
              </div>
          }
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#28374A' }}>Olá, {f.nome.split(' ')[0]}!</h1>
            <p className="text-sm" style={{ color: '#6B6751' }}>
              {f.segmento} · {f.cidade}/{f.estado}
              {f.plano !== 'free' && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Plano {f.plano}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Visualizações', value: f.views || 0, icon: '👁️' },
            { label: 'Cliques WhatsApp', value: f.cliques_whatsapp || 0, icon: '💬' },
            { label: 'Avaliações', value: avaliacoes.length, icon: '⭐' },
          ].map(m => (
            <div key={m.label} className="rounded-2xl p-4 text-center bg-white">
              <div className="text-xl mb-1">{m.icon}</div>
              <p className="text-2xl font-bold" style={{ color: '#28374A' }}>{m.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#6B6751' }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/50" style={{ width: 'fit-content' }}>
          {[
            { id: 'perfil', label: 'Editar perfil' },
            { id: 'avaliacoes', label: 'Avaliações' + (avaliacoes.length > 0 ? ' (' + avaliacoes.length + ')' : '') },
            { id: 'upgrade', label: 'Meu plano' },
            { id: 'evento360', label: '🚀 Evento360' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: aba === tab.id ? 'white' : 'transparent',
                color: aba === tab.id ? '#28374A' : '#6B6751',
                boxShadow: aba === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA: Perfil */}
        {aba === 'perfil' && (
          <div className="rounded-2xl bg-white p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#28374A' }}>Informações do perfil</h2>
            {mensagem && (
              <div className={'p-3 rounded-xl text-sm ' + (mensagem.includes('Erro') ? 'bg-red-50 text-red-700' : 'text-green-700')}
                style={mensagem.includes('Erro') ? {} : { background: '#E8F5E9' }}>
                {mensagem}
              </div>
            )}
            <Field label="Nome do negócio *">
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </Field>
            <Field label="Descrição" hint="Edite o texto gerado pela IA">
              <textarea value={form.descricao} onChange={e => set('descricao', e.target.value)} rows={5} style={{ resize: 'vertical' }} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="WhatsApp">
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="+55 11 99999-9999" />
              </Field>
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contato@seunegocio.com.br" />
              </Field>
              <Field label="Instagram">
                <input type="text" value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="seuperfil (sem @)" />
              </Field>
              <Field label="Site">
                <input type="url" value={form.site} onChange={e => set('site', e.target.value)} placeholder="https://seunegocio.com.br" />
              </Field>
            </div>
            <Field label="Serviços" hint="Separados por vírgula">
              <input type="text" value={form.servicos} onChange={e => set('servicos', e.target.value)} placeholder="Casamentos, Aniversários..." />
            </Field>
            <Field label="Cidades atendidas" hint="Separadas por vírgula">
              <input type="text" value={form.cidades_atendidas} onChange={e => set('cidades_atendidas', e.target.value)} placeholder="São Paulo, Guarulhos..." />
            </Field>

            {/* Toggle avaliações */}
            <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#f5f2ec' }}>
              <div className="w-10 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 mt-0.5 cursor-pointer"
                style={{ background: form.aceita_avaliacoes ? '#28374A' : '#D3C7AD' }}
                onClick={() => set('aceita_avaliacoes', !form.aceita_avaliacoes)}>
                <div className="w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ transform: form.aceita_avaliacoes ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#28374A' }}>Aceitar avaliações de clientes</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B6751' }}>Clientes poderão avaliar seus serviços no seu perfil.</p>
              </div>
            </div>

            <button onClick={salvar} disabled={salvando}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: salvando ? '#D3C7AD' : '#FFBD76', color: '#28374A' }}>
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}

        {/* ABA: Avaliações */}
        {aba === 'avaliacoes' && (
          <div className="rounded-2xl bg-white p-6">
            <h2 className="font-semibold mb-4" style={{ color: '#28374A' }}>Gerenciar avaliações</h2>
            {avaliacoes.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: '#6B6751' }}>
                Ainda sem avaliações. Compartilhe seu perfil para receber!
              </p>
            ) : (
              <div className="space-y-3">
                {avaliacoes.map(a => (
                  <div key={a.id} className="p-4 rounded-xl border" style={{ borderColor: '#f0ede6' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-medium text-sm" style={{ color: '#28374A' }}>{a.autor_nome}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f5f2ec', color: '#6B6751' }}>
                            {a.servico_contratado}
                          </span>
                          <span className="text-sm" style={{ color: '#FFBD76' }}>{'★'.repeat(a.nota)}</span>
                        </div>
                        {/* E-mail visível apenas para o fornecedor */}
                        <p className="text-xs mb-1" style={{ color: '#6B6751' }}>
                          📧 {a.autor_email}
                        </p>
                        {a.comentario && (
                          <p className="text-sm" style={{ color: '#28374A' }}>{a.comentario}</p>
                        )}
                        <p className="text-xs mt-1" style={{ color: '#6B6751', opacity: 0.6 }}>
                          {new Date(a.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <button onClick={() => excluirAvaliacao(a.id)}
                        className="ml-3 text-xs px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors hover:opacity-80"
                        style={{ background: '#FEE2E2', color: '#991B1B' }}>
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: Upgrade */}
        {aba === 'upgrade' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5">
              <p className="text-sm font-semibold mb-1" style={{ color: '#6B6751' }}>PLANO ATUAL</p>
              <p className="text-xl font-bold capitalize mb-2" style={{ color: '#28374A' }}>
                {f.plano} {f.plano === 'free' ? '(Gratuito)' : ''}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { nome: 'Basic', preco: 'R$ 49/mês', destaque: false, beneficios: ['Badge verificado', 'Galeria de 10 fotos', 'Aparece acima dos Free', 'Métricas detalhadas'] },
                { nome: 'Pro', preco: 'R$ 99/mês', destaque: true, beneficios: ['Tudo do Basic', 'Destaque no topo', 'Galeria ilimitada', 'Link para site próprio', 'Vídeo de apresentação'] },
              ].map(plano => (
                <div key={plano.nome} className={'rounded-2xl p-5 ' + (plano.destaque ? 'border-2' : 'border')}
                  style={{ background: 'white', borderColor: plano.destaque ? '#FFBD76' : '#D3C7AD' }}>
                  {plano.destaque && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-full mb-3 inline-block"
                      style={{ background: '#FFF3DC', color: '#8B5E00' }}>Mais popular</span>
                  )}
                  <p className="text-lg font-bold mb-0.5" style={{ color: '#28374A' }}>{plano.nome}</p>
                  <p className="text-base font-semibold mb-4" style={{ color: '#754437' }}>{plano.preco}</p>
                  <ul className="space-y-2 mb-4">
                    {plano.beneficios.map(b => (
                      <li key={b} className="flex items-start gap-2 text-sm" style={{ color: '#28374A' }}>
                        <span style={{ color: '#6B6751' }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                  {f.plano === plano.nome.toLowerCase() ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center"
                      style={{ background: '#f5f2ec', color: '#6B6751' }}>Plano atual</div>
                  ) : (
                    <button className="w-full py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: '#FFBD76', color: '#28374A' }}
                      onClick={() => alert('Em breve! Entraremos em contato.')}>
                      Assinar {plano.nome}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA: Evento360 */}
        {aba === 'evento360' && (
          <div className="rounded-2xl overflow-hidden">
            <div className="p-6 text-center" style={{ background: '#28374A' }}>
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-white mb-2">Leve seu negócio para o próximo nível</h2>
              <p className="text-sm text-white/70 mb-6 max-w-sm mx-auto">
                Você já aparece no EventoHub. Agora gerencie seus eventos, contratos e financeiro com o Evento360.
              </p>
              <a href="https://evento360.vercel.app" target="_blank" rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-full font-bold text-sm mb-3"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Experimentar grátis por 7 dias →
              </a>
              <p className="text-xs text-white/40">Sem cartão de crédito</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: '#28374A' }}>O que você ganha:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: '📋', titulo: 'Gestão de eventos', desc: 'Calendário, checklist e controle de tudo' },
                  { icon: '📄', titulo: 'Contratos digitais', desc: 'Gere e envie contratos em segundos' },
                  { icon: '💰', titulo: 'Financeiro', desc: 'Parcelas, recebimentos e despesas' },
                  { icon: '👥', titulo: 'Clientes e orçamentos', desc: 'CRM completo para prestadores' },
                  { icon: '🤖', titulo: 'IA assistente', desc: 'Consultas e ações por linguagem natural' },
                  { icon: '📊', titulo: 'Relatórios', desc: 'Dashboard com visão do negócio' },
                ].map(item => (
                  <div key={item.titulo} className="flex gap-3 p-3 rounded-xl" style={{ background: '#f5f2ec' }}>
                    <span className="text-xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#28374A' }}>{item.titulo}</p>
                      <p className="text-xs" style={{ color: '#6B6751' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
        {label}
        {hint && <span className="font-normal ml-1 opacity-60 text-xs">{hint}</span>}
      </label>
      <style>{`
        input, textarea { border-color: #D3C7AD !important; color: #28374A; width: 100%; padding: 10px 12px; border-radius: 8px; border-width: 1px; border-style: solid; font-size: 14px; outline: none; }
        input:focus, textarea:focus { border-color: #FFBD76 !important; }
      `}</style>
      {children}
    </div>
  )
}
