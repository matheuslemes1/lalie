'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Produto, ProdutoCategoria } from '@/lib/types'
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
import { formatCurrency, calcMargin } from '@/lib/utils'

const categorias: ProdutoCategoria[] = [
  'Caderno',
  'Crachá',
  'Convite',
  'Adesivo',
  'Kit',
  'Personalizado',
  'Outros',
]

const unidades = ['un', 'kit', 'par', 'caixa', 'pacote']

const schema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  descricao: z.string().optional(),
  unidade: z.string().min(1, 'Selecione a unidade'),
  custo_producao: z.coerce.number().min(0, 'Custo não pode ser negativo'),
  valor_convencional: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  valor_atacado: z.coerce.number().min(0, 'Valor não pode ser negativo'),
  ativo: z.boolean(),
})

type FormData = z.infer<typeof schema>

interface ProdutoFormProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  produto?: Produto | null
}

export function ProdutoForm({ open, onClose, onSuccess, produto }: ProdutoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const isEditing = !!produto

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
      nome: produto?.nome ?? '',
      categoria: produto?.categoria ?? '',
      descricao: produto?.descricao ?? '',
      unidade: produto?.unidade ?? 'un',
      custo_producao: produto?.custo_producao ?? 0,
      valor_convencional: produto?.valor_convencional ?? 0,
      valor_atacado: produto?.valor_atacado ?? 0,
      ativo: produto?.ativo ?? true,
    },
  })

  const custoProducao = watch('custo_producao') || 0
  const valorConvencional = watch('valor_convencional') || 0
  const valorAtacado = watch('valor_atacado') || 0

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
      categoria: data.categoria as ProdutoCategoria,
      descricao: data.descricao || null,
      unidade: data.unidade,
      custo_producao: data.custo_producao,
      valor_convencional: data.valor_convencional,
      valor_atacado: data.valor_atacado,
      ativo: data.ativo,
    }

    let error
    if (isEditing) {
      ;({ error } = await supabase.from('produtos').update(payload).eq('id', produto.id))
    } else {
      ;({ error } = await supabase.from('produtos').insert(payload))
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
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>

        <form id="form-produto" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="produto-nome">Nome do Produto *</Label>
            <Input
              id="produto-nome"
              placeholder="Ex: Caderno A5 Personalizado"
              {...register('nome')}
            />
            {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
          </div>

          {/* Categoria + Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="produto-categoria">Categoria *</Label>
              <Select
                defaultValue={produto?.categoria}
                onValueChange={(v) => setValue('categoria', v)}
              >
                <SelectTrigger id="produto-categoria">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="produto-unidade">Unidade *</Label>
              <Select
                defaultValue={produto?.unidade ?? 'un'}
                onValueChange={(v) => setValue('unidade', v)}
              >
                <SelectTrigger id="produto-unidade">
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

          {/* Preços */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#303030] border-b border-gray-100 pb-1">
              Precificação
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="produto-custo">Custo de Produção (R$) *</Label>
              <Input
                id="produto-custo"
                type="number"
                step="0.01"
                min="0"
                {...register('custo_producao')}
              />
              {errors.custo_producao && <p className="text-xs text-red-500">{errors.custo_producao.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="produto-conv">Valor Convencional (R$) *</Label>
                <Input
                  id="produto-conv"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_convencional')}
                />
                {errors.valor_convencional && <p className="text-xs text-red-500">{errors.valor_convencional.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="produto-atacado">Valor Atacado (R$) *</Label>
                <Input
                  id="produto-atacado"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('valor_atacado')}
                />
                {errors.valor_atacado && <p className="text-xs text-red-500">{errors.valor_atacado.message}</p>}
              </div>
            </div>

            {/* Preview de margens */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#90323D]/5 border border-[#90323D]/15 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">Margem Convencional</p>
                <p className="font-bold text-[#90323D]">
                  {calcMargin(custoProducao, valorConvencional)}%
                </p>
                <p className="text-xs text-gray-400">{formatCurrency(valorConvencional - custoProducao)} lucro</p>
              </div>
              <div className="bg-[#F8756C]/5 border border-[#F8756C]/15 rounded-lg px-3 py-2">
                <p className="text-xs text-gray-500">Margem Atacado</p>
                <p className="font-bold text-[#F8756C]">
                  {calcMargin(custoProducao, valorAtacado)}%
                </p>
                <p className="text-xs text-gray-400">{formatCurrency(valorAtacado - custoProducao)} lucro</p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label htmlFor="produto-descricao">Descrição</Label>
            <Textarea
              id="produto-descricao"
              placeholder="Detalhes do produto (opcional)"
              rows={2}
              {...register('descricao')}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-2">
            <input
              id="produto-ativo"
              type="checkbox"
              className="w-4 h-4 accent-[#90323D]"
              {...register('ativo')}
            />
            <Label htmlFor="produto-ativo" className="cursor-pointer">
              Produto ativo (disponível para orçamentos)
            </Label>
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{serverError}</p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" form="form-produto" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Produto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
