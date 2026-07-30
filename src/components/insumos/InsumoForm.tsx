'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Insumo, InsumoCategoria } from '@/lib/types'
import { todayISO } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const categorias: InsumoCategoria[] = [
  'Material',
  'Embalagem',
  'Conta Fixa',
  'Serviço',
  'Frete',
  'Outros',
]

const unidades = ['un', 'kg', 'metro', 'resma', 'pacote', 'caixa', 'rolo', 'litro']

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  descricao: z.string().optional(),
  fornecedor: z.string().optional(),
  quantidade: z.coerce.number().positive('Quantidade deve ser positiva'),
  unidade: z.string().min(1, 'Selecione uma unidade'),
  custo_unitario: z.coerce.number().min(0, 'Custo não pode ser negativo'),
  data_compra: z.string().min(1, 'Selecione a data'),
})

type FormData = z.infer<typeof schema>

interface InsumoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  insumo?: Insumo | null
}

export function InsumoForm({ open, onClose, onSuccess, insumo }: InsumoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!insumo

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: insumo?.nome ?? '',
      categoria: insumo?.categoria ?? '',
      descricao: insumo?.descricao ?? '',
      fornecedor: insumo?.fornecedor ?? '',
      quantidade: insumo?.quantidade ?? 1,
      unidade: insumo?.unidade ?? 'un',
      custo_unitario: insumo?.custo_unitario ?? 0,
      data_compra: insumo?.data_compra ?? todayISO(),
    },
  })

  // Reset quando o modal abrir com novo insumo
  const handleClose = () => {
    reset()
    setServerError(null)
    onClose()
  }

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    const payload = {
      nome: data.nome,
      categoria: data.categoria as InsumoCategoria,
      descricao: data.descricao || null,
      fornecedor: data.fornecedor || null,
      quantidade: data.quantidade,
      unidade: data.unidade,
      custo_unitario: data.custo_unitario,
      data_compra: data.data_compra,
    }

    let error
    if (isEditing) {
      ;({ error } = await supabase.from('insumos').update(payload).eq('id', insumo.id))
    } else {
      ;({ error } = await supabase.from('insumos').insert(payload))
    }

    if (error) {
      setServerError('Erro ao salvar. Tente novamente.')
      return
    }

    reset()
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Despesa' : 'Registrar Despesa'}
          </DialogTitle>
        </DialogHeader>

        <form id="form-insumo" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="insumo-nome">Nome *</Label>
            <Input
              id="insumo-nome"
              placeholder="Ex: Fita adesiva larga"
              {...register('nome')}
            />
            {errors.nome && (
              <p className="text-xs text-red-500">{errors.nome.message}</p>
            )}
          </div>

          {/* Categoria + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="insumo-categoria">Categoria *</Label>
              <Select
                defaultValue={insumo?.categoria}
                onValueChange={(v) => setValue('categoria', v)}
              >
                <SelectTrigger id="insumo-categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-xs text-red-500">{errors.categoria.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="insumo-unidade">Unidade *</Label>
              <Select
                defaultValue={insumo?.unidade ?? 'un'}
                onValueChange={(v) => setValue('unidade', v)}
              >
                <SelectTrigger id="insumo-unidade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantidade + Custo Unitário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="insumo-quantidade">Quantidade *</Label>
              <Input
                id="insumo-quantidade"
                type="number"
                step="0.001"
                min="0"
                {...register('quantidade')}
              />
              {errors.quantidade && (
                <p className="text-xs text-red-500">{errors.quantidade.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="insumo-custo">Custo Unitário (R$) *</Label>
              <Input
                id="insumo-custo"
                type="number"
                step="0.01"
                min="0"
                {...register('custo_unitario')}
              />
              {errors.custo_unitario && (
                <p className="text-xs text-red-500">{errors.custo_unitario.message}</p>
              )}
            </div>
          </div>

          {/* Custo total calculado (exibição) */}
          <div className="bg-[#90323D]/5 border border-[#90323D]/20 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500">Custo Total</p>
            <p className="text-lg font-bold text-[#90323D]">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format((watch('quantidade') || 0) * (watch('custo_unitario') || 0))}
            </p>
          </div>

          {/* Fornecedor */}
          <div className="space-y-1.5">
            <Label htmlFor="insumo-fornecedor">Fornecedor</Label>
            <Input
              id="insumo-fornecedor"
              placeholder="Nome do fornecedor (opcional)"
              {...register('fornecedor')}
            />
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <Label htmlFor="insumo-data">Data da Compra *</Label>
            <Input
              id="insumo-data"
              type="date"
              {...register('data_compra')}
            />
            {errors.data_compra && (
              <p className="text-xs text-red-500">{errors.data_compra.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="insumo-descricao">Observações</Label>
            <Textarea
              id="insumo-descricao"
              placeholder="Notas adicionais (opcional)"
              rows={2}
              {...register('descricao')}
            />
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{serverError}</p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="form-insumo" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Registrar Despesa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
