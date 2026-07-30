import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pedido, ItemPedido, Cliente } from '@/lib/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShareActions } from '@/components/orcamentos/ShareActions'
import { Pencil, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('pedidos').select('numero_pedido').eq('id', id).single()
  return { title: data ? `Orçamento ${data.numero_pedido}` : 'Orçamento' }
}

const statusLabel: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  concluido: 'Concluído',
}

export default async function VisualizarOrcamentoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: pedido }, { data: itens }] = await Promise.all([
    supabase.from('pedidos').select('*').eq('id', id).single(),
    supabase.from('itens_pedido').select('*').eq('pedido_id', id).order('created_at'),
  ])

  if (!pedido) notFound()

  let cliente: Cliente | null = null
  if (pedido.cliente_id) {
    const { data } = await supabase.from('clientes').select('*').eq('id', pedido.cliente_id).single()
    cliente = data as Cliente | null
  }

  const p = pedido as Pedido
  const itensList = (itens ?? []) as ItemPedido[]

  return (
    <div className="animate-fade-in">

      {/* ── Barra de ações — oculta na impressão ────────────────── */}
      <div className="no-print mb-6 space-y-3">
        {/* Linha 1: Voltar + Editar */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/orcamentos">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orcamentos/${id}/editar`}>
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
          </Button>
        </div>

        {/* Linha 2: Compartilhar / Imprimir */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-500 hidden sm:block">Enviar orçamento:</p>
          <ShareActions
            numeroPedido={p.numero_pedido}
            clienteNome={p.cliente_nome_snapshot}
            totalGeral={p.total_geral}
            clienteWhatsapp={cliente?.whatsapp}
            clienteEmail={cliente?.email}
          />
        </div>
      </div>

      {/* ── DOCUMENTO DO ORÇAMENTO ──────────────────────────────── */}
      <div className="overflow-x-auto pb-4">
        <div className="print-container bg-white rounded-xl shadow-sm border border-gray-100 p-8 lg:p-12 max-w-4xl mx-auto min-w-[700px]">

          {/* Cabeçalho */}
          <header className="flex flex-row items-start justify-between gap-4 pb-6 border-b-2 border-[#90323D]">
          <div className="flex items-center gap-3">
            {/*
              Substitua por <img src="/logo.png" alt="Laliê Papelaria" className="h-14 w-auto" />
              quando tiver a logo disponível.
            */}
            <div className="w-14 h-14 rounded-xl bg-[#90323D] flex items-center justify-center flex-shrink-0">
              <img src="/logo.jpeg" alt="Laliê Papelaria" className="h-16 w-auto" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#90323D]">Laliê</h1>
              <p className="text-sm text-gray-500">Papelaria Personalizada</p>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={p.status === 'confirmado' ? 'success' : p.status === 'cancelado' ? 'destructive' : 'secondary'}>
                {statusLabel[p.status]}
              </Badge>
              <span className="font-mono text-xl font-bold text-[#303030]">{p.numero_pedido}</span>
            </div>
            <p className="text-sm text-gray-500">
              Emissão: <strong className="text-[#303030]">{formatDate(p.data_emissao)}</strong>
            </p>
            {p.data_evento && (
              <p className="text-sm text-gray-500">
                Evento: <strong className="text-[#303030]">{formatDate(p.data_evento)}</strong>
              </p>
            )}
            {p.data_envio && (
              <p className="text-sm text-gray-500">
                Envio: <strong className="text-[#303030]">{formatDate(p.data_envio)}</strong>
              </p>
            )}
          </div>
        </header>

        {/* Dados do cliente */}
        <section className="mt-6 mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Cliente
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-base font-semibold text-[#303030]">{p.cliente_nome_snapshot}</p>
            {cliente && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-sm text-gray-600">
                {cliente.whatsapp && <p>📱 WhatsApp: {cliente.whatsapp}</p>}
                {cliente.telefone && <p>📞 Tel: {cliente.telefone}</p>}
                {cliente.email && <p>✉️ {cliente.email}</p>}
                {cliente.logradouro && (
                  <p className="col-span-2">
                    📍 {cliente.logradouro}{cliente.numero ? `, ${cliente.numero}` : ''}
                    {cliente.complemento ? ` — ${cliente.complemento}` : ''}
                    {cliente.bairro ? `, ${cliente.bairro}` : ''}
                    {cliente.cidade ? ` — ${cliente.cidade}` : ''}
                    {cliente.estado ? `/${cliente.estado}` : ''}
                    {cliente.cep ? ` — CEP ${cliente.cep}` : ''}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Tabela de itens */}
        <section className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Itens do Pedido
          </h2>

          {/* Tabela de itens — Sempre desktop para PDF */}
          <div className="block overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#90323D]">
                  <th className="text-left px-4 py-3 font-semibold text-white">Produto</th>
                  <th className="text-center px-4 py-3 font-semibold text-white">Tipo</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Qtd</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Unit.</th>
                  <th className="text-right px-4 py-3 font-semibold text-white">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itensList.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#303030]">{item.produto_nome_snapshot}</p>
                      {item.observacao_item && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">{item.observacao_item}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={item.tipo_preco === 'atacado' ? 'coral' : 'secondary'}>
                        {item.tipo_preco === 'atacado' ? 'Atacado' : 'Conv.'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-[#303030]">{item.quantidade}</td>
                    <td className="px-4 py-3 text-right text-[#303030]">
                      {formatCurrency(item.preco_unitario)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#90323D]">
                      {formatCurrency(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#90323D]/5 border-t-2 border-[#90323D]/20">
                  <td colSpan={4} className="px-4 py-4 text-right font-semibold text-[#303030]">
                    TOTAL GERAL
                  </td>
                  <td className="px-4 py-4 text-right text-xl font-bold text-[#90323D]">
                    {formatCurrency(p.total_geral)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* Informações adicionais */}
        {p.informacoes_adicionais && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Informações Adicionais / Personalização
            </h2>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{p.informacoes_adicionais}</p>
            </div>
          </section>
        )}

        {/* Rodapé */}
        <footer className="border-t border-gray-200 pt-5 text-center">
          <p className="text-xs text-gray-400">
            Orçamento gerado em {new Date().toLocaleDateString('pt-BR')} — Laliê Papelaria
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Este documento é um orçamento e não tem valor fiscal.
          </p>
        </footer>
      </div> {/* fim print-container */}
      </div> {/* fim overflow-x-auto */}
    </div>
  )
}
