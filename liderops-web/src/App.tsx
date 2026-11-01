import { useEffect, useState } from 'react';
import Header, { type Tela } from './components/Header';
import Login from './pages/Login';
import LeadsCleaner from './pages/LeadsCleaner';
import EmailGenerator from './pages/EmailGenerator';
import Tarefas from './pages/Tarefas';
import Usuarios from './pages/Usuarios';
import Conta from './pages/Conta';
import { apiFetch, EVENTO_SESSAO_EXPIRADA, sessao } from './config/api';
import type { Usuario } from './types';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => (sessao.getToken() ? sessao.getUsuario() : null));
  const [tela, setTela] = useState<Tela>('leads');
  const [avisoLogin, setAvisoLogin] = useState<string | null>(null);

  // Revalida a sessão salva com a API ao abrir o app e escuta expiração do token
  useEffect(() => {
    const aoExpirar = () => {
      setUsuario(null);
      setAvisoLogin('Sua sessão expirou. Faça login novamente.');
    };
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);

    if (sessao.getToken()) {
      apiFetch<Usuario>('/usuarios/me')
        .then((atual) => {
          sessao.atualizarUsuario(atual);
          setUsuario(atual);
        })
        .catch(() => {
          // erro de rede mantém a sessão local; 401 já é tratado pelo evento
        });
    }

    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, []);

  const handleLogin = (logado: Usuario) => {
    setAvisoLogin(null);
    setTela('leads');
    setUsuario(logado);
  };

  const handleLogout = () => {
    sessao.limpar();
    setUsuario(null);
  };

  if (!usuario) {
    return <Login onLogin={handleLogin} avisoInicial={avisoLogin} />;
  }

  const telaAtual = tela === 'usuarios' && usuario.perfil !== 'admin' ? 'leads' : tela;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header usuario={usuario} telaAtiva={telaAtual} onNavigate={setTela} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {telaAtual === 'leads' && <LeadsCleaner usuario={usuario} />}
        {telaAtual === 'emails' && <EmailGenerator usuario={usuario} />}
        {telaAtual === 'tarefas' && <Tarefas />}
        {telaAtual === 'usuarios' && <Usuarios usuario={usuario} />}
        {telaAtual === 'conta' && <Conta usuario={usuario} />}
      </main>
    </div>
  );
}
