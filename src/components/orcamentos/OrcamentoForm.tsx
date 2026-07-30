'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Produto, Cliente, TipoPreco, Pedido, ItemPedido } from '@/lib/types'
import { formatCurrency, todayISO, cleanCEP } from '@/lib/utils'
import { buscarEnderecoPorCEP } from '@/lib/viacep'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Loader2, Search, MapPin } from 'lucide-react'

// ─── Schema de validação ─────────────────────────────────────

const itemSchema = z.object({
  produto_id: z.string().min(1, 'Selecione um produto'),
  produto_nome_snapshot: z.string(),
  tipo_preco: z.enum(['convencional', 'atacado']),
  preco_unitario: z.number().min(0),
  quantidade: z.coerce.number().int().positive('Quantidade deve ser ≥ 1'),
  observacao_item: z.string().optional(),
})

const schema = z.object({
  numero_pedido: z.string().min(1, 'Informe o número do pedido'),
  data_emissao: z.string().min(1, 'Informe a data de emissão'),
  data_evento: z.string().optional(),
  data_envio: z.string().optional(),
  status: z.enum(['rascunho', 'enviado', 'confirmado', 'cancelado', 'concluido']),
  informacoes_adicionais: z.string().optional(),
  // Cliente
  cliente_id: z.string().optional(),
  cliente_nome: z.string().min(2, 'Nome do cliente obrigatório'),
  cliente_telefone: z.string().optional(),
  cliente_whatsapp: z.string().optional(),
  cliente_email: z.string().optional(),
  cliente_cep: z.string().optional(),
  cliente_logradouro: z.string().optional(),
  cliente_numero: z.string().optional(),
  cliente_complemento: z.string().optional(),
  cliente_bairro: z.string().optional(),
  cliente_cidade: z.string().optional(),
  cliente_estado: z.string().optional(),
  // Itens
  itens: z.array(itemSchema).min(1, 'Adicione ao menos um item'),
})

type FormData = z.infer<typeof schema>

// ─── Props ───────────────────────────────────────────────────

interface OrcamentoFormProps {
  produtos: Produto[]
  clientes: Cliente[]
  pedido?: Pedido | null
  itensIniciais?: ItemPedido[]
  proximoNumero?: string
}

export function OrcamentoForm({
  produtos,
  clientes,
  pedido,
  itensIniciais,
  proximoNumero,
}: OrcamentoFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [cepLoading, setCepLoading] = useState(false)
  const [clienteSearch, setClienteSearch] = useState('')
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false)
  const isEditing = !!pedido

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero_pedido: pedido?.numero_pedido ?? proximoNumero ?? '',
      data_emissao: pedido?.data_emissao ?? todayISO(),
      data_evento: pedido?.data_evento ?? '',
      data_envio: pedido?.data_envio ?? '',
      status: pedido?.status ?? 'rascunho',
      informacoes_adicionais: pedido?.informacoes_adicionais ?? '',
      cliente_id: pedido?.cliente_id ?? '',
      cliente_nome: pedido?.cliente_nome_snapshot ?? '',
      cliente_telefone: '',
      cliente_whatsapp: '',
      cliente_email: '',
      cliente_cep: '',
      cliente_logradouro: '',
      cliente_numero: '',
      cliente_complemento: '',
      cliente_bairro: '',
      cliente_cidade: '',
      cliente_estado: '',
      itens: itensIniciais?.map((i) => ({
        produto_id: i.produto_id ?? '',
        produto_nome_snapshot: i.produto_nome_snapshot,
        tipo_preco: i.tipo_preco,
        preco_unitario: i.preco_unitario,
        quantidade: i.quantidade,
        observacao_item: i.observacao_item ?? '',
      })) ?? [{ produto_id: '', produto_nome_snapshot: '', tipo_preco: 'convencional', preco_unitario: 0, quantidade: 1, observacao_item: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'itens' })
  const itensWatch = watch('itens')

  // Cálculo do total geral em tempo real
  const totalGeral = itensWatch.reduce(
    (acc, item) => acc + (item.preco_unitario || 0) * (item.quantidade || 0),
    0
  )

  // Busca de CEP
  async function handleCEPBlur() {
    const cep = cleanCEP(watch('cliente_cep') ?? '')
    if (cep.length !== 8) return
    setCepLoading(true)
    const endereco = await buscarEnderecoPorCEP(cep)
    if (endereco) {
      setValue('cliente_logradouro', endereco.logradouro)
      setValue('cliente_bairro', endereco.bairro)
      setValue('cliente_cidade', endereco.localidade)
      setValue('cliente_estado', endereco.uf)
      if (endereco.complemento) setValue('cliente_complemento', endereco.complemento)
    }
    setCepLoading(false)
  }

  // Selecionar cliente existente
  function handleSelectCliente(cliente: Cliente) {
    setValue('cliente_id', cliente.id)
    setValue('cliente_nome', cliente.nome)
    setValue('cliente_telefone', cliente.telefone ?? '')
    setValue('cliente_whatsapp', cliente.whatsapp ?? '')
    setValue('cliente_email', cliente.email ?? '')
    setValue('cliente_cep', cliente.cep ?? '')
    setValue('cliente_logradouro', cliente.logradouro ?? '')
    setValue('cliente_numero', cliente.numero ?? '')
    setValue('cliente_complemento', cliente.complemento ?? '')
    setValue('cliente_bairro', cliente.bairro ?? '')
    setValue('cliente_cidade', cliente.cidade ?? '')
    setValue('cliente_estado', cliente.estado ?? '')
    setClienteSearch(cliente.nome)
    setShowClienteSuggestions(false)
  }

  // Ao selecionar produto no item
  function handleProdutoChange(index: number, produtoId: string, tipoPreco: TipoPreco) {
    const produto = produtos.find((p) => p.id === produtoId)
    if (!produto) return
    setValue(`itens.${index}.produto_id`, produtoId)
    setValue(`itens.${index}.produto_nome_snapshot`, produto.nome)
    const preco = tipoPreco === 'atacado' ? produto.valor_atacado : produto.valor_convencional
    setValue(`itens.${index}.preco_unitario`, preco)
  }

  function handleTipoPrecoChange(index: number, tipo: TipoPreco) {
    setValue(`itens.${index}.tipo_preco`, tipo)
    const produtoId = watch(`itens.${index}.produto_id`)
    if (produtoId) handleProdutoChange(index, produtoId, tipo)
  }

  const clientesFiltrados = clientes.filter((c) =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase())
  )

  async function onSubmit(data: FormData) {
    setServerError(null)
    const supabase = createClient()

    try {
      // 1. Upsert cliente
      let clienteId = data.cliente_id || null
      const clientePayload = {
        nome: data.cliente_nome,
        telefone: data.cliente_telefone || null,
        whatsapp: data.cliente_whatsapp || null,
        email: data.cliente_email || null,
        cep: data.cliente_cep || null,
        logradouro: data.cliente_logradouro || null,
        numero: data.cliente_numero || null,
        complemento: data.cliente_complemento || null,
        bairro: data.cliente_bairro || null,
        cidade: data.cliente_cidade || null,
        estado: data.cliente_estado || null,
      }

      if (clienteId) {
        await supabase.from('clientes').update(clientePayload).eq('id', clienteId)
      } else {
        const { data: novoCliente, error: clienteError } = await supabase
          .from('clientes')
          .insert(clientePayload)
          .select('id')
          .single()
        if (clienteError) throw new Error('Erro ao salvar cliente')
        clienteId = novoCliente.id
      }

      // 2. Upsert pedido
      const pedidoPayload = {
        numero_pedido: data.numero_pedido,
        cliente_id: clienteId,
        cliente_nome_snapshot: data.cliente_nome,
        data_emissao: data.data_emissao,
        data_evento: data.data_evento || null,
        data_envio: data.data_envio || null,
        informacoes_adicionais: data.informacoes_adicionais || null,
        status: data.status,
        total_geral: totalGeral,
      }

      let pedidoId: string
      if (isEditing) {
        const { error } = await supabase.from('pedidos').update(pedidoPayload).eq('id', pedido.id)
        if (error) throw new Error('Erro ao atualizar pedido')
        pedidoId = pedido.id
        // Deletar itens antigos antes de reinserir
        await supabase.from('itens_pedido').delete().eq('pedido_id', pedidoId)
      } else {
        const { data: novoPedido, error } = await supabase
          .from('pedidos')
          .insert(pedidoPayload)
          .select('id')
          .single()
        if (error) throw new Error('Erro ao criar pedido')
        pedidoId = novoPedido.id
      }

      // 3. Inserir itens
      const itensPayload = data.itens.map((item) => ({
        pedido_id: pedidoId,
        produto_id: item.produto_id || null,
        produto_nome_snapshot: item.produto_nome_snapshot,
        quantidade: item.quantidade,
        tipo_preco: item.tipo_preco,
        preco_unitario: item.preco_unitario,
        observacao_item: item.observacao_item || null,
      }))

      const { error: itensError } = await supabase.from('itens_pedido').insert(itensPayload)
      if (itensError) throw new Error('Erro ao salvar itens')

      router.push(`/orcamentos/${pedidoId}`)
      router.refresh()
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.')
    }
  }

  return (
    <form id="form-orcamento" onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">

      {/* ── Cabeçalho do Pedido ─────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#303030] mb-4 pb-2 border-b border-gray-100">
          Cabeçalho do Pedido
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="orcamento-numero">Nº do Pedido *</Label>
            <Input id="orcamento-numero" {...register('numero_pedido')} />
            {errors.numero_pedido && <p className="text-xs text-red-500">{errors.numero_pedido.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orcamento-status">Status</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="orcamento-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviado">Enviado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orcamento-emissao">Data de Emissão *</Label>
            <Input id="orcamento-emissao" type="date" {...register('data_emissao')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orcamento-evento">Data do Evento</Label>
            <Input id="orcamento-evento" type="date" {...register('data_evento')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="orcamento-envio">Data de Envio</Label>
            <Input id="orcamento-envio" type="date" {...register('data_envio')} />
          </div>
        </div>
      </section>

      {/* ── Dados do Cliente ─────────────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#303030] mb-4 pb-2 border-b border-gray-100">
          Dados do Cliente
        </h2>

        {/* Busca de cliente existente */}
        <div className="mb-4 relative">
          <Label htmlFor="busca-cliente">Buscar cliente cadastrado</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              id="busca-cliente"
              placeholder="Digite o nome do cliente..."
              value={clienteSearch}
              onChange={(e) => { setClienteSearch(e.target.value); setShowClienteSuggestions(true) }}
              onFocus={() => setShowClienteSuggestions(true)}
              className="pl-10"
            />
          </div>
          {showClienteSuggestions && clienteSearch.length > 0 && clientesFiltrados.length > 0 && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {clientesFiltrados.slice(0, 8).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCliente(c)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#90323D]/5 hover:text-[#90323D] transition-colors"
                >
                  <p className="font-medium text-[#303030]">{c.nome}</p>
                  {c.cidade && <p className="text-xs text-gray-400">{c.cidade}/{c.estado}</p>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cliente-nome">Nome completo *</Label>
            <Input id="cliente-nome" placeholder="Nome do cliente" {...register('cliente_nome')} />
            {errors.cliente_nome && <p className="text-xs text-red-500">{errors.cliente_nome.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-whatsapp">WhatsApp</Label>
            <Input id="cliente-whatsapp" placeholder="(00) 00000-0000" {...register('cliente_whatsapp')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-telefone">Telefone</Label>
            <Input id="cliente-telefone" placeholder="(00) 0000-0000" {...register('cliente_telefone')} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cliente-email">E-mail</Label>
            <Input id="cliente-email" type="email" placeholder="email@exemplo.com" {...register('cliente_email')} />
          </div>

          {/* CEP com busca automática */}
          <div className="space-y-1.5">
            <Label htmlFor="cliente-cep">CEP</Label>
            <div className="relative">
              <Input
                id="cliente-cep"
                placeholder="00000-000"
                {...register('cliente_cep')}
                onBlur={handleCEPBlur}
                maxLength={9}
              />
              {cepLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#90323D]" />
                </div>
              )}
            </div>
            {cepLoading && (
              <p className="text-xs text-[#90323D] flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Buscando endereço...
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-numero">Número</Label>
            <Input id="cliente-numero" placeholder="123" {...register('cliente_numero')} />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cliente-logradouro">Logradouro</Label>
            <Input id="cliente-logradouro" placeholder="Rua, Avenida..." {...register('cliente_logradouro')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-complemento">Complemento</Label>
            <Input id="cliente-complemento" placeholder="Apto, Bloco..." {...register('cliente_complemento')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-bairro">Bairro</Label>
            <Input id="cliente-bairro" {...register('cliente_bairro')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-cidade">Cidade</Label>
            <Input id="cliente-cidade" {...register('cliente_cidade')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cliente-estado">UF</Label>
            <Input id="cliente-estado" maxLength={2} className="uppercase" {...register('cliente_estado')} />
          </div>
        </div>
      </section>

      {/* ── Tabela Dinâmica de Itens ──────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 gap-3">
          <h2 className="text-base font-semibold text-[#303030]">Itens do Pedido</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            id="btn-adicionar-item"
            onClick={() => append({
              produto_id: '',
              produto_nome_snapshot: '',
              tipo_preco: 'convencional',
              preco_unitario: 0,
              quantidade: 1,
              observacao_item: '',
            })}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Adicionar Item</span>
            <span className="sm:hidden">Item</span>
          </Button>
        </div>

        {errors.itens?.root && (
          <p className="text-sm text-red-500 mb-3">{errors.itens.root.message}</p>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => {
            const itemWatch = itensWatch[index]
            const subtotal = (itemWatch?.preco_unitario || 0) * (itemWatch?.quantidade || 0)

            return (
              <div
                key={field.id}
                className="border border-gray-100 rounded-lg p-4 bg-gray-50/50 space-y-3 relative"
              >
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Remover item"
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pr-8">
                  {/* Produto — full width no mobile */}
                  <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor={`item-produto-${index}`}>Produto *</Label>
                    <Controller
                      control={control}
                      name={`itens.${index}.produto_id`}
                      render={({ field: f }) => (
                        <Select
                          value={f.value}
                          onValueChange={(v) => handleProdutoChange(index, v, watch(`itens.${index}.tipo_preco`))}
                        >
                          <SelectTrigger id={`item-produto-${index}`}>
                            <SelectValue placeholder="Selecione o produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {produtos.filter(p => p.ativo).map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.itens?.[index]?.produto_id && (
                      <p className="text-xs text-red-500">{errors.itens[index]?.produto_id?.message}</p>
                    )}
                  </div>

                  {/* Tipo de Preço */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`item-tipo-${index}`}>Tipo de Preço</Label>
                    <Controller
                      control={control}
                      name={`itens.${index}.tipo_preco`}
                      render={({ field: f }) => (
                        <Select
                          value={f.value}
                          onValueChange={(v) => handleTipoPrecoChange(index, v as TipoPreco)}
                        >
                          <SelectTrigger id={`item-tipo-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="convencional">Convencional</SelectItem>
                            <SelectItem value="atacado">Atacado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-1.5">
                    <Label htmlFor={`item-qtd-${index}`}>Quantidade *</Label>
                    <Input
                      id={`item-qtd-${index}`}
                      type="number"
                      min="1"
                      {...register(`itens.${index}.quantidade`)}
                    />
                    {errors.itens?.[index]?.quantidade && (
                      <p className="text-xs text-red-500">{errors.itens[index]?.quantidade?.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Preço Unitário (readonly) */}
                  <div className="space-y-1.5">
                    <Label>Preço Unitário</Label>
                    <div className="flex items-center h-10 px-3 bg-white border border-gray-200 rounded-md">
                      <span className="text-[#303030] font-medium">
                        {formatCurrency(itemWatch?.preco_unitario || 0)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ({watch(`itens.${index}.tipo_preco`) === 'atacado' ? 'atacado' : 'convencional'})
                      </span>
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="space-y-1.5">
                    <Label>Subtotal</Label>
                    <div className="flex items-center h-10 px-3 bg-[#90323D]/5 border border-[#90323D]/15 rounded-md">
                      <span className="font-bold text-[#90323D]">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observação do item */}
                <div className="space-y-1.5">
                  <Label htmlFor={`item-obs-${index}`}>Observação (personalização)</Label>
                  <Input
                    id={`item-obs-${index}`}
                    placeholder="Ex: Nomes nas capas: Ana, Bruno, Carlos"
                    {...register(`itens.${index}.observacao_item`)}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Total geral */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <div className="bg-[#90323D] text-white rounded-xl px-6 py-3 text-right">
            <p className="text-xs text-white/70">Total Geral</p>
            <p className="text-2xl font-bold">{formatCurrency(totalGeral)}</p>
          </div>
        </div>
      </section>

      {/* ── Informações Adicionais ───────────────────────────── */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#303030] mb-4 pb-2 border-b border-gray-100">
          Informações Adicionais / Personalização
        </h2>
        <Textarea
          id="orcamento-obs"
          placeholder="Ex: Nomes para as capas dos cadernos, cores específicas, referências de design..."
          rows={4}
          {...register('informacoes_adicionais')}
        />
      </section>

      {/* ── Erros e Ações ───────────────────────────────────── */}
      {serverError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/orcamentos')}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          id="btn-salvar-orcamento"
          disabled={isSubmitting}
          className="min-w-[160px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
        </Button>
      </div>
    </form>
  )
}
