import { createClient } from '@/lib/supabase/server'
import { OrcamentoForm } from '@/components/orcamentos/OrcamentoForm'
import { Produto, Cliente, Pedido, ItemPedido } from '@/lib/types'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Editar Orçamento' }

export default async function EditarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pedido }, { data: itens }, { data: produtos }, { data: clientes }] =
    await Promise.all([
      supabase.from('pedidos').select('*').eq('id', id).single(),
      supabase.from('itens_pedido').select('*').eq('pedido_id', id).order('created_at'),
      supabase.from('produtos').select('*').order('nome'),
      supabase.from('clientes').select('*').order('nome'),
    ])

  if (!pedido) notFound()

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#303030]">
          Editar Orçamento{' '}
          <span className="font-mono text-[#90323D]">{pedido.numero_pedido}</span>
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Atualize os dados do pedido</p>
      </div>
      <OrcamentoForm
        produtos={(produtos ?? []) as Produto[]}
        clientes={(clientes ?? []) as Cliente[]}
        pedido={pedido as Pedido}
        itensIniciais={(itens ?? []) as ItemPedido[]}
      />
    </div>
  )
}
