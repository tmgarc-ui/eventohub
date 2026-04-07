import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Painel() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [fornecedor, setFornecedor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [aba, setAba] = useState('perfil')
  const [form, setForm] = useState({})

  useEffect(() => {
    if (!token) { navigate('/cadastrar'); return }
    carregarPerfil()
  }, [token])

  const carregarPerfil = async () => {
    const { data, error } = await supabase
      .from('eventhub_profiles')
      .select('*')
      .eq('token_edicao', token)
      .single()

    if (error || !data) {
      navigate('/cadastrar')
      return
    }

    // Verifica se token expirou
    if (data.token_expira_em && new Date(data.token_expira_em) < new Date()) {
      navigate('/token-expirado')
      return
    }

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
    })
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

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <div className="flex items-center gap-3">
            <a href={`/f/${f.slug}`} target="_blank" rel="noopener noreferrer"
              className="text-sm text-white/70 hover:text-white transition-colors">
              Ver meu perfil →
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Boas-vindas */}
        <div className="mb-6 flex items-center gap-4">
          {f.foto_perfil
            ? <img src={f.foto_perfil} alt={f.nome} className="w-14 h-14 rounded-full object-cover border-3"
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
          <MetricCard label="Visualizações" value={f.views || 0} icon="👁️" />
          <MetricCard label="Cliques WhatsApp" value={f.cliques_whatsapp || 0} icon="💬" />
          <MetricCard label="Cliques e-mail" value={f.cliques_email || 0} icon="📧" />
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl bg-white/50" style={{ width: 'fit-content' }}>
          {[
            { id: 'perfil', label: 'Editar perfil' },
            { id: 'upgrade', label: 'Meu plano' },
            { id: 'evento360', label: '🚀 Evento360' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: aba === tab.id ? 'white' : 'transparent',
                color: aba === tab.id ? '#28374A' : '#6B6751',
                boxShadow: aba === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ABA: Editar perfil */}
        {aba === 'perfil' && (
          <div className="rounded-2xl bg-white p-6 space-y-4">
            <h2 className="font-semibold" style={{ color: '#28374A' }}>Informações do perfil</h2>

            {mensagem && (
              <div className={`p-3 rounded-xl text-sm ${
                mensagem.includes('Erro') ? 'bg-red-50 text-red-700' : 'text-green-700'
              }`} style={mensagem.includes('Erro') ? {} : { background: '#E8F5E9' }}>
                {mensagem}
              </div>
            )}

            <Field label="Nome do negócio *">
              <input type="text" value={form.nome} onChange={e => set('nome', e.target.value)} />
            </Field>

            <Field label="Descrição" hint="Edite ou personalize o texto gerado pela IA">
              <textarea
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                rows={5}
                style={{ resize: 'vertical' }}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="WhatsApp">
                <input type="tel" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+55 11 99999-9999" />
              </Field>
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="contato@seunegocio.com.br" />
              </Field>
              <Field label="Instagram">
                <input type="text" value={form.instagram} onChange={e => set('instagram', e.target.value)}
                  placeholder="seuperfil (sem @)" />
              </Field>
              <Field label="Site">
                <input type="url" value={form.site} onChange={e => set('site', e.target.value)}
                  placeholder="https://seunegocio.com.br" />
              </Field>
            </div>

            <Field label="Serviços" hint="Separados por vírgula">
              <input type="text" value={form.servicos} onChange={e => set('servicos', e.target.value)}
                placeholder="Casamentos, Aniversários, Formaturas..." />
            </Field>

            <Field label="Cidades atendidas" hint="Separadas por vírgula">
              <input type="text" value={form.cidades_atendidas} onChange={e => set('cidades_atendidas', e.target.value)}
                placeholder="São Paulo, Guarulhos, ABC..." />
            </Field>

            <button
              onClick={salvar}
              disabled={salvando}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{ background: salvando ? '#D3C7AD' : '#FFBD76', color: '#28374A' }}
            >
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        )}

        {/* ABA: Upgrade */}
        {aba === 'upgrade' && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white p-5">
              <p className="text-sm font-semibold mb-1" style={{ color: '#6B6751' }}>PLANO ATUAL</p>
              <p className="text-xl font-bold capitalize mb-4" style={{ color: '#28374A' }}>
                {f.plano} {f.plano === 'free' ? '(Gratuito)' : ''}
              </p>
              {f.plano === 'free' && (
                <p className="text-sm mb-4" style={{ color: '#6B6751' }}>
                  Faça upgrade para aparecer acima dos outros fornecedores e ter mais visibilidade.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PlanoCard
                nome="Basic"
                preco="R$ 49/mês"
                atual={f.plano === 'basic'}
                beneficios={[
                  'Badge verificado',
                  'Galeria de 10 fotos',
                  'Aparece acima dos Free',
                  'Métricas detalhadas',
                ]}
              />
              <PlanoCard
                nome="Pro"
                preco="R$ 99/mês"
                atual={f.plano === 'pro'}
                destaque
                beneficios={[
                  'Tudo do Basic',
                  'Destaque no topo da lista',
                  'Galeria ilimitada',
                  'Link para site próprio',
                  'Vídeo de apresentação',
                ]}
              />
            </div>

            <p className="text-xs text-center" style={{ color: '#6B6751' }}>
              Pagamentos em breve via Pix e cartão de crédito.
            </p>
          </div>
        )}

        {/* ABA: Evento360 */}
        {aba === 'evento360' && (
          <div className="rounded-2xl overflow-hidden">
            <div className="p-6 text-center" style={{ background: '#28374A' }}>
              <div className="text-3xl mb-3">🚀</div>
              <h2 className="text-xl font-bold text-white mb-2">
                Leve seu negócio para o próximo nível
              </h2>
              <p className="text-sm text-white/70 mb-6 max-w-sm mx-auto">
                Você já aparece no EventoHub. Agora gerencie seus eventos, contratos, financeiro e clientes com o Evento360.
              </p>
              <a href="https://evento360.vercel.app"
                target="_blank" rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-full font-bold text-sm mb-3"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                Experimentar grátis por 14 dias
              </a>
              <p className="text-xs text-white/40">Sem cartão de crédito</p>
            </div>

            <div className="bg-white p-6">
              <p className="text-sm font-semibold mb-4" style={{ color: '#28374A' }}>
                O que você ganha com o Evento360:
              </p>
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

function MetricCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl p-4 text-center bg-white">
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-2xl font-bold" style={{ color: '#28374A' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#6B6751' }}>{label}</p>
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
      <div className="[&>input]:w-full [&>input]:px-3 [&>input]:py-2.5 [&>input]:rounded-lg [&>input]:border [&>input]:text-sm [&>input]:outline-none
                      [&>textarea]:w-full [&>textarea]:px-3 [&>textarea]:py-2.5 [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:text-sm [&>textarea]:outline-none"
        style={{ '--border': '#D3C7AD' }}>
        <style>{`
          input, textarea { border-color: #D3C7AD !important; color: #28374A; }
          input:focus, textarea:focus { outline: 2px solid #FFBD76; outline-offset: 0; }
        `}</style>
        {children}
      </div>
    </div>
  )
}

function PlanoCard({ nome, preco, beneficios, atual, destaque }) {
  return (
    <div className={`rounded-2xl p-5 ${destaque ? 'border-2' : 'border'}`}
      style={{
        background: 'white',
        borderColor: destaque ? '#FFBD76' : '#D3C7AD'
      }}>
      {destaque && (
        <span className="text-xs font-semibold px-2 py-1 rounded-full mb-3 inline-block"
          style={{ background: '#FFF3DC', color: '#8B5E00' }}>Mais popular</span>
      )}
      <p className="text-lg font-bold mb-0.5" style={{ color: '#28374A' }}>{nome}</p>
      <p className="text-base font-semibold mb-4" style={{ color: '#754437' }}>{preco}</p>
      <ul className="space-y-2 mb-4">
        {beneficios.map(b => (
          <li key={b} className="flex items-start gap-2 text-sm" style={{ color: '#28374A' }}>
            <span style={{ color: '#6B6751' }}>✓</span> {b}
          </li>
        ))}
      </ul>
      {atual ? (
        <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center"
          style={{ background: '#f5f2ec', color: '#6B6751' }}>
          Plano atual
        </div>
      ) : (
        <button className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: '#FFBD76', color: '#28374A' }}
          onClick={() => alert('Pagamentos em breve! Entraremos em contato.')}>
          Assinar {nome}
        </button>
      )}
    </div>
  )
}
