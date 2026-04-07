// api/cadastrar.js
// POST /api/cadastrar

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function slugify(text) {
  return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' })

  const {
    documento, senha, nome, segmento, cidade, estado,
    cidade_ibge_id, whatsapp, email, instagram, servicos,
    foto_perfil, foto_capa, aceita_avaliacoes
  } = req.body

  if (!documento || !senha || !nome || !segmento || !cidade || !estado) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' })
  }

  try {
    // ── 1. Verifica duplicata por CPF/CNPJ
    const { data: existente } = await supabase
      .from('eventhub_profiles')
      .select('id, slug, token_edicao')
      .eq('documento', documento)
      .single()

    if (existente) {
      return res.status(409).json({
        error: 'Já existe um cadastro com este CPF/CNPJ. Use "Já tenho cadastro" para acessar seu painel.',
        ja_existe: true
      })
    }

    // ── 2. Gera slug único
    let slug = slugify(`${nome}-${cidade}`)
    const { data: slugsExistentes } = await supabase
      .from('eventhub_profiles')
      .select('slug')
      .like('slug', `${slug}%`)
    if (slugsExistentes && slugsExistentes.length > 0) {
      slug = `${slug}-${slugsExistentes.length + 1}`
    }

    // ── 3. Gera token de acesso
    const token = crypto.randomUUID()
    const tokenExpira = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano

    // ── 4. Hash simples da senha (base64 — suficiente para MVP)
    // Em produção: substituir por bcrypt via edge function
    const senhaHash = Buffer.from(senha).toString('base64')

    // ── 5. Gera descrição via IA
    let descricaoIa = ''
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Você é especialista em marketing para pequenos negócios de eventos no Brasil.
Escreva uma descrição profissional e atraente para este fornecedor:

Nome: ${nome}
Segmento: ${segmento}
Cidade: ${cidade} - ${estado}
Serviços: ${(servicos || []).join(', ') || 'não informado'}

Escreva em 2-3 parágrafos curtos, tom profissional e caloroso, mencionando a cidade e especialidade.
Sem aspas, asteriscos ou markdown. Apenas texto corrido.`
        }]
      })
      descricaoIa = msg.content[0]?.text || ''
    } catch (e) {
      console.error('Erro IA descrição:', e.message)
    }

    // ── 6. Salva o perfil
    const { data: profile, error: profileError } = await supabase
      .from('eventhub_profiles')
      .insert({
        slug,
        documento,
        senha_hash: senhaHash,
        nome,
        segmento,
        cidade,
        estado,
        cidade_ibge_id: cidade_ibge_id || null,
        whatsapp: whatsapp || null,
        email: email || null,
        instagram: instagram || null,
        servicos: servicos || [],
        foto_perfil: foto_perfil || null,
        foto_capa: foto_capa || null,
        descricao_ia: descricaoIa,
        aceita_avaliacoes: aceita_avaliacoes !== false,
        status: 'active',
        token_edicao: token,
        token_expira_em: tokenExpira.toISOString()
      })
      .select()
      .single()

    if (profileError) throw profileError

    // ── 7. Gera artigo SEO em background
    gerarArtigo(segmento, cidade, estado).catch(console.error)

    return res.status(200).json({
      success: true,
      slug,
      token,
      perfil_url: `/f/${slug}`,
      painel_url: `/painel?token=${token}`
    })

  } catch (error) {
    console.error('Erro cadastrar:', error)
    return res.status(500).json({ error: 'Erro interno. Tente novamente.' })
  }
}

async function gerarArtigo(segmento, cidade, estado) {
  const slug = `${segmento.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}-em-${cidade.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`

  const { data: fornecedores } = await supabase
    .from('eventhub_profiles')
    .select('nome, servicos')
    .eq('segmento', segmento)
    .eq('cidade', cidade)
    .eq('status', 'active')
    .limit(10)

  const lista = (fornecedores || [])
    .map(f => `- ${f.nome}: ${(f.servicos || []).join(', ')}`)
    .join('\n')

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Escreva um artigo SEO completo sobre "${segmento}s em ${cidade} - ${estado}".
600-800 palavras. HTML semântico (h2, p, ul, li). Sem html/body/head.
Inclua dicas práticas para quem busca ${segmento.toLowerCase()} em ${cidade}.
Termine com <h2>Fornecedores de ${segmento} em ${cidade}</h2> e a lista abaixo.
CTA final: "Cadastre seu negócio gratuitamente no EventoHub."

Fornecedores:
${lista || `Seja o primeiro ${segmento.toLowerCase()} cadastrado em ${cidade}!`}

Responda APENAS com o HTML, sem explicações.`
    }]
  })

  const conteudo = msg.content[0]?.text || ''
  const titulo = `${segmento}s em ${cidade} — Guia completo ${new Date().getFullYear()}`
  const metaDesc = `Encontre os melhores ${segmento.toLowerCase()}s em ${cidade}. Lista atualizada com profissionais verificados.`

  await supabase.from('eventhub_artigos').upsert({
    slug,
    titulo,
    conteudo,
    tipo: 'local',
    segmento,
    cidade,
    estado,
    meta_description: metaDesc,
    publicado: true,
    gerado_por_ia: true,
    updated_at: new Date().toISOString()
  }, { onConflict: 'slug' })
}
