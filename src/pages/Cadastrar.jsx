import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'DJ', 'Buffet e catering', 'Fotografia', 'Filmagem', 'Decoração',
  'Espaço para eventos', 'Banda / Música ao vivo', 'Cerimonial',
  'Assessoria', 'Bolo e doces', 'Iluminação, som e telão',
  'Mão de obra para eventos', 'Locação de equipamentos',
  'Locação de materiais', 'Locação de brinquedos',
  'Lembranças e brindes', 'Segurança', 'Transporte', 'Floricultura', 'Outros'
]

const STEPS = ['Identificação', 'Negócio', 'Contato', 'Fotos', 'Confirmar']

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
  const [uploadingFoto, setUploadingFoto] = useState(null)
  const cidadeTimer = useRef(null)
  const [loginDoc, setLoginDoc] = useState('')
  const [loginSenha, setLoginSenha] = useState('')

  const [form, setForm] = useState({
    documento: '', senha: '', senha_confirma: '',
    nome: '', segmento: '', cidade: '', estado: '', servicos: '',
    whatsapp: '', email: '', instagram: '',
    foto_perfil: '', foto_capa: '',
    aceita_avaliacoes: true,
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const buscarCidade = async (texto) => {
    if (texto.length < 3) { setCidadeSugestoes([]); return }
    setBuscandoCidade(true)
    try {
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
      const data = await res.json()
      const filtradas = data
        .filter(m => m.nome.toLowerCase().startsWith(texto.toLowerCase()))
        .slice(0, 8)
        .map(m => {
          let uf = ''
          try { uf = m.microrregiao.mesorregiao.UF.sigla } catch {}
          return { id: m.id, nome: m.nome, estado: uf }
        })
        .filter(m => m.estado)
      setCidadeSugestoes(filtradas)
    } catch {
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

  const uploadFoto = async (file, tipo) => {
    setUploadingFoto(tipo)
    const ext = file.name.split('.').pop()
    const path = 'perfis/' + Date.now() + '-' + tipo + '.' + ext
    const { error } = await supabase.storage.from('eventhub').upload(path, file, { upsert: true })
    if (error) { setError('Erro ao enviar foto. Tente novamente.'); setUploadingFoto(null); return }
    const { data } = supabase.storage.from('eventhub').getPublicUrl(path)
    set(tipo, data.publicUrl)
    setUploadingFoto(null)
  }

  const canNext = () => {
    if (step === 0) return validarDocumento(form.documento) && form.senha.length >= 6 && form.senha === form.senha_confirma
    if (step === 1) return form.nome && form.segmento && form.cidade && form.estado
    if (step === 2) return form.whatsapp || form.email
    if (step === 3) return true // fotos opcionais
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
    if (error || !data) { setError('Documento não encontrado.'); setLoadingLogin(false); return }
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
          {modoLogin ? 'Criar cadastro' : 'Já tenho cadastro'}
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
              <h1 className="text-2xl font-bold mb-2" style={{ color: '#28374A' }}>Cadastre seu negócio grátis</h1>
              <p className="text-sm" style={{ color: '#6B6751' }}>Apareça no Google e seja encontrado por clientes na sua cidade.</p>
            </div>

            {/* Steps */}
            <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-shrink-0">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: i <= step ? '#754437' : '#28374A', color: i <= step ? 'white' : 'rgba(255,255,255,0.4)' }}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span className={'text-xs hidden sm:block ' + (i === step ? 'font-medium' : 'opacity-50')}
                    style={{ color: '#28374A' }}>{s}</span>
                  {i < STEPS.length - 1 && <div className="w-4 h-px" style={{ background: '#28374A', opacity: 0.3 }} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-white p-6">
              {error && <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>}

              {/* STEP 0: Identificação */}
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Identificação</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>CPF ou CNPJ *</label>
                    <input type="text" placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={form.documento} onChange={e => set('documento', formatarDocumento(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none"
                      style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                    <p className="text-xs mt-1" style={{ color: '#6B6751' }}>Não será exibido publicamente. Evita cadastros duplicados.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Senha *</label>
                    <input type="password" placeholder="Mínimo 6 caracteres" value={form.senha}
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
                      <p className="text-xs mt-1 text-red-600">As senhas não conferem</p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 1: Negócio */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Sobre o seu negócio</h2>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>Nome do negócio *</label>
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
                    {form.estado && <p className="text-xs mt-1 font-medium" style={{ color: '#6B6751' }}>✓ {form.cidade} — {form.estado}</p>}
                    {form.cidade && !form.estado && <p className="text-xs mt-1" style={{ color: '#754437' }}>Selecione uma cidade da lista</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                      Estado * <span className="font-normal opacity-60">(preenchido automaticamente ou selecione)</span>
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
                      Serviços <span className="font-normal opacity-60">(separados por vírgula)</span>
                    </label>
                    <input type="text" placeholder="Ex: Casamentos, Aniversários, Formaturas" value={form.servicos}
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
                      <p className="text-sm font-medium" style={{ color: '#28374A' }}>Aceitar avaliações de clientes</p>
                      <p className="text-xs mt-0.5" style={{ color: '#6B6751' }}>Clientes poderão deixar notas e comentários no seu perfil.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Contato */}
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
                    Pelo menos WhatsApp ou e-mail é obrigatório.
                  </p>
                </div>
              )}

              {/* STEP 3: Fotos */}
              {step === 3 && (
                <div className="space-y-5">
                  <h2 className="font-semibold text-base mb-1" style={{ color: '#28374A' }}>Fotos do seu negócio</h2>
                  <p className="text-xs mb-4" style={{ color: '#6B6751' }}>Opcional — você pode adicionar depois no painel.</p>

                  {/* Logo / foto de perfil */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#28374A' }}>Logo ou foto de perfil</label>
                    {form.foto_perfil ? (
                      <div className="flex items-center gap-3">
                        <img src={form.foto_perfil} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2"
                          style={{ borderColor: '#FFBD76' }} />
                        <button onClick={() => set('foto_perfil', '')}
                          className="text-xs underline" style={{ color: '#754437' }}>Remover</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer"
                        style={{ borderColor: '#D3C7AD' }}>
                        {uploadingFoto === 'foto_perfil'
                          ? <span className="text-sm" style={{ color: '#6B6751' }}>Enviando...</span>
                          : <>
                              <span className="text-3xl mb-1">🖼️</span>
                              <span className="text-sm" style={{ color: '#6B6751' }}>Clique para enviar logo</span>
                              <span className="text-xs mt-0.5" style={{ color: '#6B6751', opacity: 0.6 }}>JPG, PNG até 5MB</span>
                            </>
                        }
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files[0] && uploadFoto(e.target.files[0], 'foto_perfil')} />
                      </label>
                    )}
                  </div>

                  {/* Foto de capa */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#28374A' }}>
                      Foto de capa <span className="font-normal opacity-60">(opcional)</span>
                    </label>
                    {form.foto_capa ? (
                      <div className="relative">
                        <img src={form.foto_capa} alt="Capa" className="w-full h-32 rounded-xl object-cover" />
                        <button onClick={() => set('foto_capa', '')}
                          className="absolute top-2 right-2 text-xs px-2 py-1 rounded-full text-white"
                          style={{ background: 'rgba(0,0,0,0.5)' }}>Remover</button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer"
                        style={{ borderColor: '#D3C7AD' }}>
                        {uploadingFoto === 'foto_capa'
                          ? <span className="text-sm" style={{ color: '#6B6751' }}>Enviando...</span>
                          : <>
                              <span className="text-3xl mb-1">🏞️</span>
                              <span className="text-sm" style={{ color: '#6B6751' }}>Foto de fundo do perfil</span>
                              <span className="text-xs mt-0.5" style={{ color: '#6B6751', opacity: 0.6 }}>Recomendado: 1200×400px</span>
                            </>
                        }
                        <input type="file" accept="image/*" className="hidden"
                          onChange={e => e.target.files[0] && uploadFoto(e.target.files[0], 'foto_capa')} />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Confirmar */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>Confirme seus dados</h2>
                  <div className="rounded-xl p-4 space-y-2" style={{ background: '#f5f2ec' }}>
                    {[
                      { label: 'Negócio', value: form.nome },
                      { label: 'Segmento', value: form.segmento },
                      { label: 'Cidade', value: form.cidade + ' - ' + form.estado },
                      form.whatsapp ? { label: 'WhatsApp', value: form.whatsapp } : null,
                      form.email ? { label: 'E-mail', value: form.email } : null,
                      { label: 'Logo', value: form.foto_perfil ? '✓ Enviado' : 'Não adicionado' },
                      { label: 'Avaliações', value: form.aceita_avaliacoes ? 'Habilitadas' : 'Desabilitadas' },
                    ].filter(Boolean).map(row => (
                      <div key={row.label} className="flex justify-between text-sm">
                        <span style={{ color: '#6B6751' }}>{row.label}</span>
                        <span className="font-medium" style={{ color: '#28374A' }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl text-sm" style={{ background: '#FFF3DC', color: '#8B5E00' }}>
                    ✨ Nossa IA vai gerar uma descrição profissional e um artigo SEO automaticamente.
                  </div>
                  <p className="text-xs text-center" style={{ color: '#6B6751' }}>
                    Ao cadastrar, você concorda com nossos Termos de uso.
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-3 mt-6">
                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)}
                    className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                    style={{ borderColor: '#28374A', color: '#28374A' }}>
                    Voltar
                  </button>
                )}
                {step < STEPS.length - 1 ? (
                  <button onClick={() => { if (canNext()) setStep(s => s + 1) }} disabled={!canNext()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-40"
                    style={{ background: '#FFBD76', color: '#28374A' }}>
                    Continuar →
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                    style={{ background: loading ? '#D3C7AD' : '#754437', color: 'white' }}>
                    {loading ? 'Publicando...' : 'Publicar meu perfil grátis 🚀'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: '🔍', text: 'Apareça no Google' },
                { icon: '⚡', text: 'Perfil em minutos' },
                { icon: '💰', text: '100% gratuito' },
              ].map(b => (
                <div key={b.text} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <div className="text-xl mb-1">{b.icon}</div>
                  <div className="text-xs font-medium" style={{ color: '#28374A' }}>{b.text}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
