export default function SlaCalculator() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
          <span className="bg-[#8BC53F] text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">SLA DA OPERAÇÃO</span>
          <h2 className="text-xl font-bold mb-2">Alinhamento Comercial</h2>
          <p className="text-sm text-gray-300">
            Calcule com precisão matemática a data de entrega. Nosso motor calcula o cronograma excluindo feriados nacionais e fins de semana automaticamente para garantir estimativas realistas.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Parâmetros de Produção</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Material / Kit</label>
              <select className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm bg-white">
                <option>Kit Welcome Pack Premium</option>
                <option>Caixa de Papelão Onda Dupla</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fechamento do Pedido</label>
              <input type="date" defaultValue="2026-10-15" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume (Unidades)</label>
              <input type="number" defaultValue={250} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm" />
            </div>

            <button className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2 px-4 rounded transition-colors mt-2 shadow">
              Calcular Data de SLA
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal - Resultados */}
      <div className="w-full md:w-2/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow flex items-center gap-6">
          <div className="bg-[#8BC53F] p-4 rounded-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <div className="text-xs text-gray-300 uppercase tracking-wider mb-1">Data Máxima de Entrega Homologada</div>
            <div className="text-3xl font-bold text-white">29 de Outubro de 2026</div>
            <div className="text-sm text-gray-400 mt-1">Prazo operacional: 10 dias úteis calculados.</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-6 border-b pb-2">Decomposição Detalhada do SLA</h3>
          
          <div className="space-y-4">
            {/* Steps mockados */}
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border-l-4 border-[#8BC53F]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Envio de Layout e Vetorização</div>
                  <div className="text-xs text-gray-500">Processamento imediato • D+0</div>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-700">15 Out</div>
            </div>

            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border-l-4 border-[#8BC53F]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Produção do Lote (Welcome Packs)</div>
                  <div className="text-xs text-gray-500">Produção fabril • 7 dias úteis reservados</div>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-700">16 Out - 26 Out</div>
            </div>
            
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border-l-4 border-[#8BC53F]">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">✓</div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">Controle de Qualidade e Montagem</div>
                  <div className="text-xs text-gray-500">QA Interno Inteligente • 2 dias úteis</div>
                </div>
              </div>
              <div className="text-sm font-bold text-gray-700">27 Out - 28 Out</div>
            </div>
            
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded border-l-4 border-blue-500 bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold">🚚</div>
                <div>
                  <div className="font-semibold text-sm text-blue-900">Despacho para Transportadora</div>
                  <div className="text-xs text-blue-700">Retirada e expedição em lote • D+1</div>
                </div>
              </div>
              <div className="text-sm font-bold text-blue-900">29 Out</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}