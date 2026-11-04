import { useEffect, useState } from 'react';
import Alerta, { type MensagemAlerta } from '../Alerta';
import { apiFetch, mensagemDeErro } from '../../config/api';
import { useConfirmacao } from '../../hooks/useConfirmacao';

interface RespostaConvite {
  codigo: string | null;
  dominios?: string[];
}

// Código exigido no cadastro de novas contas, junto com o e-mail corporativo
export default function ConviteCadastro() {
  const [codigo, setCodigo] = useState<string | null>(null);
  const [dominios, setDominios] = useState<string[]>([]);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const { confirmar, dialogo } = useConfirmacao();

  useEffect(() => {
    apiFetch<RespostaConvite>('/config/convite')
      .then((r) => {
        setCodigo(r.codigo);
        setDominios(r.dominios ?? []);
      })
      .catch((error) => setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) }));
  }, []);

  const salvar = async (corpo: { codigo?: string; gerar?: boolean }) => {
    setSalvando(true);
    try {
      const r = await apiFetch<RespostaConvite & { mensagem: string }>('/config/convite', {
        method: 'PUT',
        body: JSON.stringify(corpo),
      });
      setCodigo(r.codigo);
      setEditando(false);
      setNovoCodigo('');
      setAlerta({ tipo: 'sucesso', texto: r.mensagem });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setSalvando(false);
    }
  };

  const gerarNovo = async () => {
    const ok = await confirmar(
      'Gerar novo código',
      'O código atual deixa de funcionar para novos cadastros. Contas já criadas não são afetadas.',
      'Gerar novo'
    );
    if (ok) salvar({ gerar: true });
  };

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo);
      setAlerta({ tipo: 'sucesso', texto: 'Código copiado.' });
    } catch {
      setAlerta({ tipo: 'erro', texto: 'Não foi possível copiar automaticamente.' });
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
      {dialogo}
      <div>
        <h3 className="font-bold text-gray-800">Código de convite</h3>
        <p className="text-xs text-gray-500 mt-1">
          Exigido no cadastro de novas contas
          {dominios.length > 0 && <>, junto com um e-mail {dominios.map((d) => `@${d}`).join(' ou ')}</>}.
        </p>
      </div>

      <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

      <div className="flex items-center gap-3">
        <span className="font-mono text-2xl font-bold tracking-[0.3em] text-[#0f172a] bg-gray-50 border border-gray-200 rounded px-4 py-2">
          {codigo ?? '—'}
        </span>
        <button onClick={copiar} disabled={!codigo} className="text-xs text-blue-700 hover:underline cursor-pointer disabled:opacity-40">
          Copiar
        </button>
      </div>

      {editando ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={novoCodigo}
            onChange={(e) => setNovoCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={8}
            placeholder="6 a 8 letras/números"
            aria-label="Novo código de convite"
            className="w-48 p-2 border border-gray-300 rounded text-sm font-mono tracking-widest focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
          <button
            onClick={() => salvar({ codigo: novoCodigo })}
            disabled={salvando || novoCodigo.length < 6}
            className="px-4 py-2 rounded bg-[#0f172a] text-white text-sm cursor-pointer disabled:bg-gray-400"
          >
            Salvar
          </button>
          <button onClick={() => setEditando(false)} className="text-sm text-gray-500 hover:underline cursor-pointer">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setEditando(true)}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 cursor-pointer"
          >
            Definir código
          </button>
          <button
            onClick={gerarNovo}
            disabled={salvando}
            className="px-4 py-2 rounded bg-[#8BC53F] hover:bg-[#7ab135] text-white text-sm font-medium cursor-pointer disabled:bg-gray-400"
          >
            Gerar novo aleatório
          </button>
        </div>
      )}
    </section>
  );
}
