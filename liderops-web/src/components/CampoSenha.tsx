import { useState } from 'react';

interface CampoSenhaProps {
  id: string;
  value: string;
  onChange: (valor: string) => void;
  autoComplete: string;
  className: string;
  placeholder?: string;
  mostrarForca?: boolean;
}

// Pontua de 0 a 4: tamanho, número, letra maiúscula/minúscula e símbolo
function forcaDaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;
  if (pontos <= 1) return { rotulo: 'Fraca', cor: 'bg-red-500', largura: 'w-1/3' };
  if (pontos <= 2) return { rotulo: 'Média', cor: 'bg-amber-500', largura: 'w-2/3' };
  return { rotulo: 'Forte', cor: 'bg-[#8BC53F]', largura: 'w-full' };
}

export default function CampoSenha({ id, value, onChange, autoComplete, className, placeholder, mostrarForca }: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);
  const forca = forcaDaSenha(value);

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={visivel ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${className} pr-20`}
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 hover:text-[#0f172a] cursor-pointer"
        >
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {mostrarForca && value && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full ${forca.cor} ${forca.largura} transition-all`} />
          </div>
          <span className="text-xs text-gray-500 w-12 text-right">{forca.rotulo}</span>
        </div>
      )}
    </div>
  );
}
