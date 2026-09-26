interface HeaderProps {
  onNavigate: (screen: string) => void;
  activeScreen: string;
}

export default function Header({ onNavigate, activeScreen }: HeaderProps) {
  // Array atualizado com a aba de SLA e com os IDs exatos do seu App.tsx
  const navItems = [
    { id: 'fretes', label: 'Calcular Frete' },
    { id: 'leads', label: 'Higienizar Dados' },
    { id: 'sla', label: 'Calcular SLA' },       // Opção de SLA adicionada
    { id: 'emails', label: 'Gerar Script' },    // ID corrigido de 'scripts' para 'emails'
  ];

  return (
    <header className="bg-[#0f172a] text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 font-bold text-xl cursor-pointer" onClick={() => onNavigate('home')}>
        <span className="text-green-500">⚙️</span> LiderOps
      </div>
      
      <nav className="flex gap-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`px-6 py-2 rounded-full border text-sm font-medium transition-colors ${
              activeScreen === item.id 
                ? 'bg-white/10 border-white text-white' 
                : 'border-white/30 text-gray-300 hover:border-white hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-sm text-white">
        M
      </div>
    </header>
  );
}