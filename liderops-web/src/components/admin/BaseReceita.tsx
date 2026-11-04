import { useEffect, useState, type FormEvent } from 'react';
import Alerta, { type MensagemAlerta } from '../Alerta';
import { apiFetch, mensagemDeErro } from '../../config/api';
import { useConfirmacao } from '../../hooks/useConfirmacao';

interface ResumoBase {
  total: number;
  ultima_importacao: string | null;
  por_uf: { uf: string; total: number }[];
}

interface RespostaImportacao {
  mensagem: string;
  estatisticas: { totalLidas: number; totalAprovadas: number; novas: number; atualizadas: number; removidas: number };
}

const numero = (n: number) => n.toLocaleString('pt-BR');

// Carga do CSV gerado pelo script de tratamento da Receita (filtrado pelo ICP)
export default function BaseReceita() {
  const [resumo, setResumo] = useState<ResumoBase | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [substituir, setSubstituir] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const [campoArquivo, setCampoArquivo] = useState(0);
  const { confirmar, dialogo } = useConfirmacao();

  useEffect(() => {
    apiFetch<ResumoBase>('/empresas/receita/resumo')
      .then(setResumo)
      .catch((error) => setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) }));
  }, []);

  const handleEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      setAlerta({ tipo: 'erro', texto: 'Escolha o arquivo .csv gerado pelo script de tratamento.' });
      return;
    }
    if (substituir) {
      const ok = await confirmar(
        'Substituir a base da Receita',
        'Empresas que não estiverem neste arquivo serão removidas da base de garimpo. Use isso na carga mensal completa.',
        'Substituir'
      );
      if (!ok) return;
    }

    const dados = new FormData();
    dados.append('arquivo', arquivo);
    dados.append('substituir', String(substituir));

    setEnviando(true);
    setAlerta({ tipo: 'info', texto: 'Processando o arquivo. Bases grandes podem levar alguns minutos...' });
    try {
      const { estatisticas: est } = await apiFetch<RespostaImportacao>('/empresas/importar-receita', {
        method: 'POST',
        body: dados,
      });
      setAlerta({
        tipo: 'sucesso',
        texto:
          `${numero(est.totalAprovadas)} empresas aceitas de ${numero(est.totalLidas)} linhas: ` +
          `${numero(est.novas)} novas, ${numero(est.atualizadas)} atualizadas` +
          (substituir ? `, ${numero(est.removidas)} removidas.` : '.'),
      });
      setArquivo(null);
      setSubstituir(false);
      setCampoArquivo((n) => n + 1);
      setResumo(await apiFetch<ResumoBase>('/empresas/receita/resumo'));
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
      {dialogo}
      <div>
        <h3 className="font-bold text-gray-800">Base da Receita (garimpo)</h3>
        <p className="text-xs text-gray-500 mt-1">Envie o CSV gerado pelo script de tratamento. Empresas já existentes são atualizadas.</p>
      </div>

      {resumo && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-2xl font-bold text-[#0f172a]">{numero(resumo.total)}</span>
            <span className="text-gray-500"> empresas</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {resumo.por_uf.map((u) => (
              <span key={u.uf} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-1">
                {u.uf}: {numero(u.total)}
              </span>
            ))}
          </div>
          {resumo.ultima_importacao && (
            <span className="text-xs text-gray-400">
              Última carga: {new Date(resumo.ultima_importacao).toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      )}

      <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

      <form onSubmit={handleEnviar} className="space-y-3">
        <input
          key={campoArquivo}
          type="file"
          accept=".csv,.txt"
          aria-label="Arquivo CSV da Receita"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-[#0f172a] file:text-white file:cursor-pointer"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={substituir}
            onChange={(e) => setSubstituir(e.target.checked)}
            className="accent-[#8BC53F]"
          />
          Substituir a base (remove empresas que não vieram neste arquivo)
        </label>
        <button
          type="submit"
          disabled={enviando || !arquivo}
          className="px-5 py-2 rounded bg-[#8BC53F] hover:bg-[#7ab135] text-white text-sm font-bold shadow cursor-pointer disabled:bg-gray-400"
        >
          {enviando ? 'Importando...' : 'Enviar base'}
        </button>
      </form>
    </section>
  );
}
