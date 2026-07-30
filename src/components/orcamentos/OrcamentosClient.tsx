'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PedidoComCliente, PedidoStatus } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import {
  Plus,
  Search,
  FileText,
  Eye,
  Pencil,
} from 'lucide-react'

const statusConfig: Record<PedidoStatus, { label: string; variant: 'muted' | 'warning' | 'success' | 'default' | 'destructive' }> = {
  rascunho: { label: 'Rascunho', variant: 'muted' },
  enviado: { label: 'Enviado', variant: 'warning' },
  confirmado: { label: 'Confirmado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
  concluido: { label: 'Concluído', variant: 'default' },
}

interface OrcamentosClientProps {
  initialData: PedidoComCliente[]
}

export function OrcamentosClient({ initialData }: OrcamentosClientProps) {
  const router = useRouter()
  const [data, setData] = useState<PedidoComCliente[]>(initialData)
  const [search, setSearch] = useState('')

  const filtered = data.filter(
    (p) =>
      p.numero_pedido.toLowerCase().includes(search.toLowerCase()) ||
      p.cliente_nome_snapshot.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('pedidos').delete().eq('id', id)
    setData((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#303030]">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.length} orçamento{data.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <Button id="btn-novo-orcamento" asChild className="flex-shrink-0">
          <Link href="/orcamentos/novo">
            <Plus className="w-4 h-4" />
            Novo Orçamento
          </Link>
        </Button>
      </div>

      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <Input
          id="input-busca-orcamentos"
          placeholder="Buscar por número ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">Nenhum orçamento encontrado</p>
            <p className="text-sm text-gray-400 mt-1">
              {search ? 'Tente outro termo' : 'Clique em "Novo Orçamento" para criar'}
            </p>
          </div>
        ) : (
          <>
            {/* Tabela — Desktop */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-semibold text-[#303030]">Nº Pedido</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#303030]">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#303030] hidden md:table-cell">Emissão</th>
                    <th className="text-left px-4 py-3 font-semibold text-[#303030] hidden lg:table-cell">Evento</th>
                    <th className="text-center px-4 py-3 font-semibold text-[#303030]">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-[#303030]">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((item) => {
                    const status = statusConfig[item.status] ?? statusConfig.rascunho
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/70 transition-colors duration-100"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-[#90323D]">
                            {item.numero_pedido}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#303030]">{item.cliente_nome_snapshot}</p>
                          {item.cliente_cidade && (
                            <p className="text-xs text-gray-400">
                              {item.cliente_cidade}/{item.cliente_estado}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {formatDate(item.data_emissao)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                          {item.data_evento ? formatDate(item.data_evento) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={status.variant as never}>{status.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#303030]">
                          {formatCurrency(item.total_geral)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              aria-label={`Visualizar ${item.numero_pedido}`}
                            >
                              <Link href={`/orcamentos/${item.id}`}>
                                <Eye className="w-4 h-4 text-gray-400" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              aria-label={`Editar ${item.numero_pedido}`}
                            >
                              <Link href={`/orcamentos/${item.id}/editar`}>
                                <Pencil className="w-4 h-4 text-gray-400" />
                              </Link>
                            </Button>
                            <ConfirmDeleteDialog
                              itemName={item.numero_pedido}
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
                const status = statusConfig[item.status] ?? statusConfig.rascunho
                return (
                  <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono font-semibold text-[#90323D] block leading-none mb-1">
                          {item.numero_pedido}
                        </span>
                        <p className="font-medium text-[#303030] leading-snug">{item.cliente_nome_snapshot}</p>
                      </div>
                      <Badge variant={status.variant as never} className="flex-shrink-0 text-xs">
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-3">
                      <span className="text-gray-500">{formatDate(item.data_emissao)}</span>
                      <span className="font-bold text-[#303030]">{formatCurrency(item.total_geral)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/orcamentos/${item.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/orcamentos/${item.id}/editar`}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar
                        </Link>
                      </Button>
                      <ConfirmDeleteDialog
                        itemName={item.numero_pedido}
                        onConfirm={() => handleDelete(item.id)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}
