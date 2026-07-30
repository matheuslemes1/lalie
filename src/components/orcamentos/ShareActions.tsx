'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import {
  MessageCircle,
  Mail,
  Link2,
  Printer,
  Check,
} from 'lucide-react'

interface ShareActionsProps {
  numeroPedido: string
  clienteNome: string
  totalGeral: number
  clienteWhatsapp?: string | null
  clienteEmail?: string | null
}

export function ShareActions({
  numeroPedido,
  clienteNome,
  totalGeral,
  clienteWhatsapp,
  clienteEmail,
}: ShareActionsProps) {
  const [copied, setCopied] = useState(false)

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''

  const mensagemWhats = [
    `Olá *${clienteNome}*! 🎀`,
    `Aqui está o seu orçamento *${numeroPedido}* da *Laliê Papelaria*.`,
    ``,
    `💰 *Total: ${formatCurrency(totalGeral)}*`,
    ``,
    `📄 Para visualizar todos os detalhes, acesse o link:`,
    pageUrl,
  ].join('\n')

  const whatsappNumero = clienteWhatsapp?.replace(/\D/g, '') ?? ''
  const whatsappUrl = whatsappNumero
    ? `https://api.whatsapp.com/send?phone=55${whatsappNumero}&text=${encodeURIComponent(mensagemWhats)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhats)}`

  const emailSubject = `Orçamento ${numeroPedido} — Laliê Papelaria`
  const emailBody = [
    `Olá ${clienteNome},`,
    ``,
    `Segue o seu orçamento ${numeroPedido} da Laliê Papelaria.`,
    ``,
    `Total: ${formatCurrency(totalGeral)}`,
    ``,
    `Para visualizar todos os detalhes acesse:`,
    pageUrl,
    ``,
    `Qualquer dúvida estamos à disposição! 🎀`,
    ``,
    `Atenciosamente,`,
    `Laliê Papelaria`,
  ].join('\n')

  const emailTo = clienteEmail ?? ''
  const emailUrl = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* WhatsApp */}
      <Button
        id="btn-compartilhar-whatsapp"
        variant="ghost"
        size="sm"
        asChild
        className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 gap-2"
      >
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
      </Button>

      {/* E-mail */}
      <Button
        id="btn-compartilhar-email"
        variant="ghost"
        size="sm"
        asChild
        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 gap-2"
      >
        <a href={emailUrl}>
          <Mail className="w-4 h-4" />
          <span className="hidden sm:inline">E-mail</span>
        </a>
      </Button>

      {/* Copiar link */}
      <Button
        id="btn-copiar-link"
        variant="ghost"
        size="sm"
        onClick={copyLink}
        className={`gap-2 transition-colors ${
          copied
            ? 'text-emerald-600 hover:text-emerald-700'
            : 'text-gray-600 hover:text-gray-800'
        }`}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span className="hidden sm:inline">Copiado!</span>
          </>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span className="hidden sm:inline">Copiar link</span>
          </>
        )}
      </Button>

      {/* Divider visual */}
      <div className="hidden sm:block w-px h-6 bg-gray-200" />

      {/* Imprimir */}
      <Button
        id="btn-imprimir-orcamento"
        size="sm"
        onClick={() => window.print()}
        className="gap-2"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Imprimir</span>
      </Button>
    </div>
  )
}
