import { useState, type FormEvent } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import CampoSenha from '../components/CampoSenha';
import Logo from '../components/Logo';
import { apiFetch, mensagemDeErro, sessao } from '../config/api';
import type { RespostaSessao, Usuario } from '../types';

interface LoginProps {
  onLogin: (usuario: Usuario) => void;
  avisoInicial?: string | null;
}

type Modo = 'entrar' | 'cadastrar';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARGOS = ['LDR', 'SDR', 'Vendedor', 'RevOps', 'CS / Pós-vendas', 'Gestor'];

const inputClasse =
  'w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none';

export default function Login({ onLogin, avisoInicial }: LoginProps) {
  const [modo, setModo] = useState<Modo>('entrar');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [cargo, setCargo] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(
    avisoInicial ? { tipo: 'info', texto: avisoInicial } : null
  );
  const [enviando, setEnviando] = useState(false);

  const trocarModo = (novo: Modo) => {
    setModo(novo);
    setErros({});
    setAlerta(null);
  };

  // Mesmas regras do userValidator da API, para o usuário ver o erro antes de enviar
  const validar = (): Record<string, string> => {
    const novos: Record<string, string> = {};
    if (!EMAIL_REGEX.test(email.trim())) novos.email = 'Informe um e-mail válido.';
    if (!senha) novos.senha = 'Informe a senha.';

    if (modo === 'cadastrar') {
      if (nome.trim().length < 3) novos.nome = 'O nome deve ter pelo menos 3 caracteres.';
      if (!cargo) novos.cargo = 'Selecione o seu cargo.';
      if (senha.length < 6) novos.senha = 'A senha deve ter pelo menos 6 caracteres.';
      if (senha !== confirmarSenha) novos.confirmarSenha = 'As senhas não conferem.';
    }
    return novos;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const novosErros = validar();
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    setAlerta(null);
    try {
      const resposta =
        modo === 'entrar'
          ? await apiFetch<RespostaSessao>('/usuarios/login', {
              method: 'POST',
              body: JSON.stringify({ email, senha }),
            })
          : await apiFetch<RespostaSessao>('/usuarios', {
              method: 'POST',
              body: JSON.stringify({ nome, email, senha, cargo }),
            });

      sessao.salvar(resposta.token, resposta.usuario);
      onLogin(resposta.usuario);
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setEnviando(false);
    }
  };

  const campoErro = (campo: string) =>
    erros[campo] ? <p className="text-xs text-red-600 mt-1">{erros[campo]}</p> : null;

  const bordaCampo = (campo: string) => (erros[campo] ? 'border-red-400' : 'border-gray-300');

  return (
    <div className="flex min-h-screen">
      {/* Coluna Esquerda - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-center items-center text-white px-12 text-center">
        <div className="mb-8 flex items-center gap-4 text-6xl font-bold">
          <Logo tamanho={72} className="ring-1 ring-white/20 rounded-2xl" /> LiderOps
        </div>
        <h1 className="text-4xl font-bold mb-4 text-green-500">
          {modo === 'entrar' ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h1>
        <p className="text-lg text-gray-300 max-w-md">
          Garimpe leads no ICP, enriqueça CNPJs, gere e-mails com IA e acompanhe suas tarefas em um só lugar.
        </p>
        <div className="mt-auto pb-8 text-xs text-gray-500">© 2026 Todos os direitos reservados.</div>
      </div>

      {/* Coluna Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-8 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Identificação de Usuário</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-full">
            {(['entrar', 'cadastrar'] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => trocarModo(m)}
                className={`py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  modo === m ? 'bg-[#0f172a] text-white shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {m === 'entrar' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

            {modo === 'cadastrar' && (
              <>
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">Nome completo</label>
                  <input
                    id="nome"
                    type="text"
                    autoComplete="name"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome"
                    className={`${inputClasse} ${bordaCampo('nome')}`}
                  />
                  {campoErro('nome')}
                </div>
                <div>
                  <label htmlFor="cargo" className="block text-sm font-medium text-gray-700 mb-2">Cargo</label>
                  <select
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className={`${inputClasse} ${bordaCampo('cargo')} bg-white`}
                  >
                    <option value="">Selecione...</option>
                    {CARGOS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {campoErro('cargo')}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@empresa.com"
                className={`${inputClasse} ${bordaCampo('email')}`}
              />
              {campoErro('email')}
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <CampoSenha
                id="senha"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                value={senha}
                onChange={setSenha}
                placeholder="••••••••••••"
                className={`${inputClasse} ${bordaCampo('senha')}`}
                mostrarForca={modo === 'cadastrar'}
              />
              {campoErro('senha')}
            </div>

            {modo === 'cadastrar' && (
              <div>
                <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">Confirmar senha</label>
                <CampoSenha
                  id="confirmarSenha"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  placeholder="••••••••••••"
                  className={`${inputClasse} ${bordaCampo('confirmarSenha')}`}
                />
                {campoErro('confirmarSenha')}
              </div>
            )}

            {modo === 'entrar' && (
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() =>
                    setAlerta({
                      tipo: 'info',
                      texto: 'Peça a um administrador do LiderOps para redefinir sua senha na aba Usuários. Depois, troque por uma senha sua em Minha conta.',
                    })
                  }
                  className="text-sm text-gray-500 hover:text-[#0f172a] hover:underline cursor-pointer"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md cursor-pointer disabled:bg-gray-400"
            >
              {enviando ? 'Aguarde...' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
