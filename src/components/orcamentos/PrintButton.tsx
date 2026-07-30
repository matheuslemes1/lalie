'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <Button
      id="btn-imprimir-orcamento"
      onClick={() => window.print()}
      className="bg-[#90323D] hover:bg-[#6e2530] text-white"
    >
      <Printer className="w-4 h-4" />
      Imprimir
    </Button>
  )
}
