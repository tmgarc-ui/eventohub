import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'DJ', 'Buffet e catering', 'Fotografia', 'Filmagem', 'Decoracao',
  'Espaco para eventos', 'Banda / Musica ao vivo', 'Cerimonial',
  'Assessoria', 'Bolo e doces', 'Iluminacao, som e telao',
  'Mao de obra para eventos', 'Locacao de equipamentos',
  'Locacao de materiais', 'Locacao de brinquedos',
  'Lembrancas e brindes', 'Seguranca', 'Transporte', 'Floricultura', 'Outros'
]

const STEPS = ['Identificacao', 'Negocio', 'Contato', 'Confirmar']

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO'
]

function formatarDocumento(valor) {
  const nums = valor.replace(/\D/g, '').slice(0, 14)
  if (nums.length <= 11) {
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return nums
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function validarDocumento(doc) {
  const nums = doc.replace(/\D/g, '')
  return nums.length === 11 || nums.length === 14
}

export default function Cadastrar() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)
  const [error, setError] = useState('')
  const [modoLogin, setModoLogin] = useState(false)
  const [cidadeSugestoes, setCidadeSugestoes] = useState([])
  const [buscandoCidade, setBuscandoCidade] = useState(false)
  const cidadeTimer = useRef(null)
  const [loginDoc, setLoginDoc] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  const [form, setForm] = useState({
    documento: '',
    senha: '',
    senha_confirma: '',
    nome: '',
    segmento: '',
    cidade: '',
    estado: '',
    servicos: '',
    whatsapp: '',
    email: '',
    instagram: '',
    aceita_avaliacoes: true,
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  // Busca cidade via IBGE com estado manual como fallback
  const buscarCidade = async (texto) => {
    if (texto.length < 3) { setCidadeSugestoes([]); return }
    setBuscandoCidade(true)
    try {
      // Busca todos os municipios e filtra por nome
      const res = await fetch(
        'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'
      )
      const data = await res.json()
      const filtradas = data
        .filter(m => m.nome.toLowerCase().startsWith(texto.toLowerCase()))
        .slice(0, 8)
        .map(m => {
          // Navega pela estrutura de forma segura
          let uf = ''
          try {
            uf = m.microrregiao.mesorregiao.UF.sigla
          } catch {
            try {
              uf = m.microrregiao.mesorregiao.UF.sigla
            } catch {
              uf = ''
            }
          }
          return { id: m.id, nome: m.nome, estado: uf }
        })
        .filter(m => m.estado)
      setCidadeSugestoes(filtradas)
    } catch (e) {
      setCidadeSugestoes([])
    }
    setBuscandoCidade(false)
  }

  const onCidadeChange = (valor) => {
    set('cidade', valor)
    set('estado', '')
    setCidadeSugestoes([])
    clearTimeout(cidadeTimer.current)
    cidadeTimer.current = setTimeout(() => buscarCidade(valor), 500)
  }

  const selecionarCidade = (cidade) => {
    set('cidade', cidade.nome)
    set('estado', cidade.estado)
    setCidadeSugestoes([])
  }

  const canNext = () => {
    if (step === 0) return validarDocumento(form.documento) && form.senha.length >= 6 && form.senha === form.senha_confirma
    if (step === 1) return form.nome && form.segmento && form.cidade && form.estado
    if (step === 2) return form.whatsapp || form.email
    return true
  }

  const handleLogin = async () => {
    setLoadingLogin(true)
    setError('')
    const doc = loginDoc.replace(/\D/g, '')
    const { data, error } = await supabase
      .from('eventhub_profiles')
      .select('slug, token_edicao, senha_hash')
      .eq('documento', doc)
      .single()
    if (error || !data) { setError('Documento nao encontrado.'); setLoadingLogin(false); return }
    if (data.senha_hash !== btoa(loginSenha)) { setError('Senha incorreta.'); setLoadingLogin(false); return }
    navigate('/painel?token=' + data.token_edicao)
  }

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          documento: form.documento.replace(/\D/g, ''),
          servicos: form.servicos.split(',').map(s => s.trim()).filter(Boolean)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      navigate('/painel?token=' + data.token)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: '#28374A' }}>
        <a href="/" className="text-xl font-bold text-white">
          Evento<span style={{ color: '#FFBD76' }}>Hub</span>
        </a>
        <button onClick={() => { setModoLogin(!modoLogin); setError('') }}
          className="text-sm font-medium" style={{ color: '#FFBD76' }}>
          {modoLogin ? 'Criar cadastro' : 'Ja tenho cadastro'}
        </button>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10">

        {modoLogin ? (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#28374A' }}>Acessar meu painel</h1>
              <p className="text-sm" style={{ color: '#6B6751' }}>Entre com seu CPF/CNPJ e senha</p>
            </div>
            <div className="rounded-2xl bg-white p-6 space-y-4">
              {error && <div className="p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>CPF ou CNPJ</label>
                <input type="text" placeholder="000.000.000-00"
                  value={formatarDocumento(loginDoc)} onChange={e => setLoginDoc(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Senha</label>
                <input type="password" placeholder="Sua senha" value={loginSenha}
                  onChange={e => setLoginSenha(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
              </div>
              <button onClick={handleLogin} disabled={loadingLogin}
                className="w-full py-3 rounded-xl font-bold text-sm"
                style={{ background: '#FFBD76', color: '#28374A' }}>
                {loadingLogin ? 'Entrando...' : 'Entrar no painel'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#28374A' }}>Cadastre seu negocio gratis</h1>
              <p className="text-sm" style={{ color: '#6B6751' }}>Apareca no Google e seja encontrado por clientes na sua cidade.</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: i <= step ? '#754437' : '#28374A', color: i <= step ? 'white' : 'rgba(255,255,255,0.4)' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={'text-xs hidden sm:block ' + (i === step ? 'font-medium' : 'opacity-50')}
                    style={{ color: '#28374A' }}>{s}</span>
                  {i < STEPS.length - 1 && <div className="w-6 h-px mx-1" style={{ background: '#28374A', opacity: 0.3 }} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white p-6">
              {error && <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Identificacao</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>CPF ou CNPJ *</label>
                    <input type="text" placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={form.documento} onChange={e => set('documento', formatarDocumento(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                    <p className="text-xs mt-1" style={{ color: '#6B6751' }}>Nao sera exibido publicamente. Usado para evitar duplicatas.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Senha *</label>
                    <input type="password" placeholder="Minimo 6 caracteres" value={form.senha}
                      onChange={e => set('senha', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Confirmar senha *</label>
                    <input type="password" placeholder="Repita a senha" value={form.senha_confirma}
                      onChange={e => set('senha_confirma', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: (form.senha_confirma && form.senha !== form.senha_confirma) ? '#e53e3e' : '#D3C7AD', color: '#28374A' }} />
                    {form.senha_confirma && form.senha !== form.senha_confirma && (
                      <p className="text-xs mt-1 text-red-600">As senhas nao conferem</p>
                    )}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Sobre o seu negocio</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Nome do negocio *</label>
                    <input type="text" placeholder="Ex: DJ Fulano, Buffet Estrela..." value={form.nome}
                      onChange={e => set('nome', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Segmento *</label>
                    <select value={form.segmento} onChange={e => set('segmento', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: form.segmento ? '#28374A' : '#6B6751' }}>
                      <option value="">Selecione seu segmento</option>
                      {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Cidade *</label>
                    <div className="relative">
                      <input type="text" placeholder="Digite o nome da cidade..." value={form.cidade}
                        onChange={e => onCidadeChange(e.target.value)} autoComplete="off"
                        className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                        style={{ borderColor: (form.cidade && !form.estado) ? '#FFBD76' : '#D3C7AD', color: '#28374A' }} />
                      {buscandoCidade && (
                        <div className="absolute right-3 top-3">
                          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                            style={{ borderColor: '#28374A', borderTopColor: 'transparent' }} />
                        </div>
                      )}
                      {cidadeSugestoes.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 rounded-lg bg-white border shadow-lg overflow-hidden"
                          style={{ borderColor: '#D3C7AD' }}>
                          {cidadeSugestoes.map(c => (
                            <button key={c.id} onClick={() => selecionarCidade(c)}
                              className="w-full text-left px-3 py-2.5 text-sm hover:bg-amber-50 flex justify-between"
                              style={{ color: '#28374A' }}>
                              <span>{c.nome}</span>
                              <span className="font-medium" style={{ color: '#6B6751' }}>{c.estado}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {form.estado && <p className="text-xs mt-1 font-medium" style={{ color: '#6B6751' }}>Cidade selecionada: {form.cidade} - {form.estado}</p>}
                    {form.cidade && !form.estado && <p className="text-xs mt-1" style={{ color: '#754437' }}>Selecione uma cidade da lista</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                      Estado *
                      <span className="font-normal opacity-60 ml-1">(preenchido automaticamente ou selecione)</span>
                    </label>
                    <select value={form.estado} onChange={e => set('estado', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: form.estado ? '#28374A' : '#6B6751' }}>
                      <option value="">Selecione o estado</option>
                      {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                      Servicos <span className="font-normal opacity-60">(separados por virgula)</span>
                    </label>
                    <input type="text" placeholder="Ex: Casamentos, Aniversarios, Formaturas" value={form.servicos}
                      onChange={e => set('servicos', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: '#f5f2ec' }}>
                    <div className="w-10 h-6 rounded-full transition-colors flex items-center px-1 flex-shrink-0 mt-0.5 cursor-pointer"
                      style={{ background: form.aceita_avaliacoes ? '#28374A' : '#D3C7AD' }}
                      onClick={() => set('aceita_avaliacoes', !form.aceita_avaliacoes)}>
                      <div className="w-4 h-4 bg-white rounded-full shadow transition-transform"
                        style={{ transform: form.aceita_avaliacoes ? 'translateX(16px)' : 'translateX(0)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#28374A' }}>Aceitar avaliacoes de clientes</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B6751' }}>Clientes poderao deixar notas e comentarios no seu perfil.</p>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Como os clientes entram em contato?</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>WhatsApp</label>
                    <input type="tel" placeholder="+55 11 99999-9999" value={form.whatsapp}
                      onChange={e => set('whatsapp', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>E-mail</label>
                    <input type="email" placeholder="contato@seunegocio.com.br" value={form.email}
                      onChange={e => set('email', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                      Instagram <span className="font-normal opacity-60">(opcional)</span>
                    </label>
                    <div className="flex">
                      <span className="px-3 py-2.5 rounded-l-lg border border-r-0 text-sm"
                        style={{ background: '#f5f5f5', borderColor: '#D3C7AD', color: '#6B6751' }}>@</span>
                      <input type="text" placeholder="seuperfil" value={form.instagram}
                        onChange={e => set('instagram', e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-r-lg border text-sm outline-none"
                        style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                    </div>
                  </div>
                  <p className="text-xs p-3 rounded-lg" style={{ background: '#f0ede6', color: '#6B6751' }}>
                    Pelo menos WhatsApp ou e-mail e obrigatorio.
                  </p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Confirme seus dados</h2>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: '#f5f2ec' }}>
                    {[
                      { label: 'Negocio', value: form.nome },
                      { label: 'Segmento', value: form.segmento },
                      { label: 'Cidade', value: form.cidade + ' - ' + form.estado },
                      form.whatsapp && { label: 'WhatsApp', value: form.whatsapp },
                      form.email && { label: 'E-mail', value: form.email },
                      { label: 'Avaliacoes', value: form.aceita_avaliacoes ? 'Habilitadas' : 'Desabilitadas' },
                    ].filter(Boolean).map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span style={{ color: '#6B6751' }}>{row.label}</span>
                        <span className="font-medium" style={{ color: '#28374A' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl text-sm" style={{ background: '#FFF3DC', color: '#8B5E00' }}>
                    Nossa IA vai gerar uma descricao profissional e um artigo SEO automaticamente.
                  </div>
                  <p className="text-xs text-center" style={{ color: '#6B6751' }}>
                    Ao cadastrar, voce concorda com nossos Termos de uso.
                  </p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: '#28374A', color: '#28374A' }}>
                    Voltar
                  </button>
                )}
                {step < 3 ? (
                  <button onClick={() => { if (canNext()) setStep(s => s + 1) }} disabled={!canNext()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: '#FFBD76', color: '#28374A' }}>
                    Continuar
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: loading ? '#D3C7AD' : '#754437', color: 'white' }}>
                    {loading ? 'Publicando...' : 'Publicar meu perfil gratis'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}