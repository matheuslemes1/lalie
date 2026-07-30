'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha inválidos. Tente novamente.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#90323D] via-[#7a2a34] to-[#5c1e27] flex items-center justify-center p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#F8756C]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/logo.jpeg" alt="Laliê Papelaria" className="h-16 w-auto mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-[#303030]">Laliê Papelaria</h1>
            <p className="text-sm text-gray-500 mt-1">Painel Administrativo</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5" id="form-login">
            <div className="space-y-1.5">
              <Label htmlFor="input-email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="input-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="input-password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="input-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div
                id="login-error"
                role="alert"
                className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
              >
                {error}
              </div>
            )}

            <Button
              id="btn-entrar"
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Rodapé */}
          <p className="text-xs text-center text-gray-400 mt-6">
            Sistema de uso interno — acesso restrito
          </p>
        </div>
      </div>
    </div>
  )
}
