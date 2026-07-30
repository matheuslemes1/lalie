import { createClient } from '@/lib/supabase/server'
import { OrcamentosClient } from '@/components/orcamentos/OrcamentosClient'
import { PedidoComCliente } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Orçamentos' }

export default async function OrcamentosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('vw_pedidos_com_cliente')
    .select('*')
    .order('created_at', { ascending: false })

  return <OrcamentosClient initialData={(data ?? []) as PedidoComCliente[]} />
}
