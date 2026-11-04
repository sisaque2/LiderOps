import type { Usuario } from '../types';

// Em dev aponta para a API local; no build de produção a API serve o front, então usa o mesmo domínio
export const API_URL: string =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

export const EVENTO_SESSAO_EXPIRADA = 'liderops:sessao-expirada';

const TOKEN_KEY = 'liderops_token';
const USER_KEY = 'liderops_user';

export const sessao = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  getUsuario(): Usuario | null {
    try {
      const salvo = localStorage.getItem(USER_KEY);
      return salvo ? (JSON.parse(salvo) as Usuario) : null;
    } catch {
      return null;
    }
  },
  salvar(token: string, usuario: Usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  atualizarUsuario(usuario: Usuario) {
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  },
  limpar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.status = status;
  }
}

async function requisitar(caminho: string, opcoes: RequestInit = {}): Promise<Response> {
  const token = sessao.getToken();
  const headers = new Headers(opcoes.headers);
  // FormData (upload) precisa que o navegador monte o Content-Type com o boundary do multipart
  if (opcoes.body && !(opcoes.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, { ...opcoes, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o servidor está rodando.');
  }

  // Token vencido ou inválido: derruba a sessão e avisa o App para voltar ao login
  if (resposta.status === 401 && token) {
    sessao.limpar();
    window.dispatchEvent(new Event(EVENTO_SESSAO_EXPIRADA));
  }

  if (!resposta.ok) {
    let mensagem = `Erro ${resposta.status} na requisição.`;
    try {
      const dados = await resposta.json();
      mensagem = dados.mensagem || dados.erro || mensagem;
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(resposta.status, mensagem);
  }

  return resposta;
}

export async function apiFetch<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const resposta = await requisitar(caminho, opcoes);
  return (await resposta.json()) as T;
}

// Download de arquivo com o token no header (window.open não conseguiria enviar o Authorization)
export async function apiDownload(caminho: string, nomeArquivo: string, opcoes: RequestInit = {}): Promise<void> {
  const resposta = await requisitar(caminho, opcoes);
  const blob = await resposta.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export function mensagemDeErro(error: unknown): string {
  return error instanceof Error ? error.message : 'Erro inesperado.';
}
