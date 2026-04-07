import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'DJ', 'Buffet', 'Fotografia', 'Filmagem', 'Decoração',
  'Espaço para eventos', 'Banda / Música ao vivo', 'Cerimonial',
  'Assessoria', 'Bolo e doces', 'Iluminação e som',
  'Segurança', 'Transporte', 'Floricultura', 'Outros'
]

const STEPS = ['Negócio', 'Contato', 'Fotos', 'Confirmar']

export default function Cadastrar() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingFoto, setUploadingFoto] = useState(null)

  const [form, setForm] = useState({
    nome: '',
    segmento: '',
    cidade: '',
    estado: '',
    servicos: '',
    whatsapp: '',
    email: '',
    instagram: '',
    foto_perfil: '',
    foto_capa: '',
  })

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const uploadFoto = async (file, tipo) => {
    setUploadingFoto(tipo)
    const ext = file.name.split('.').pop()
    const path = `perfis/${Date.now()}-${tipo}.${ext}`
    const { error } = await supabase.storage
      .from('eventhub')
      .upload(path, file, { upsert: true })
    if (error) { setError('Erro ao enviar foto.'); setUploadingFoto(null); return }
    const { data } = supabase.storage.from('eventhub').getPublicUrl(path)
    set(tipo, data.publicUrl)
    setUploadingFoto(null)
  }

  const canNext = () => {
    if (step === 0) return form.nome && form.segmento && form.cidade && form.estado
    if (step === 1) return form.whatsapp || form.email
    return true
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          servicos: form.servicos.split(',').map(s => s.trim()).filter(Boolean)
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido')
      navigate(`/cadastro-ok?slug=${data.slug}&token=${data.painel_url.split('token=')[1]}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: '#28374A' }}>
        <a href="/" className="text-xl font-bold text-white">EventoHub</a>
        <span className="text-sm" style={{ color: '#FFBD76' }}>Cadastro gratuito</span>
      </header>

      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#28374A' }}>
            Cadastre seu negócio grátis
          </h1>
          <p className="text-sm" style={{ color: '#6B6751' }}>
            Apareça nos resultados do Google e seja encontrado por clientes na sua cidade.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step ? 'text-white' :
                i === step ? 'text-white' : 'text-white/40'
              }`}
                style={{ background: i <= step ? '#754437' : '#28374A' }}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === step ? 'font-medium' : 'opacity-50'}`}
                style={{ color: '#28374A' }}>
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-6 h-px mx-1" style={{ background: '#28374A', opacity: 0.3 }} />
              )}
            </div>
          ))}
        </div>

        {/* Card do formulário */}
        <div className="rounded-2xl shadow-sm p-6 bg-white">

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          {/* STEP 0: Negócio */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>
                Sobre o seu negócio
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  Nome do negócio *
                </label>
                <input
                  type="text"
                  placeholder="Ex: DJ Fulano, Buffet Estrela..."
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  Segmento *
                </label>
                <select
                  value={form.segmento}
                  onChange={e => set('segmento', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#D3C7AD', color: form.segmento ? '#28374A' : '#6B6751' }}
                >
                  <option value="">Selecione seu segmento</option>
                  {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                    Cidade *
                  </label>
                  <input
                    type="text"
                    placeholder="São Paulo"
                    value={form.cidade}
                    onChange={e => set('cidade', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                    Estado *
                  </label>
                  <input
                    type="text"
                    placeholder="SP"
                    maxLength={2}
                    value={form.estado}
                    onChange={e => set('estado', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  Serviços oferecidos <span className="font-normal opacity-60">(separados por vírgula)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Casamentos, Aniversários, Formaturas"
                  value={form.servicos}
                  onChange={e => set('servicos', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                />
                <p className="text-xs mt-1" style={{ color: '#6B6751' }}>
                  A IA usará essas informações para gerar sua descrição profissional.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Contato */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>
                Como os clientes entram em contato?
              </h2>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="contato@seunegocio.com.br"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
                  style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#28374A' }}>
                  Instagram <span className="font-normal opacity-60">(opcional)</span>
                </label>
                <div className="flex">
                  <span className="px-3 py-2.5 rounded-l-lg border border-r-0 text-sm"
                    style={{ background: '#f5f5f5', borderColor: '#D3C7AD', color: '#6B6751' }}>@</span>
                  <input
                    type="text"
                    placeholder="seuperfil"
                    value={form.instagram}
                    onChange={e => set('instagram', e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-r-lg border text-sm outline-none focus:ring-2"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                  />
                </div>
              </div>
              <p className="text-xs p-3 rounded-lg" style={{ background: '#f0ede6', color: '#6B6751' }}>
                Pelo menos WhatsApp ou e-mail é obrigatório para que os clientes possam te contatar.
              </p>
            </div>
          )}

          {/* STEP 2: Fotos */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>
                Fotos do seu negócio
              </h2>

              {/* Foto de perfil */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#28374A' }}>
                  Logo ou foto de perfil
                </label>
                {form.foto_perfil ? (
                  <div className="flex items-center gap-3">
                    <img src={form.foto_perfil} alt="Perfil" className="w-16 h-16 rounded-full object-cover border-2"
                      style={{ borderColor: '#FFBD76' }} />
                    <button onClick={() => set('foto_perfil', '')}
                      className="text-xs underline" style={{ color: '#754437' }}>Remover</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-amber-50"
                    style={{ borderColor: '#D3C7AD' }}>
                    {uploadingFoto === 'foto_perfil'
                      ? <span className="text-sm" style={{ color: '#6B6751' }}>Enviando...</span>
                      : <>
                          <span className="text-2xl mb-1">🖼️</span>
                          <span className="text-sm" style={{ color: '#6B6751' }}>Clique para enviar</span>
                          <span className="text-xs" style={{ color: '#6B6751', opacity: 0.6 }}>JPG, PNG até 5MB</span>
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
                  <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-amber-50"
                    style={{ borderColor: '#D3C7AD' }}>
                    {uploadingFoto === 'foto_capa'
                      ? <span className="text-sm" style={{ color: '#6B6751' }}>Enviando...</span>
                      : <>
                          <span className="text-2xl mb-1">🏞️</span>
                          <span className="text-sm" style={{ color: '#6B6751' }}>Foto de fundo do perfil</span>
                          <span className="text-xs" style={{ color: '#6B6751', opacity: 0.6 }}>Recomendado: 1200×400px</span>
                        </>
                    }
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => e.target.files[0] && uploadFoto(e.target.files[0], 'foto_capa')} />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Confirmar */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-base mb-4" style={{ color: '#28374A' }}>
                Tudo certo! Confirme seus dados
              </h2>
              <div className="rounded-xl p-4 space-y-2" style={{ background: '#f5f2ec' }}>
                <Row label="Negócio" value={form.nome} />
                <Row label="Segmento" value={form.segmento} />
                <Row label="Cidade" value={`${form.cidade} - ${form.estado}`} />
                {form.whatsapp && <Row label="WhatsApp" value={form.whatsapp} />}
                {form.email && <Row label="E-mail" value={form.email} />}
                {form.instagram && <Row label="Instagram" value={`@${form.instagram}`} />}
              </div>
              <div className="p-3 rounded-xl text-sm" style={{ background: '#FFF3DC', color: '#8B5E00' }}>
                ✨ Nossa IA vai gerar uma descrição profissional para o seu perfil automaticamente, com base no seu segmento e cidade.
              </div>
              <p className="text-xs text-center" style={{ color: '#6B6751' }}>
                Ao cadastrar, você concorda com nossos{' '}
                <a href="/termos" className="underline">Termos de uso</a>.
                Seu perfil será publicado imediatamente.
              </p>
            </div>
          )}

          {/* Botões de navegação */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                style={{ borderColor: '#28374A', color: '#28374A' }}
              >
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext()}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: canNext() ? '#FFBD76' : '#D3C7AD', color: '#28374A' }}
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: loading ? '#D3C7AD' : '#754437', color: 'white' }}
              >
                {loading ? 'Publicando perfil...' : 'Publicar meu perfil grátis 🚀'}
              </button>
            )}
          </div>
        </div>

        {/* Benefícios abaixo do form */}
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
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: '#6B6751' }}>{label}</span>
      <span className="font-medium" style={{ color: '#28374A' }}>{value}</span>
    </div>
  )
}
