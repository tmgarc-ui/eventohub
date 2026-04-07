// api/cadastrar.js
// Vercel Serverless Function
// POST /api/cadastrar
// Body: { nome, segmento, cidade, estado, whatsapp, email, servicos, foto_perfil, foto_capa }

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { slugify, profileSlug, artigoSlug } from '../src/lib/slugify.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service_role para contornar RLS
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const { nome, segmento, cidade, estado, whatsapp, email, servicos, foto_perfil, foto_capa } = req.body

  if (!nome || !segmento || !cidade || !estado) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, segmento, cidade, estado' })
  }

  try {
    // ── 1. Gera slug único
    let slug = profileSlug(nome, cidade)
    const { data: existing } = await supabase
      .from('eventhub_profiles')
      .select('slug')
      .like('slug', `${slug}%`)
    if (existing && existing.length > 0) {
      slug = `${slug}-${existing.length + 1}`
    }

    // ── 2. Gera token de edição (sem login)
    const token = crypto.randomUUID()
    const tokenExpira = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias

    // ── 3. Gera descrição via Claude
    let descricaoIa = ''
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: `Você é um especialista em marketing para pequenos negócios de eventos.
Escreva uma descrição profissional e atraente para este fornecedor de eventos:

Nome: ${nome}
Segmento: ${segmento}
Cidade: ${cidade} - ${estado}
Serviços: ${(servicos || []).join(', ') || 'não informado'}

Escreva em 2-3 parágrafos curtos, em tom profissional e caloroso, destacando a cidade e o segmento.
Não use aspas, asteriscos nem markdown. Apenas texto corrido.`
        }]
      })
      descricaoIa = msg.content[0]?.text || ''
    } catch (e) {
      console.error('Erro ao gerar descrição IA:', e)
    }

    // ── 4. Salva o perfil
    const { data: profile, error: profileError } = await supabase
      .from('eventhub_profiles')
      .insert({
        slug,
        nome,
        segmento,
        cidade,
        estado,
        whatsapp: whatsapp || null,
        email: email || null,
        servicos: servicos || [],
        foto_perfil: foto_perfil || null,
        foto_capa: foto_capa || null,
        descricao_ia: descricaoIa,
        status: 'active', // ativa direto no MVP; adicionar moderação depois
        token_edicao: token,
        token_expira_em: tokenExpira.toISOString()
      })
      .select()
      .single()

    if (profileError) throw profileError

    // ── 5. Gera ou atualiza artigo SEO (async — não bloqueia a resposta)
    generateOrUpdateArticle(segmento, cidade, estado, profile.id).catch(console.error)

    return res.status(200).json({
      success: true,
      slug,
      perfil_url: `/f/${slug}`,
      painel_url: `/painel?token=${token}`,
      mensagem: `Perfil criado com sucesso! Você já aparece em /f/${slug}`
    })

  } catch (error) {
    console.error('Erro ao cadastrar:', error)
    return res.status(500).json({ error: 'Erro interno ao cadastrar perfil' })
  }
}

// ── Gera ou atualiza artigo SEO para segmento + cidade
async function generateOrUpdateArticle(segmento, cidade, estado, novoProfileId) {
  const slug = artigoSlug(segmento, cidade)

  // Busca fornecedores ativos nesse segmento + cidade para incluir no artigo
  const { data: fornecedores } = await supabase
    .from('eventhub_profiles')
    .select('nome, slug, descricao_ia, servicos')
    .eq('segmento', segmento)
    .eq('cidade', cidade)
    .eq('status', 'active')
    .limit(10)

  const listaFornecedores = (fornecedores || [])
    .map(f => `- ${f.nome}: ${(f.servicos || []).join(', ')}`)
    .join('\n')

  const prompt = `Você é um especialista em SEO para o setor de eventos no Brasil.
Escreva um artigo completo e otimizado para SEO sobre o tema:
"${segmento}s em ${cidade} - ${estado}"

O artigo deve:
- Ter entre 600 e 800 palavras
- Estar em HTML semântico (use <h2>, <p>, <ul>, <li> — sem <html>, <body> ou <head>)
- Incluir dicas práticas para quem busca ${segmento.toLowerCase()} em ${cidade}
- Mencionar naturalmente a cidade ${cidade} e o estado ${estado}
- Terminar com uma seção <h2>Fornecedores de ${segmento} em ${cidade}</h2> seguida de uma lista dos profissionais abaixo
- Incluir ao final um parágrafo com CTA: "Precisa de ajuda para organizar seu evento? Confira todos os fornecedores verificados no EventoHub."

Fornecedores cadastrados:
${listaFornecedores || `- Ainda sem fornecedores cadastrados em ${cidade}`}

Responda APENAS com o HTML, sem explicações, sem markdown, sem blocos de código.`

  const msg = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    .messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    })

  const conteudo = msg.content[0]?.text || ''

  const titulo = `${segmento}s em ${cidade} — Guia completo ${new Date().getFullYear()}`
  const metaDesc = `Encontre os melhores ${segmento.toLowerCase()}s em ${cidade}. Lista atualizada com profissionais verificados, avaliações e contatos diretos.`

  await supabase
    .from('eventhub_artigos')
    .upsert({
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
      versao: 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'slug' })
}
