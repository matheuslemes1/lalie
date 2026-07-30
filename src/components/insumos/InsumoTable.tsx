'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Insumo } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { InsumoForm } from './InsumoForm'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { Plus, Pencil, Search, TrendingDown } from 'lucide-react'

interface InsumoTableProps {
  initialData: Insumo[]
}

const categoriaBadgeVariant: Record<string, 'default' | 'coral' | 'secondary' | 'warning' | 'muted'> = {
  'Material': 'default',
  'Embalagem': 'secondary',
  'Conta Fixa': 'warning',
  'Serviço': 'coral',
  'Frete': 'muted',
  'Outros': 'muted',
}

export function InsumoTable({ initialData }: InsumoTableProps) {
  const [data, setData] = useState<Insumo[]>(initialData)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Insumo | null>(null)

  const totalGastos = data.reduce((acc, i) => acc + i.custo_total, 0)

  const filtered = data.filter(
    (i) =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria.toLowerCase().includes(search.toLowerCase()) ||
      (i.fornecedor ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: fresh } = await supabase
      .from('insumos')
      .select('*')
      .order('data_compra', { ascending: false })
    if (fresh) setData(fresh as Insumo[])
  }, [])

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('insumos').delete().eq('id', id)
    await refresh()
  }

  function handleEdit(item: Insumo) {
    setEditItem(item)
    setFormOpen(true)
  }

  function handleNew() {
    setEditItem(null)
    setFormOpen(true)
  }

  return (
    <>
      {/* Cabeçalho da página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#303030]">Despesas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Total registrado:{' '}
            <span className="font-semibold text-[#90323D]">{formatCurrency(totalGastos)}</span>
          </p>
        </div>
        <Button id="btn-novo-insumo" onClick={handleNew} className="flex-shrink-0">
          <Plus className="w-4 h-4" />
          Registrar Despesa
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          id="input-busca-insumos"
          placeholder="Buscar por nome, categoria ou fornecedor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingDown className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhuma despesa encontrada</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente outro termo de busca' : 'Clique em "Registrar Despesa" para começar'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabela — Desktop */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-[#303030]">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#303030]">Categoria</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#303030] hidden md:table-cell">Fornecedor</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030]">Qtd / Unid</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030]">Custo Unit.</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030]">Total</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#303030] hidden lg:table-cell">Data</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/70 transition-colors duration-100"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#303030]">{item.nome}</p>
                      {item.descricao && (
                        <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.descricao}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={categoriaBadgeVariant[item.categoria] ?? 'muted'}>
                        {item.categoria}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                      {item.fornecedor ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#303030]">
                      {item.quantidade} {item.unidade}
                    </td>
                    <td className="px-4 py-3 text-right text-[#303030]">
                      {formatCurrency(item.custo_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#90323D]">
                      {formatCurrency(item.custo_total)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                      {formatDate(item.data_compra)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                          id={`btn-editar-insumo-${item.id}`}
                          aria-label={`Editar ${item.nome}`}
                        >
                          <Pencil className="w-4 h-4 text-gray-400" />
                        </Button>
                        <ConfirmDeleteDialog
                          itemName={item.nome}
                          onConfirm={() => handleDelete(item.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lista de Cards — Mobile */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100">
            {filtered.map((item) => (
              <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-[#303030] leading-snug">{item.nome}</p>
                    {item.fornecedor && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.fornecedor}</p>
                    )}
                  </div>
                  <Badge variant={categoriaBadgeVariant[item.categoria] ?? 'muted'} className="flex-shrink-0 text-xs">
                    {item.categoria}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-gray-500 block text-xs">Quantidade</span>
                    <span className="font-medium text-[#303030]">{item.quantidade} {item.unidade}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Unitário</span>
                    <span className="font-medium text-[#303030]">{formatCurrency(item.custo_unitario)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-bold text-[#90323D]">{formatCurrency(item.custo_total)}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      aria-label={`Editar ${item.nome}`}
                    >
                      <Pencil className="w-4 h-4 text-gray-400" />
                    </Button>
                    <ConfirmDeleteDialog
                      itemName={item.nome}
                      onConfirm={() => handleDelete(item.id)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
        )}
      </div>

      {/* Formulário (modal) */}
      <InsumoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSuccess={refresh}
        insumo={editItem}
      />
    </>
  )
}
