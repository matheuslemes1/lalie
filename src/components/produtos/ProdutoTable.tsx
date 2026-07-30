'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Produto } from '@/lib/types'
import { formatCurrency, calcMargin } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ProdutoForm } from './ProdutoForm'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { Plus, Pencil, Search, Package } from 'lucide-react'

interface ProdutoTableProps {
  initialData: Produto[]
}

export function ProdutoTable({ initialData }: ProdutoTableProps) {
  const [data, setData] = useState<Produto[]>(initialData)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Produto | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const filtered = data
    .filter((p) => showInactive || p.ativo)
    .filter(
      (p) =>
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        p.categoria.toLowerCase().includes(search.toLowerCase())
    )

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data: fresh } = await supabase
      .from('produtos')
      .select('*')
      .order('nome')
    if (fresh) setData(fresh as Produto[])
  }, [])

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('produtos').delete().eq('id', id)
    await refresh()
  }

  function handleEdit(item: Produto) {
    setEditItem(item)
    setFormOpen(true)
  }

  function handleNew() {
    setEditItem(null)
    setFormOpen(true)
  }

  function marginColor(pct: number) {
    if (pct >= 50) return 'text-emerald-600'
    if (pct >= 20) return 'text-amber-600'
    return 'text-red-500'
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#303030]">Produtos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} produto{filtered.length !== 1 ? 's' : ''} no catálogo
          </p>
        </div>
        <Button id="btn-novo-produto" onClick={handleNew} className="flex-shrink-0">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            id="input-busca-produtos"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none whitespace-nowrap">
          <input
            id="toggle-inativos"
            type="checkbox"
            className="accent-[#90323D]"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inativos
        </label>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente outro termo de busca' : 'Clique em "Novo Produto" para cadastrar'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabela — Desktop */}
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-semibold text-[#303030]">Produto</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#303030] hidden sm:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030]">Custo Prod.</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030]">Convencional</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030] hidden md:table-cell">Atacado</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#303030] hidden lg:table-cell">Margem Conv.</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#303030]">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((item) => {
                  const margin = calcMargin(item.custo_producao, item.valor_convencional)
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50/70 transition-colors duration-100 ${!item.ativo ? 'opacity-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#303030]">{item.nome}</p>
                        {item.descricao && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">
                            {item.descricao}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant="secondary">{item.categoria}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-[#303030]">
                        {formatCurrency(item.custo_producao)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#90323D]">
                        {formatCurrency(item.valor_convencional)}
                      </td>
                      <td className="px-4 py-3 text-right text-[#F8756C] hidden md:table-cell">
                        {formatCurrency(item.valor_atacado)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold hidden lg:table-cell ${marginColor(margin)}`}>
                        {margin}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={item.ativo ? 'success' : 'muted'}>
                          {item.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                            id={`btn-editar-produto-${item.id}`}
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
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Lista de Cards — Mobile */}
          <div className="sm:hidden flex flex-col divide-y divide-gray-100">
            {filtered.map((item) => {
              const margin = calcMargin(item.custo_producao, item.valor_convencional)
              return (
                <div key={item.id} className={`p-4 hover:bg-gray-50/50 transition-colors ${!item.ativo ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-[#303030] leading-snug">{item.nome}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">{item.categoria}</Badge>
                    </div>
                    <Badge variant={item.ativo ? 'success' : 'muted'} className="flex-shrink-0 text-xs">
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm mt-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-500 block text-xs">Custo de Produção</span>
                      <span className="font-medium text-[#303030]">{formatCurrency(item.custo_producao)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-xs">Margem</span>
                      <span className={`font-semibold ${marginColor(margin)}`}>{margin}%</span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-3">
                    <div>
                      <span className="text-gray-500 block text-xs">Convencional</span>
                      <span className="font-bold text-[#90323D]">{formatCurrency(item.valor_convencional)}</span>
                    </div>
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
              )
            })}
          </div>
        </>
        )}
      </div>

      {/* Formulário */}
      <ProdutoForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        onSuccess={refresh}
        produto={editItem}
      />
    </>
  )
}
