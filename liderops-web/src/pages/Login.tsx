interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <div className="flex min-h-screen">
      {/* Coluna Esquerda - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0f172a] flex-col justify-center items-center text-white px-12 text-center">
        <div className="mb-8 text-6xl">⚙️ LiderOps</div>
        <h1 className="text-4xl font-bold mb-4 text-green-500">Bem-vindo de volta</h1>
        <p className="text-lg text-gray-300 max-w-md">
          Acesse sua conta para gerenciar prospectos, visualizar históricos e otimizar suas buscas corporativas.
        </p>
        <div className="mt-auto pb-8 text-xs text-gray-500">
          © 2026 Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
              <span className="text-4xl">👤</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Identificação de Usuário</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                placeholder="seuemail@empresa.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            <button
              onClick={onLogin}
              className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-3 px-4 rounded-md transition-colors shadow-md"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}