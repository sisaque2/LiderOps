import { useEffect, useState } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import { useConfirmacao } from '../hooks/useConfirmacao';
import { apiDownload, apiFetch, mensagemDeErro } from '../config/api';
import type { LeadEmpresa, Usuario } from '../types';

interface LeadsCleanerProps {
  usuario: Usuario;
}

interface RespostaGarimpo {
  total_encontrado: number;
  dados: { cnpj: string }[];
}

interface RespostaLote {
  resumo: { total_processado: number; total_sucesso: number; total_falhas: number };
  erros: { cnpj: string; motivo: string }[];
}

const buscarEmpresas = () => apiFetch<LeadEmpresa[]>('/empresas');

const formatarCnpj = (cnpj: string) =>
  cnpj.length === 14 ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : cnpj;

const dataLocal = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-BR') : '');

export default function LeadsCleaner({ usuario }: LeadsCleanerProps) {
  const [cnpjsInput, setCnpjsInput] = useState('');
  const [leads, setLeads] = useState<LeadEmpresa[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);
  const [taxaSucesso, setTaxaSucesso] = useState('—');
  const [falhasLote, setFalhasLote] = useState<RespostaLote['erros']>([]);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);

  const [ufFiltro, setUfFiltro] = useState('SP');
  const [cnaeFiltro, setCnaeFiltro] = useState('');
  const [isGarimpando, setIsGarimpando] = useState(false);
  const [isExportando, setIsExportando] = useState(false);

  const [busca, setBusca] = useState('');
  const { confirmar, dialogo } = useConfirmacao();

  const ehAdmin = usuario.perfil === 'admin';
  const hoje = new Date().toLocaleDateString('pt-BR');
  const capturadasHoje = leads.filter((l) => dataLocal(l.criado_em) === hoje).length;

  const termo = busca.trim().toLowerCase();
  const termoDigitos = termo.replace(/\D/g, '');
  const leadsFiltrados = termo
    ? leads.filter(
        (l) =>
          l.razao_social.toLowerCase().includes(termo) ||
          (termoDigitos !== '' && (l.cnpj.includes(termoDigitos) || l.cnae.includes(termoDigitos)))
      )
    : leads;

  // 1. Carrega as empresas já enriquecidas no MySQL
  useEffect(() => {
    buscarEmpresas()
      .then(setLeads)
      .catch((error) => setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) }));
  }, []);

  // 2. Garimpa CNPJs na base bruta da Receita e preenche o textarea
  const handleGarimparReceita = async () => {
    const cnaeLimpo = cnaeFiltro.replace(/\D/g, '');
    if (cnaeFiltro.trim() && cnaeLimpo.length < 2) {
      setAlerta({ tipo: 'erro', texto: 'Informe pelo menos os 2 primeiros dígitos do CNAE (ex: 21 ou 2121).' });
      return;
    }

    setIsGarimpando(true);
    setAlerta(null);
    try {
      const params = new URLSearchParams({ uf: ufFiltro, limite: '50' });
      if (cnaeLimpo) params.append('cnae', cnaeLimpo);

      const resultado = await apiFetch<RespostaGarimpo>(`/empresas/garimpar?${params.toString()}`);
      if (resultado.total_encontrado === 0) {
        setAlerta({ tipo: 'info', texto: 'Nenhuma empresa encontrada na base com esses filtros.' });
        return;
      }

      setCnpjsInput(resultado.dados.map((emp) => emp.cnpj).join('\n'));
      setAlerta({ tipo: 'sucesso', texto: `${resultado.total_encontrado} CNPJs carregados da base. Agora é só enriquecer.` });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setIsGarimpando(false);
    }
  };

  // 3. Envia o lote para a fila de enriquecimento na Brasil API
  const handleEnriquecerLote = async () => {
    const listaCnpjs = cnpjsInput
      .split(/[\n,;]+/)
      .map((c) => c.replace(/\D/g, ''))
      .filter(Boolean);

    const invalidos = listaCnpjs.filter((c) => c.length !== 14);
    if (listaCnpjs.length === 0) {
      setAlerta({ tipo: 'erro', texto: 'Cole pelo menos 1 CNPJ na lista.' });
      return;
    }
    if (listaCnpjs.length > 50) {
      setAlerta({ tipo: 'erro', texto: `O lote tem ${listaCnpjs.length} CNPJs. O máximo por operação é 50.` });
      return;
    }
    if (invalidos.length > 0) {
      setAlerta({ tipo: 'erro', texto: `CNPJs sem 14 dígitos: ${invalidos.join(', ')}` });
      return;
    }

    setIsProcessando(true);
    setAlerta({ tipo: 'info', texto: `Enriquecendo ${listaCnpjs.length} CNPJs (cerca de ${Math.ceil(listaCnpjs.length * 1.2)}s)...` });
    setFalhasLote([]);
    try {
      const resultado = await apiFetch<RespostaLote>('/empresas/enriquecer-lote', {
        method: 'POST',
        body: JSON.stringify({ cnpjs: listaCnpjs }),
      });

      const { total_processado, total_sucesso, total_falhas } = resultado.resumo;
      setTaxaSucesso(`${Math.round((total_sucesso / (total_processado || 1)) * 100)}%`);
      setFalhasLote(resultado.erros);
      setAlerta({
        tipo: total_falhas === 0 ? 'sucesso' : 'info',
        texto: `${total_sucesso} de ${total_processado} empresas enriquecidas e salvas.${total_falhas ? ` ${total_falhas} falharam (detalhes abaixo).` : ''}`,
      });
      setCnpjsInput('');
      setLeads(await buscarEmpresas());
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setIsProcessando(false);
    }
  };

  // 4. Download do .xlsx gerado pelo ExcelJS
  const handleExportarExcel = async () => {
    setIsExportando(true);
    try {
      await apiDownload('/empresas/exportar', 'LiderOps_Base_Higienizada.xlsx');
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setIsExportando(false);
    }
  };

  // 5. Exclusão (somente admin)
  const handleExcluir = async (lead: LeadEmpresa) => {
    if (!lead.id_empresa) return;
    const ok = await confirmar('Excluir empresa', `${lead.razao_social} será removida da base higienizada.`);
    if (!ok) return;
    try {
      await apiFetch(`/empresas/${lead.id_empresa}`, { method: 'DELETE' });
      setLeads((atual) => atual.filter((l) => l.id_empresa !== lead.id_empresa));
      setAlerta({ tipo: 'sucesso', texto: 'Empresa removida da base.' });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {dialogo}
      {/* Coluna Lateral */}
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
          <span className="bg-green-500 text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">RECEITA + BRASIL API</span>
          <h2 className="text-xl font-bold mb-2">Higienização Cadastral</h2>
          <p className="text-sm text-gray-300">
            Extraia CNPJs pelo filtro ICP da Receita ou cole em lote para validar o cadastro via Brasil API. A base fica salva e pode ser exportada em .xlsx.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">1. Garimpar por ICP (Receita)</h3>
          <div className="grid grid-cols-5 gap-2 mb-3">
            <select
              value={ufFiltro}
              onChange={(e) => setUfFiltro(e.target.value)}
              aria-label="UF"
              className="col-span-2 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
            >
              <option value="SP">SP</option>
              <option value="MG">MG (Sul)</option>
              <option value="ES">ES (Vitória)</option>
              <option value="GO">GO (Anápolis)</option>
            </select>
            <input
              type="text"
              inputMode="numeric"
              placeholder="CNAE (ex: 2121)"
              value={cnaeFiltro}
              onChange={(e) => setCnaeFiltro(e.target.value)}
              className="col-span-3 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleGarimparReceita}
            disabled={isGarimpando}
            className="w-full bg-[#0f172a] hover:bg-slate-800 text-white font-medium py-2 px-4 rounded text-sm transition-colors cursor-pointer disabled:bg-gray-400"
          >
            {isGarimpando ? 'Buscando na base...' : '🔍 Puxar até 50 CNPJs da Base'}
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">2. Colar Lista de CNPJs</h3>
          <textarea
            className="w-full h-44 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none mb-4 resize-none text-sm"
            placeholder="Cole os CNPJs aqui, um por linha..."
            value={cnpjsInput}
            onChange={(e) => setCnpjsInput(e.target.value)}
          />
          <button
            onClick={handleEnriquecerLote}
            disabled={isProcessando}
            className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2 px-4 rounded transition-colors shadow cursor-pointer disabled:bg-gray-400"
          >
            {isProcessando ? 'Enriquecendo na Brasil API...' : 'Validar e Enriquecer Lote'}
          </button>
        </div>
      </div>

      {/* Área Principal */}
      <div className="w-full md:w-2/3 space-y-6">
        <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Total na Base</div>
            <div className="text-2xl font-bold">{String(leads.length).padStart(2, '0')} CNPJs</div>
          </div>
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Sucesso do Último Lote</div>
            <div className="text-2xl font-bold">{taxaSucesso}</div>
          </div>
          <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-lg shadow">
            <div className="text-xs text-gray-500 mb-1">Capturadas Hoje</div>
            <div className="text-2xl font-bold text-[#0f172a]">{String(capturadasHoje).padStart(2, '0')} CNPJs</div>
          </div>
        </div>

        {falhasLote.length > 0 && (
          <div className="bg-white p-4 rounded-lg shadow border border-red-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="text-sm font-semibold text-red-700">CNPJs que falharam no último lote</h4>
              <button
                onClick={() => {
                  setCnpjsInput(falhasLote.map((f) => f.cnpj).join('\n'));
                  setAlerta({ tipo: 'info', texto: 'CNPJs com falha devolvidos para a lista. Clique em "Validar e Enriquecer Lote" para tentar de novo.' });
                }}
                className="text-xs font-medium text-[#0f172a] border border-gray-300 rounded px-3 py-1 hover:bg-gray-50 cursor-pointer"
              >
                Tentar de novo só as falhas
              </button>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {falhasLote.map((f) => (
                <li key={f.cnpj}>
                  <span className="font-mono">{formatarCnpj(f.cnpj)}</span> — {f.motivo}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
            <h3 className="font-bold text-gray-800 text-lg">Base Higienizada Pronta</h3>
            <button
              onClick={handleExportarExcel}
              disabled={isExportando || leads.length === 0}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportando ? 'Gerando...' : '📥 Exportar para .xlsx'}
            </button>
          </div>

          {leads.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por razão social, CNPJ ou CNAE"
                aria-label="Buscar na base"
                className="flex-1 min-w-56 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              {termo && (
                <span className="text-xs text-gray-500">
                  {leadsFiltrados.length} de {leads.length} empresas
                </span>
              )}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Razão Social</th>
                  <th className="px-4 py-3">Endereço Principal</th>
                  <th className="px-4 py-3">CNAE</th>
                  <th className="px-4 py-3">Capturado em</th>
                  {ehAdmin && <th className="px-4 py-3" aria-label="Ações" />}
                </tr>
              </thead>
              <tbody>
                {leadsFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={ehAdmin ? 6 : 5} className="px-4 py-8 text-center text-gray-400 italic">
                      {leads.length === 0
                        ? 'Nenhuma empresa enriquecida ainda. Cole os CNPJs ao lado para iniciar.'
                        : 'Nenhuma empresa encontrada para essa busca.'}
                    </td>
                  </tr>
                ) : (
                  leadsFiltrados.map((lead) => (
                    <tr key={lead.id_empresa ?? lead.cnpj} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 text-gray-500 whitespace-nowrap">{formatarCnpj(lead.cnpj)}</td>
                      <td className="px-4 py-4 font-medium text-blue-900">{lead.razao_social}</td>
                      <td className="px-4 py-4 text-gray-600">{lead.endereco}</td>
                      <td className="px-4 py-4 text-gray-600">{lead.cnae}</td>
                      <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{dataLocal(lead.criado_em)}</td>
                      {ehAdmin && (
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => handleExcluir(lead)}
                            className="text-xs text-red-600 hover:underline cursor-pointer"
                          >
                            Excluir
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
