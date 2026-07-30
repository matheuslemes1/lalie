import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formata número como moeda brasileira (BRL) */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/** Formata data ISO para DD/MM/AAAA */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/** Retorna a data de hoje no formato YYYY-MM-DD (input date) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

/** Calcula margem de lucro em % */
export function calcMargin(custo: number, venda: number): number {
  if (custo <= 0) return 0
  return Math.round(((venda - custo) / custo) * 100)
}

/** Formata CEP no padrão 00000-000 */
export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
}

/** Remove formatação de CEP para consulta */
export function cleanCEP(cep: string): string {
  return cep.replace(/\D/g, '')
}

/** Formata número de telefone padrão (00) 00000-0000 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return ''
  let v = value.replace(/\D/g, '')
  if (v.length > 11) v = v.slice(0, 11)
  
  if (v.length > 10) {
    v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  } else if (v.length > 6) {
    v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3')
  } else if (v.length > 2) {
    v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2')
  } else if (v.length > 0) {
    v = v.replace(/^(\d*)$/, '($1')
  }
  return v
}
