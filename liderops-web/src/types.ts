export type Perfil = 'admin' | 'comum';

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  cargo: string;
  perfil: Perfil;
  criado_em?: string;
}

export interface LeadEmpresa {
  id_empresa?: number;
  cnpj: string;
  razao_social: string;
  endereco: string;
  cnae: string;
  status_sincronizacao?: string;
  criado_em?: string;
}

export type StatusTarefa = 'aguardando' | 'em_andamento' | 'concluida';
export type Prioridade = 'baixa' | 'media' | 'alta';

export interface Tarefa {
  id_tarefa: number;
  titulo: string;
  descricao: string | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  prazo: string | null;
  oculta: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface RespostaSessao {
  mensagem: string;
  token: string;
  usuario: Usuario;
}
