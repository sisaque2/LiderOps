import { useState, useEffect } from 'react';

interface LeadEmpresa {
  id_empresa?: number;
  cnpj: string;
  razao_social: string;
  endereco: string;
  cnae: string;
  status_sincronizacao?: string;
}

export default function LeadsCleaner() {
  const [cnpjsInput, setCnpjsInput] = useState('');
  const [leads, setLeads] = useState<LeadEmpresa[]>([]);
  const [isProcessando, setIsProcessando] = useState(false);
  const [resumo, setResumo] = useState({ processados: 0, taxaSucesso: '100%' });

  // Estados para o filtro de Garimpo na Base da Receita
  const [ufFiltro, setUfFiltro] = useState('SP');
  const [cnaeFiltro, setCnaeFiltro] = useState('');
  const [isGarimpando, setIsGarimpando] = useState(false);

  // 1. Ao abrir a tela, busca as empresas que já estão enriquecidas no MySQL
  const carregarEmpresasSalvas = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/empresas');
      if (res.ok) {
        const dados = await res.json();
        setLeads(dados);
        setResumo((prev) => ({ ...prev, processados: dados.length }));
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  useEffect(() => {
    carregarEmpresasSalvas();
  }, []);

  // 2. Garimpa CNPJs na tabela bruta da Receita Federal e preenche o textarea
  const handleGarimparReceita = async () => {
    setIsGarimpando(true);
    try {
      const params = new URLSearchParams({ uf: ufFiltro, limite: '50' });
      if (cnaeFiltro.trim()) params.append('cnae', cnaeFiltro.trim());

      const res = await fetch(`http://localhost:3000/api/empresas/garimpar?${params.toString()}`);
      const resultado = await res.json();

      if (res.ok && resultado.dados?.length > 0) {
        const listaCnpjs = resultado.dados.map((emp: { cnpj: string }) => emp.cnpj).join('\n');
        setCnpjsInput(listaCnpjs);
      } else {
        alert('Nenhuma empresa encontrada na base bruta com esses filtros.');
      }
    } catch (error) {
      alert('Erro ao conectar na rota de garimpo.');
    } finally {
      setIsGarimpando(false);
    }
  };

  // 3. Dispara o lote de CNPJs para a fila da Brasil API
  const handleEnriquecerLote = async () => {
    const listaCnpjs = cnpjsInput
      .split(/[\n,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    if (listaCnpjs.length === 0) {
      alert('Cole pelo menos 1 CNPJ válido na lista.');
      return;
    }

    setIsProcessando(true);
    try {
      const res = await fetch('http://localhost:3000/api/empresas/enriquecer-lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpjs: listaCnpjs })
      });

      const resultado = await res.json();

      if (!res.ok) {
        alert(resultado.mensagem || 'Erro na validação do lote.');
        return;
      }

      const total = resultado.resumo.total_processado || 1;
      const certos = resultado.resumo.total_sucesso || 0;
      const porcentagem = Math.round((certos / total) * 100);

      setResumo({
        processados: total,
        taxaSucesso: `${porcentagem}%`
      });

      // Recarrega a tabela com os dados recém-salvos no MySQL
      await carregarEmpresasSalvas();
    } catch (error) {
      alert('Falha ao processar lote no servidor.');
    } finally {
      setIsProcessando(false);
    }
  };

  // 4. Aciona o download direto do arquivo .xlsx gerado pelo ExcelJS
  const handleExportarExcel = () => {
    window.open('http://localhost:3000/api/empresas/exportar', '_blank');
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Coluna Lateral */}
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
          <span className="bg-green-500 text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">INTEGRAÇÃO HUBSPOT</span>
          <h2 className="text-xl font-bold mb-2">Sincronização Direta</h2>
          <p className="text-sm text-gray-300">
            Extraia CNPJs pelo filtro ICP da Receita ou cole em lote para validação cadastral profunda via Brasil API.
          </p>
        </div>

        {/* Bloco de Garimpo ICP na Base Bruta */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">1. Garimpar por ICP (Receita)</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <select
              value={ufFiltro}
              onChange={(e) => setUfFiltro(e.target.value)}
              className="p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="SP">SP</option>
              <option value="MG">MG (Sul)</option>
              <option value="ES">ES (Vitória)</option>
              <option value="GO">GO (Anápolis)</option>
            </select>
            <input
              type="text"
              placeholder="CNAE (ex: 1099)"
              value={cnaeFiltro}
              onChange={(e) => setCnaeFiltro(e.target.value)}
              className="col-span-2 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
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

        {/* Bloco de Enriquecimento em Lote */}
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
        {/* Estatísticas Dinâmicas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Total na Base</div>
            <div className="text-2xl font-bold">{String(leads.length).padStart(2, '0')} CNPJs</div>
          </div>
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Sucesso do Último Lote</div>
            <div className="text-2xl font-bold">{resumo.taxaSucesso}</div>
          </div>
          <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-lg shadow">
            <div className="text-xs text-gray-500 mb-1">Auto-salvo no MySQL</div>
            <div className="text-2xl font-bold text-[#0f172a]">Sim (Ativo)</div>
          </div>
        </div>

        {/* Tabela de Resultados Reais */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Base Higienizada Pronta</h3>
            <button
              onClick={handleExportarExcel}
              className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 font-medium cursor-pointer"
            >
              📥 Exportar para .xlsx
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Razão Social</th>
                  <th className="px-4 py-3">Endereço Principal</th>
                  <th className="px-4 py-3">CNAE</th>
                  <th className="px-4 py-3">Sincronização</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                      Nenhuma empresa enriquecida ainda. Cole os CNPJs ao lado para iniciar.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, index) => (
                    <tr key={lead.id_empresa || index} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-4 text-gray-500">{lead.cnpj}</td>
                      <td className="px-4 py-4 font-medium text-blue-900">{lead.razao_social}</td>
                      <td className="px-4 py-4 text-gray-600">{lead.endereco}</td>
                      <td className="px-4 py-4 text-gray-600">{lead.cnae}</td>
                      <td className="px-4 py-4">
                        <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded">
                          {lead.status_sincronizacao || 'Pronto HubSpot'}
                        </span>
                      </td>
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