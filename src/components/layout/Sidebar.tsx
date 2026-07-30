'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    href: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/insumos',
    label: 'Despesas',
    icon: ShoppingBag,
    description: 'Gastos e insumos',
  },
  {
    href: '/produtos',
    label: 'Produtos',
    icon: Package,
    description: 'Catálogo de vendas',
  },
  {
    href: '/orcamentos',
    label: 'Orçamentos',
    icon: FileText,
    description: 'Gerador de pedidos',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo / Marca */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#90323D] flex items-center justify-center flex-shrink-0">
            <img src="/logo.jpeg" alt="Laliê Papelaria" className="h-auto w-auto" />
          </div>
          <div>
            <p className="text-[#303030] font-bold text-base leading-tight">Laliê</p>
            <p className="text-gray-500 text-xs">Papelaria</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#90323D]/10 text-[#90323D]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#303030]'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-transform duration-150',
                  isActive ? 'text-[#90323D]' : 'text-gray-400 group-hover:text-gray-600',
                  isActive && 'scale-110'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className={cn('truncate', isActive ? 'text-[#90323D] font-semibold' : '')}>{item.label}</p>
                {item.description && (
                  <p className={cn('text-xs truncate', isActive ? 'text-[#90323D]/70' : 'text-gray-400')}>{item.description}</p>
                )}
              </div>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-[#90323D]/50 flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Rodapé — logout */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-4">
        <button
          id="btn-logout"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-[#303030] transition-all duration-150 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-gray-400" />
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-white border-r border-gray-100 z-30">
        <NavContent />
      </aside>

      {/* Botão menu mobile */}
      <button
        id="btn-menu-mobile"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-white border border-gray-200 text-[#303030] shadow-sm hover:bg-gray-50"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar Mobile — drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-white shadow-2xl lg:hidden animate-slide-in-left">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </>
      )}
    </>
  )
}
