export type TipoAlerta = 'sucesso' | 'erro' | 'info';

export interface MensagemAlerta {
  tipo: TipoAlerta;
  texto: string;
}

interface AlertaProps {
  alerta: MensagemAlerta | null;
  onFechar?: () => void;
}

const ESTILOS: Record<TipoAlerta, string> = {
  sucesso: 'bg-green-50 border-green-300 text-green-800',
  erro: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-slate-50 border-slate-300 text-slate-700',
};

export default function Alerta({ alerta, onFechar }: AlertaProps) {
  if (!alerta) return null;

  return (
    <div role="alert" className={`flex items-start justify-between gap-3 border rounded-md px-4 py-3 text-sm ${ESTILOS[alerta.tipo]}`}>
      <span className="whitespace-pre-line">{alerta.texto}</span>
      {onFechar && (
        <button onClick={onFechar} aria-label="Fechar aviso" className="font-bold opacity-60 hover:opacity-100 cursor-pointer">
          ✕
        </button>
      )}
    </div>
  );
}
