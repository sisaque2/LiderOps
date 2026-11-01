import type { Usuario } from '../types';

export type Tela = 'leads' | 'emails' | 'tarefas' | 'usuarios' | 'conta';

interface HeaderProps {
  usuario: Usuario;
  telaAtiva: Tela;
  onNavigate: (tela: Tela) => void;
  onLogout: () => void;
}

const NAV_ITEMS: { id: Tela; label: string; somenteAdmin?: boolean }[] = [
  { id: 'leads', label: 'Higienizar Dados' },
  { id: 'emails', label: 'Gerar E-mail' },
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'usuarios', label: 'Usuários', somenteAdmin: true },
];

export default function Header({ usuario, telaAtiva, onNavigate, onLogout }: HeaderProps) {
  const itens = NAV_ITEMS.filter((item) => !item.somenteAdmin || usuario.perfil === 'admin');
  const inicial = usuario.nome.trim().charAt(0).toUpperCase();

  return (
    <header className="bg-[#0f172a] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => onNavigate('leads')}>
        <span className="text-green-500">⚙️</span> LiderOps
      </div>

      <nav className="flex flex-wrap gap-2 sm:gap-4">
        {itens.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-5 py-2 rounded-full border text-sm font-medium transition-colors cursor-pointer ${
              telaAtiva === item.id
                ? 'bg-white/10 border-white text-white'
                : 'border-white/30 text-gray-300 hover:border-white hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate('conta')}
          title="Minha conta"
          className={`flex items-center gap-3 rounded-full pl-3 pr-1 py-1 transition-colors cursor-pointer ${
            telaAtiva === 'conta' ? 'bg-white/10' : 'hover:bg-white/5'
          }`}
        >
          <div className="text-right leading-tight hidden sm:block">
            <div className="text-sm font-semibold">{usuario.nome}</div>
            <div className="text-xs text-gray-400">
              {usuario.cargo}
              {usuario.perfil === 'admin' && (
                <span className="ml-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Admin</span>
              )}
            </div>
          </div>
          <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm text-white">
            {inicial}
          </div>
        </button>
        <button
          onClick={onLogout}
          className="text-xs text-gray-300 border border-white/30 rounded-full px-3 py-1.5 hover:border-white hover:text-white transition-colors cursor-pointer"
        >
          Sair
        </button>
      </div>
    </header>
  );
}
