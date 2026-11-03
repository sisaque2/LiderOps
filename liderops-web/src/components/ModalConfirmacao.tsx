import { useEffect, useRef } from 'react';

export interface PedidoConfirmacao {
  titulo: string;
  mensagem: string;
  textoConfirmar: string;
  resolver: (confirmado: boolean) => void;
}

export default function ModalConfirmacao({ pedido, onResponder }: { pedido: PedidoConfirmacao; onResponder: (ok: boolean) => void }) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelarRef.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onResponder(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [onResponder]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/60 px-4"
      onClick={() => onResponder(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacao-titulo"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-lg shadow-xl p-6"
      >
        <h3 id="confirmacao-titulo" className="text-lg font-bold text-[#0f172a]">{pedido.titulo}</h3>
        <p className="text-sm text-gray-600 mt-2">{pedido.mensagem}</p>
        <div className="flex justify-end gap-3 mt-6">
          <button
            ref={cancelarRef}
            onClick={() => onResponder(false)}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => onResponder(true)}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white text-sm font-medium cursor-pointer"
          >
            {pedido.textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
