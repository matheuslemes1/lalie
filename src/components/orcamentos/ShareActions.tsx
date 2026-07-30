'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2, Printer, Loader2 } from 'lucide-react'

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
}: ShareActionsProps) {
  const [generating, setGenerating] = useState(false)
  const [canShareFile, setCanShareFile] = useState(false)

  useEffect(() => {
    // Check if the browser supports sharing files natively
    if (typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const file = new File([''], 'test.txt', { type: 'text/plain' })
        setCanShareFile(navigator.canShare({ files: [file] }))
      } catch (e) {
        setCanShareFile(false)
      }
    }
  }, [])

  async function generatePdf(): Promise<Blob | null> {
    const element = document.querySelector('.print-container') as HTMLElement
    if (!element) return null

    // Disable action buttons from appearing in the PDF if they are inside
    const noPrintElements = element.querySelectorAll('.no-print')
    noPrintElements.forEach(el => (el as HTMLElement).style.display = 'none')

    try {
      // Import dynamically to avoid SSR issues
      const domtoimage = (await import('dom-to-image-more')).default
      const { jsPDF } = await import('jspdf')
      
      // Convert the DOM element to a high-quality JPEG
      const dataUrl = await domtoimage.toJpeg(element, {
        quality: 0.98,
        bgcolor: '#ffffff',
        // Optional: improve resolution on high-DPI screens
        width: element.clientWidth * 2,
        height: element.clientHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
          width: element.clientWidth + 'px',
          height: element.clientHeight + 'px',
        }
      })

      // Generate the PDF
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      
      // Calculate height maintaining aspect ratio
      const imgProps = pdf.getImageProperties(dataUrl)
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      return pdf.output('blob')
    } finally {
      // Restore hidden elements
      noPrintElements.forEach(el => (el as HTMLElement).style.display = '')
    }
  }

  async function handleDownloadPdf() {
    setGenerating(true)
    try {
      const blob = await generatePdf()
      if (!blob) return

      // Create a link to download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Orcamento_${numeroPedido}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar o arquivo PDF.')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSharePdf() {
    setGenerating(true)
    try {
      const blob = await generatePdf()
      if (!blob) return

      const file = new File([blob], `Orcamento_${numeroPedido}.pdf`, { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Orçamento ${numeroPedido}`,
          text: `Olá ${clienteNome}, segue em anexo o seu orçamento da Laliê Papelaria.`,
        })
      } else {
        alert('Seu dispositivo/navegador não suporta compartilhamento direto de arquivos. O PDF será baixado.')
        handleDownloadPdf()
      }
    } catch (error) {
      console.error('Erro ao compartilhar PDF:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Compartilhar Nativo (Mobile) */}
      {canShareFile && (
        <Button
          id="btn-compartilhar"
          variant="default"
          size="sm"
          onClick={handleSharePdf}
          disabled={generating}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">Compartilhar WhatsApp/Email</span>
          <span className="inline sm:hidden">Compartilhar</span>
        </Button>
      )}

      {/* Baixar PDF */}
      <Button
        id="btn-baixar-pdf"
        variant={canShareFile ? "outline" : "default"}
        size="sm"
        onClick={handleDownloadPdf}
        disabled={generating}
        className={!canShareFile ? "bg-[#90323D] hover:bg-[#7a2a34] text-white gap-2" : "gap-2"}
      >
        {generating && !canShareFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        <span className="hidden sm:inline">Baixar PDF</span>
        <span className="inline sm:hidden">Baixar</span>
      </Button>

      {/* Divider visual */}
      <div className="hidden sm:block w-px h-6 bg-gray-200 ml-1 mr-1" />

      {/* Imprimir */}
      <Button
        id="btn-imprimir-orcamento"
        variant="ghost"
        size="sm"
        onClick={() => window.print()}
        disabled={generating}
        className="gap-2 text-gray-600 hover:text-gray-900"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">Imprimir</span>
      </Button>
    </div>
  )
}
