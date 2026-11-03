import { useState } from 'react';
import ModalConfirmacao, { type PedidoConfirmacao } from '../components/ModalConfirmacao';

// Substitui o window.confirm: `await confirmar(...)` abre o modal e resolve true/false
export function useConfirmacao() {
  const [pedido, setPedido] = useState<PedidoConfirmacao | null>(null);

  const confirmar = (titulo: string, mensagem: string, textoConfirmar = 'Excluir') =>
    new Promise<boolean>((resolver) => setPedido({ titulo, mensagem, textoConfirmar, resolver }));

  const responder = (confirmado: boolean) => {
    pedido?.resolver(confirmado);
    setPedido(null);
  };

  const dialogo = pedido ? <ModalConfirmacao pedido={pedido} onResponder={responder} /> : null;

  return { confirmar, dialogo };
}
