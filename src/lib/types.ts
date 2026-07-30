// Tipos compartilhados do banco de dados Supabase — Laliê Papelaria

export type InsumoCategoria =
  | 'Material'
  | 'Embalagem'
  | 'Conta Fixa'
  | 'Serviço'
  | 'Frete'
  | 'Outros'

export type ProdutoCategoria =
  | 'Caderno'
  | 'Crachá'
  | 'Convite'
  | 'Adesivo'
  | 'Kit'
  | 'Personalizado'
  | 'Outros'

export type PedidoStatus =
  | 'rascunho'
  | 'enviado'
  | 'confirmado'
  | 'cancelado'
  | 'concluido'

export type TipoPreco = 'convencional' | 'atacado'

// ─── Insumos ──────────────────────────────────────────────────

export interface Insumo {
  id: string
  nome: string
  categoria: InsumoCategoria
  descricao: string | null
  fornecedor: string | null
  quantidade: number
  unidade: string
  custo_unitario: number
  custo_total: number // coluna gerada
  data_compra: string // YYYY-MM-DD
  created_at: string
  updated_at: string
}

export type InsumoCriar = Omit<Insumo, 'id' | 'custo_total' | 'created_at' | 'updated_at'>
export type InsumoEditar = Partial<InsumoCriar>

// ─── Produtos ─────────────────────────────────────────────────

export interface Produto {
  id: string
  nome: string
  categoria: ProdutoCategoria
  descricao: string | null
  unidade: string
  custo_producao: number
  valor_convencional: number
  valor_atacado: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export type ProdutoCriar = Omit<Produto, 'id' | 'created_at' | 'updated_at'>
export type ProdutoEditar = Partial<ProdutoCriar>

// ─── Clientes ─────────────────────────────────────────────────

export interface Cliente {
  id: string
  nome: string
  telefone: string | null
  whatsapp: string | null
  email: string | null
  cep: string | null
  logradouro: string | null
  numero: string | null
  complemento: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export type ClienteCriar = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>
export type ClienteEditar = Partial<ClienteCriar>

// ─── Pedidos ──────────────────────────────────────────────────

export interface Pedido {
  id: string
  numero_pedido: string
  cliente_id: string | null
  cliente_nome_snapshot: string
  data_emissao: string
  data_evento: string | null
  data_envio: string | null
  informacoes_adicionais: string | null
  status: PedidoStatus
  total_geral: number
  created_at: string
  updated_at: string
}

export interface PedidoComCliente extends Pedido {
  cliente_telefone: string | null
  cliente_whatsapp: string | null
  cliente_cidade: string | null
  cliente_estado: string | null
}

export type PedidoCriar = Omit<Pedido, 'id' | 'numero_pedido' | 'created_at' | 'updated_at'>
export type PedidoEditar = Partial<PedidoCriar>

// ─── Itens do Pedido ──────────────────────────────────────────

export interface ItemPedido {
  id: string
  pedido_id: string
  produto_id: string | null
  produto_nome_snapshot: string
  quantidade: number
  tipo_preco: TipoPreco
  preco_unitario: number
  subtotal: number // coluna gerada
  observacao_item: string | null
  created_at: string
}

export type ItemPedidoCriar = Omit<ItemPedido, 'id' | 'subtotal' | 'created_at'>

// ─── ViaCEP ───────────────────────────────────────────────────

export interface ViaCEPResponse {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}
