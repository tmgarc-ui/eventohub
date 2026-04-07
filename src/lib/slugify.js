export function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
}

// Ex: slugify("DJ Fulano - São Paulo") → "dj-fulano-sao-paulo"
export function profileSlug(nome, cidade) {
  return slugify(`${nome}-${cidade}`)
}

// Ex: artigo("DJ", "São Paulo") → "djs-em-sao-paulo"
export function artigoSlug(segmento, cidade) {
  const seg = slugify(segmento) + 's'
  if (!cidade) return seg
  return `${seg}-em-${slugify(cidade)}`
}
