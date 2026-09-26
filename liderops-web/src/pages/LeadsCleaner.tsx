export default function LeadsCleaner() {
  const mockLeads = [
    { cnpj: '12.345.678/0001-90', razao: 'Inovação Tecnológica Ltda', endereco: 'Av. Paulista, 1000 - SP', cnae: '62.01-5-01' },
    { cnpj: '98.765.432/0001-10', razao: 'Distribuidora de Cosméticos Sul', endereco: 'Rua das Flores, 45 - RS', cnae: '46.72-9-00' },
    { cnpj: '45.123.890/0002-33', razao: 'Fábrica de Vidros Eireli', endereco: 'Av. do Contorno, 800 - MG', cnae: '38.11-4-00' },
    { cnpj: '10.987.654/0001-22', razao: 'Alimentos e Bebidas do Vale', endereco: 'Rodovia BR-101, Km 200 - SC', cnae: '10.99-6-99' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Coluna Lateral */}
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
          <span className="bg-green-500 text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">INTEGRAÇÃO HUBSPOT</span>
          <h2 className="text-xl font-bold mb-2">Sincronização Direta</h2>
          <p className="text-sm text-gray-300">
            Cole CNPJs em lote para validação cadastral profunda. Nossa IA cruza com a Receita Federal, limpa a Razão Social e mapeia o CNAE exato, eliminando o preenchimento manual.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Colar Lista de CNPJs</h3>
          <textarea
            className="w-full h-48 p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none mb-4 resize-none text-sm"
            placeholder="Cole os CNPJs aqui, um por linha..."
            defaultValue="12.345.678/0001-90&#10;98.765.432/0001-10&#10;45.123.890/0002-33&#10;10.987.654/0001-22"
          />
          <button className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2 px-4 rounded transition-colors shadow">
            Validar e Enriquecer Lote
          </button>
        </div>
      </div>

      {/* Área Principal */}
      <div className="w-full md:w-2/3 space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Total Processado</div>
            <div className="text-2xl font-bold">04 CNPJs</div>
          </div>
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow">
            <div className="text-xs text-gray-400 mb-1">Sucesso de Enriquecimento</div>
            <div className="text-2xl font-bold">100%</div>
          </div>
          <div className="bg-white border border-gray-200 text-gray-800 p-4 rounded-lg shadow">
            <div className="text-xs text-gray-500 mb-1">Auto-salvo no HubSpot</div>
            <div className="text-2xl font-bold text-[#0f172a]">Sim (Integrado)</div>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 text-lg">Base Higienizada Pronta</h3>
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 font-medium">
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
                {mockLeads.map((lead, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 text-gray-500">{lead.cnpj}</td>
                    <td className="px-4 py-4 font-medium text-blue-900">{lead.razao}</td>
                    <td className="px-4 py-4 text-gray-600">{lead.endereco}</td>
                    <td className="px-4 py-4 text-gray-600">{lead.cnae}</td>
                    <td className="px-4 py-4">
                      <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded">Pronto HubSpot</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}