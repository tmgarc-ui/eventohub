// api/track.js
// POST /api/track
// Body: { profile_id, tipo, origem }
// Registra views e cliques sem expor a service_role key no frontend

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { profile_id, tipo, origem } = req.body
  if (!profile_id || !tipo) return res.status(400).end()

  const tiposValidos = ['view', 'whatsapp', 'email', 'site']
  if (!tiposValidos.includes(tipo)) return res.status(400).end()

  try {
    // Insere o lead
    await supabase.from('eventhub_leads').insert({
      profile_id,
      tipo,
      origem: origem || null
    })

    // Incrementa o contador no perfil
    const campoMap = {
      view: 'views',
      whatsapp: 'cliques_whatsapp',
      email: 'cliques_email',
      site: 'cliques_email' // reusa o campo por ora
    }
    const campo = campoMap[tipo]
    if (campo) {
      await supabase.rpc('incrementar_contador', {
        tabela: 'eventhub_profiles',
        coluna: campo,
        registro_id: profile_id
      }).catch(() => {
        // fallback: update direto se a RPC não existir
        supabase
          .from('eventhub_profiles')
          .select(campo)
          .eq('id', profile_id)
          .single()
          .then(({ data }) => {
            if (data) {
              supabase
                .from('eventhub_profiles')
                .update({ [campo]: (data[campo] || 0) + 1 })
                .eq('id', profile_id)
            }
          })
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
