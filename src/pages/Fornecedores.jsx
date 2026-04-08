import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'DJ', 'Buffet e catering', 'Fotografia', 'Filmagem', 'Decoração',
  'Espaço para eventos', 'Banda / Música ao vivo', 'Cerimonial',
  'Assessoria', 'Bolo e doces', 'Iluminação, som e telão',
  'Mão de obra para eventos', 'Locação de equipamentos',
  'Locação de materiais', 'Locação de brinquedos',
  'Lembranças e brindes', 'Segurança', 'Transporte', 'Floricultura', 'Outros'
]

const PER_PAGE = 12

export default function Fornecedores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [fornecedores, setFornecedores] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)

  const segmento = searchParams.get('segmento') || ''
  const cidade = searchParams.get('cidade') || ''
  const q = searchParams.get('q') || ''

  const [filtroSeg, setFiltroSeg] = useState(segmento)
  const [filtroCid, setFiltroCid] = useState(cidade)
  const [filtroQ, setFiltroQ] = useState(q)

  useEffect(() => { buscar() }, [segmento, cidade, q, page])

  const buscar = async () => {
    setLoading(true)
    let query = supabase
      .from('eventhub_profiles')
      .select('id, slug, nome, segmento, cidade, estado, foto_perfil, foto_capa, verificado, destaque, descricao_ia, servicos', { count: 'exact' })
      .eq('status', 'active')
      .order('destaque', { ascending: false })
      .order('verificado', { ascending: false })
      .order('created_at', { ascending: false })
      .range(page * PER_PAGE, (page + 1) * PER_PAGE - 1)

    if (segmento) query = query.eq('segmento', segmento)
    if (cidade) query = query.ilike('cidade', '%' + cidade + '%')
    if (q) query = query.or('nome.ilike.%' + q + '%,descricao_ia.ilike.%' + q + '%')

    const { data, count, error } = await query
    if (!error) { setFornecedores(data || []); setTotal(count || 0) }
    setLoading(false)
  }

  const aplicarFiltros = () => {
    const params = {}
    if (filtroSeg) params.segmento = filtroSeg
    if (filtroCid) params.cidade = filtroCid
    if (filtroQ) params.q = filtroQ
    setPage(0)
    setSearchParams(params)
  }

  const limparFiltros = () => {
    setFiltroSeg(''); setFiltroCid(''); setFiltroQ('')
    setPage(0); setSearchParams({})
  }

  const temFiltro = segmento || cidade || q

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>
      <header style={{ background: '#28374A' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold text-white">
            Evento<span style={{ color: '#FFBD76' }}>Hub</span>
          </a>
          <a href="/cadastrar" className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: '#FFBD76', color: '#28374A' }}>
            Cadastre seu negócio
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#28374A' }}>
            {segmento ? segmento : 'Fornecedores de eventos'}
            {cidade ? ' em ' + cidade : ''}
          </h1>
          {total > 0 && (
            <p className="text-sm" style={{ color: '#6B6751' }}>
              {total} fornecedor{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar filtros */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="rounded-2xl p-4 bg-white sticky top-4">
              <h2 className="font-semibold text-sm mb-4" style={{ color: '#28374A' }}>Filtros</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Busca livre</label>
                  <input type="text" placeholder="Nome ou descrição..." value={filtroQ}
                    onChange={e => setFiltroQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Segmento</label>
                  <select value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: filtroSeg ? '#28374A' : '#6B6751' }}>
                    <option value="">Todos</option>
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>Cidade</label>
                  <input type="text" placeholder="Ex: São Paulo" value={filtroCid}
                    onChange={e => setFiltroCid(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }} />
                </div>
                <button onClick={aplicarFiltros}
                  className="w-full py-2 rounded-lg text-xs font-bold"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Aplicar filtros
                </button>
                {temFiltro && (
                  <button onClick={limparFiltros}
                    className="w-full py-2 rounded-lg text-xs border"
                    style={{ borderColor: '#D3C7AD', color: '#6B6751' }}>
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium mb-2" style={{ color: '#6B6751' }}>Populares</p>
                <div className="flex flex-wrap gap-1">
                  {['DJ', 'Buffet e catering', 'Fotografia', 'Decoração', 'Cerimonial'].map(s => (
                    <button key={s}
                      onClick={() => { setFiltroSeg(s); setPage(0); setSearchParams({ segmento: s }) }}
                      className="text-xs px-2 py-1 rounded-full border transition-colors"
                      style={{
                        borderColor: segmento === s ? '#754437' : '#D3C7AD',
                        background: segmento === s ? '#754437' : 'transparent',
                        color: segmento === s ? 'white' : '#6B6751'
                      }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-white overflow-hidden animate-pulse h-48" />
                ))}
              </div>
            ) : fornecedores.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium mb-1" style={{ color: '#28374A' }}>Nenhum fornecedor encontrado</p>
                <p className="text-sm mb-4" style={{ color: '#6B6751' }}>Seja o primeiro da sua cidade!</p>
                <a href="/cadastrar" className="inline-block px-6 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Cadastrar meu negócio grátis
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fornecedores.map(f => <FornecedorCard key={f.id} fornecedor={f} />)}
                </div>

                {total > PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
                      style={{ borderColor: '#28374A', color: '#28374A' }}>
                      ← Anterior
                    </button>
                    <span className="text-sm px-3" style={{ color: '#6B6751' }}>
                      {page + 1} de {Math.ceil(total / PER_PAGE)}
                    </span>
                    <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= total}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
                      style={{ borderColor: '#28374A', color: '#28374A' }}>
                      Próxima →
                    </button>
                  </div>
                )}

                <div className="mt-10 p-6 rounded-2xl text-center" style={{ background: '#28374A' }}>
                  <p className="font-semibold text-white mb-1">É fornecedor de eventos?</p>
                  <p className="text-sm text-white/60 mb-4">Apareça nesta lista gratuitamente.</p>
                  <a href="/cadastrar" className="inline-block px-6 py-2.5 rounded-full text-sm font-bold"
                    style={{ background: '#FFBD76', color: '#28374A' }}>
                    Cadastrar grátis
                  </a>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

function FornecedorCard({ fornecedor: f }) {
  const resumo = (f.descricao_ia || '').slice(0, 90)

  return (
    <a href={'/f/' + f.slug}
      className="block rounded-xl overflow-hidden bg-white hover:shadow-md transition-all hover:-translate-y-0.5">

      {/* Capa com altura fixa */}
      <div className="relative" style={{ height: '120px', background: '#D3C7AD' }}>
        {f.foto_capa
          ? <img src={f.foto_capa} alt={f.nome} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🎉</div>
        }
        <div className="absolute top-2 left-2 flex gap-1">
          {f.destaque && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#FFBD76', color: '#28374A' }}>⭐ Destaque</span>
          )}
          {f.verificado && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#28374A', color: '#FFBD76' }}>✓ Verificado</span>
          )}
        </div>
      </div>

      {/* Info — sem margin negativa para não cortar */}
      <div className="p-3">
        <div className="flex items-center gap-3 mb-2">
          {f.foto_perfil
            ? <img src={f.foto_perfil} alt={f.nome}
                className="w-10 h-10 rounded-full object-cover border-2 flex-shrink-0"
                style={{ borderColor: '#FFBD76' }} />
            : <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: '#28374A', color: '#FFBD76' }}>
                {f.nome.charAt(0)}
              </div>
          }
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate" style={{ color: '#28374A' }}>{f.nome}</p>
            <p className="text-xs" style={{ color: '#6B6751' }}>
              {f.segmento} · {f.cidade}/{f.estado}
            </p>
          </div>
        </div>

        {resumo && (
          <p className="text-xs leading-relaxed" style={{ color: '#6B6751' }}>
            {resumo}{f.descricao_ia && f.descricao_ia.length > 90 ? '...' : ''}
          </p>
        )}

        {f.servicos?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {f.servicos.slice(0, 3).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#f5f2ec', color: '#6B6751' }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  )
}
