import { createClient } from '@/lib/supabase/server'
import { InsumoTable } from '@/components/insumos/InsumoTable'
import { Insumo } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Despesas' }

export default async function InsumosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('insumos')
    .select('*')
    .order('data_compra', { ascending: false })

  return <InsumoTable initialData={(data ?? []) as Insumo[]} />
}
