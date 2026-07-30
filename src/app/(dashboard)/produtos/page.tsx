import { createClient } from '@/lib/supabase/server'
import { ProdutoTable } from '@/components/produtos/ProdutoTable'
import { Produto } from '@/lib/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProdutosPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .order('nome')

  return <ProdutoTable initialData={(data ?? []) as Produto[]} />
}
