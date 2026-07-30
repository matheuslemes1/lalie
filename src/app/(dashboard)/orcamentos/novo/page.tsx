import { createClient } from '@/lib/supabase/server'
import { OrcamentoForm } from '@/components/orcamentos/OrcamentoForm'
import { Produto, Cliente } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Novo Orçamento' }

async function getNextNumero() {
  const supabase = await createClient()
  // Busca o maior número e incrementa
  const { data } = await supabase
    .from('pedidos')
    .select('numero_pedido')
    .order('created_at', { ascending: false })
    .limit(1)
  if (!data || data.length === 0) return 'ORC-0001'
  const last = data[0].numero_pedido
  const num = parseInt(last.replace('ORC-', ''), 10)
  return `ORC-${String(num + 1).padStart(4, '0')}`
}

export default async function NovoOrcamentoPage() {
  const supabase = await createClient()

  const [{ data: produtos }, { data: clientes }, proximoNumero] = await Promise.all([
    supabase.from('produtos').select('*').eq('ativo', true).order('nome'),
    supabase.from('clientes').select('*').order('nome'),
    getNextNumero(),
  ])

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#303030]">Novo Orçamento</h1>
        <p className="text-sm text-gray-500 mt-0.5">Preencha os dados do pedido</p>
      </div>
      <OrcamentoForm
        produtos={(produtos ?? []) as Produto[]}
        clientes={(clientes ?? []) as Cliente[]}
        proximoNumero={proximoNumero}
      />
    </div>
  )
}
