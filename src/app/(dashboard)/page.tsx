import { createClient } from '@/lib/supabase/server'
import {
  TrendingDown,
  Package,
  FileText,
  DollarSign,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

async function getDashboardStats() {
  const supabase = await createClient()

  const [insumos, produtos, pedidos] = await Promise.all([
    supabase.from('insumos').select('custo_total'),
    supabase.from('produtos').select('id', { count: 'exact', head: true }),
    supabase.from('pedidos').select('total_geral, status'),
  ])

  const totalGastos = (insumos.data ?? []).reduce(
    (acc, i) => acc + (i.custo_total ?? 0),
    0
  )
  const totalProdutos = produtos.count ?? 0
  const totalOrcamentos = (pedidos.data ?? []).length
  const totalFaturamento = (pedidos.data ?? [])
    .filter((p) => p.status === 'confirmado' || p.status === 'concluido')
    .reduce((acc, p) => acc + (p.total_geral ?? 0), 0)

  return { totalGastos, totalProdutos, totalOrcamentos, totalFaturamento }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const cards = [
    {
      label: 'Total em Gastos',
      value: formatCurrency(stats.totalGastos),
      icon: TrendingDown,
      color: 'bg-red-50 text-red-600',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Produtos Cadastrados',
      value: stats.totalProdutos.toString(),
      icon: Package,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Orçamentos Criados',
      value: stats.totalOrcamentos.toString(),
      icon: FileText,
      color: 'bg-amber-50 text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Faturamento Confirmado',
      value: formatCurrency(stats.totalFaturamento),
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100',
    },
  ]

  return (
    <div className="animate-fade-in">
      {/* Cabeçalho */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#303030]">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral do sistema Laliê Papelaria
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-[#303030]">
                    {card.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg ${card.iconBg}`}>
                  <Icon className={`w-5 h-5 ${card.color.split(' ')[1]}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Acesso rápido */}
      <div className="mt-8">
        <h2 className="text-base font-semibold text-[#303030] mb-4">
          Acesso Rápido
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: '/insumos/novo', label: 'Registrar Gasto', desc: 'Adicionar despesa ou compra' },
            { href: '/produtos/novo', label: 'Novo Produto', desc: 'Cadastrar item no catálogo' },
            { href: '/orcamentos/novo', label: 'Novo Orçamento', desc: 'Criar pedido para cliente' },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="group bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:border-[#90323D]/30 hover:shadow-md transition-all duration-200"
            >
              <p className="font-semibold text-[#90323D] group-hover:text-[#6e2530] transition-colors">
                {action.label}
              </p>
              <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
