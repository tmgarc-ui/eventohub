import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SEGMENTOS = [
  'DJ', 'Buffet', 'Fotografia', 'Filmagem', 'Decoração',
  'Espaço para eventos', 'Banda / Música ao vivo', 'Cerimonial',
  'Assessoria', 'Bolo e doces', 'Iluminação e som',
  'Segurança', 'Transporte', 'Floricultura', 'Outros'
]

const PER_PAGE = 12

export default function Fornecedores() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

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

  useEffect(() => {
    buscar()
  }, [segmento, cidade, q, page])

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
    if (cidade) query = query.ilike('cidade', `%${cidade}%`)
    if (q) query = query.or(`nome.ilike.%${q}%,descricao_ia.ilike.%${q}%`)

    const { data, count, error } = await query
    if (!error) {
      setFornecedores(data || [])
      setTotal(count || 0)
    }
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
    setFiltroSeg('')
    setFiltroCid('')
    setFiltroQ('')
    setPage(0)
    setSearchParams({})
  }

  const temFiltro = segmento || cidade || q

  return (
    <div className="min-h-screen" style={{ background: '#D3C7AD' }}>

      {/* Header */}
      <header style={{ background: '#28374A' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#28374A' }}>
            {segmento ? `${segmento}s` : 'Fornecedores de eventos'}
            {cidade ? ` em ${cidade}` : ''}
          </h1>
          {total > 0 && (
            <p className="text-sm" style={{ color: '#6B6751' }}>
              {total} fornecedor{total !== 1 ? 'es' : ''} encontrado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar de filtros */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="rounded-2xl p-4 bg-white sticky top-4">
              <h2 className="font-semibold text-sm mb-4" style={{ color: '#28374A' }}>Filtros</h2>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>
                    Busca livre
                  </label>
                  <input
                    type="text"
                    placeholder="Nome ou descrição..."
                    value={filtroQ}
                    onChange={e => setFiltroQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>
                    Segmento
                  </label>
                  <select
                    value={filtroSeg}
                    onChange={e => setFiltroSeg(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: filtroSeg ? '#28374A' : '#6B6751' }}
                  >
                    <option value="">Todos</option>
                    {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: '#6B6751' }}>
                    Cidade
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo"
                    value={filtroCid}
                    onChange={e => setFiltroCid(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
                    className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
                    style={{ borderColor: '#D3C7AD', color: '#28374A' }}
                  />
                </div>

                <button
                  onClick={aplicarFiltros}
                  className="w-full py-2 rounded-lg text-xs font-bold transition-colors"
                  style={{ background: '#FFBD76', color: '#28374A' }}
                >
                  Aplicar filtros
                </button>

                {temFiltro && (
                  <button
                    onClick={limparFiltros}
                    className="w-full py-2 rounded-lg text-xs border transition-colors"
                    style={{ borderColor: '#D3C7AD', color: '#6B6751' }}
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Segmentos rápidos */}
              <div className="mt-5">
                <p className="text-xs font-medium mb-2" style={{ color: '#6B6751' }}>Segmentos populares</p>
                <div className="flex flex-wrap gap-1">
                  {['DJ', 'Buffet', 'Fotografia', 'Decoração', 'Cerimonial'].map(s => (
                    <button
                      key={s}
                      onClick={() => { setFiltroSeg(s); setPage(0); setSearchParams({ segmento: s }) }}
                      className="text-xs px-2 py-1 rounded-full border transition-colors"
                      style={{
                        borderColor: segmento === s ? '#754437' : '#D3C7AD',
                        background: segmento === s ? '#754437' : 'transparent',
                        color: segmento === s ? 'white' : '#6B6751'
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Grid de resultados */}
          <main className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-xl bg-white overflow-hidden animate-pulse">
                    <div className="h-28" style={{ background: '#D3C7AD' }} />
                    <div className="p-3 space-y-2">
                      <div className="h-3 rounded" style={{ background: '#D3C7AD', width: '60%' }} />
                      <div className="h-3 rounded" style={{ background: '#D3C7AD', width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : fornecedores.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium mb-1" style={{ color: '#28374A' }}>Nenhum fornecedor encontrado</p>
                <p className="text-sm mb-4" style={{ color: '#6B6751' }}>
                  Tente outros filtros ou seja o primeiro da sua cidade!
                </p>
                <a href="/cadastrar"
                  className="inline-block px-6 py-2.5 rounded-full text-sm font-bold"
                  style={{ background: '#FFBD76', color: '#28374A' }}>
                  Cadastrar meu negócio grátis
                </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fornecedores.map(f => (
                    <FornecedorCard key={f.id} fornecedor={f} />
                  ))}
                </div>

                {/* Paginação */}
                {total > PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40 transition-colors"
                      style={{ borderColor: '#28374A', color: '#28374A' }}
                    >
                      ← Anterior
                    </button>
                    <span className="text-sm px-3" style={{ color: '#6B6751' }}>
                      {page + 1} de {Math.ceil(total / PER_PAGE)}
                    </span>
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={(page + 1) * PER_PAGE >= total}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40 transition-colors"
                      style={{ borderColor: '#28374A', color: '#28374A' }}
                    >
                      Próxima →
                    </button>
                  </div>
                )}

                {/* CTA cadastro no final */}
                <div className="mt-10 p-6 rounded-2xl text-center"
                  style={{ background: '#28374A' }}>
                  <p className="font-semibold text-white mb-1">É fornecedor de eventos?</p>
                  <p className="text-sm text-white/60 mb-4">
                    Apareça nesta lista gratuitamente e seja encontrado por clientes.
                  </p>
                  <a href="/cadastrar"
                    className="inline-block px-6 py-2.5 rounded-full text-sm font-bold"
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

function FornecedorCard({ fornecedor }) {
  const descricao = fornecedor.descricao_ia || ''
  const resumo = descricao.length > 90 ? descricao.slice(0, 90) + '...' : descricao

  return (
    <a href={`/f/${fornecedor.slug}`}
      className="block rounded-xl overflow-hidden bg-white hover:shadow-md transition-all hover:-translate-y-0.5">

      {/* Capa */}
      <div className="h-28 relative" style={{ background: '#D3C7AD' }}>
        {fornecedor.foto_capa
          ? <img src={fornecedor.foto_capa} alt={fornecedor.nome} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center opacity-20 text-4xl">🎉</div>
        }
        <div className="absolute top-2 left-2 flex gap-1">
          {fornecedor.destaque && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#FFBD76', color: '#28374A' }}>
              ⭐ Destaque
            </span>
          )}
          {fornecedor.verificado && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: '#28374A', color: '#FFBD76' }}>
              ✓ Verificado
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          {fornecedor.foto_perfil
            ? <img src={fornecedor.foto_perfil} alt={fornecedor.nome}
                className="w-9 h-9 rounded-full object-cover border-2 flex-shrink-0 -mt-5"
                style={{ borderColor: 'white', background: 'white' }} />
            : <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm -mt-5 flex-shrink-0 border-2"
                style={{ background: '#28374A', color: '#FFBD76', borderColor: 'white' }}>
                {fornecedor.nome.charAt(0)}
              </div>
          }
          <div className="min-w-0 pt-0.5">
            <p className="font-semibold text-sm truncate leading-tight" style={{ color: '#28374A' }}>
              {fornecedor.nome}
            </p>
            <p className="text-xs" style={{ color: '#6B6751' }}>
              {fornecedor.segmento} · {fornecedor.cidade}/{fornecedor.estado}
            </p>
          </div>
        </div>

        {resumo && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#6B6751' }}>
            {resumo}
          </p>
        )}

        {fornecedor.servicos?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {fornecedor.servicos.slice(0, 3).map(s => (
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
