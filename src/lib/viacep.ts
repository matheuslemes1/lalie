import { ViaCEPResponse } from './types'

export async function buscarEnderecoPorCEP(cep: string): Promise<ViaCEPResponse | null> {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) return null

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
    if (!response.ok) return null
    const data: ViaCEPResponse = await response.json()
    if (data.erro) return null
    return data
  } catch {
    return null
  }
}
