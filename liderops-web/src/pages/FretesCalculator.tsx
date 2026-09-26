export default function FretesCalculator() {
  const mockFretes = [
    { transp: 'DirectLog Logística', faixa: 'Até 35 kg', prazo: 'D+2 (Rápido)', modalidade: 'Rodoviário Expresso', preco: 'R$ 142,50' },
    { transp: 'Alfa Cargas Express', faixa: 'Até 50 kg', prazo: 'D+3 (Normal)', modalidade: 'Rodoviário Convencional', preco: 'R$ 185,00' },
    { transp: 'Mandarim Cargo', faixa: 'Até 30 kg', prazo: 'D+1 (Prioritário)', modalidade: 'Aéreo Integrado', preco: 'R$ 290,00' },
    { transp: 'Total Express Corporativo', faixa: 'Até 100 kg', prazo: 'D+4 (Econômico)', modalidade: 'Carga Fechada', preco: 'R$ 320,00' },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Coluna Lateral */}
      <div className="w-full md:w-1/3 space-y-6">
        <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
          <span className="bg-[#8BC53F] text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">Cálculo de Fretes</span>
          <p className="text-sm text-gray-300">
            Acabe com as planilhas complexas de envio de material corporativo. Obtenha cotações automáticas de frete baseado no peso total das caixas de papelão e no CEP de destino.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 border-b pb-2">Cálculo de Envio</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">CEP de Destino</label>
              <input type="text" defaultValue="01311-200 (Paulista, SP)" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm font-medium text-gray-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Cubagem (C x L x A por caixa)</label>
              <input type="text" defaultValue="40cm x 40cm x 30cm" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm text-gray-700" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Peso Total (Kg)</label>
              <input type="text" defaultValue="25,5 kg" className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#8BC53F] focus:outline-none text-sm text-gray-700" />
            </div>
            <button className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2 px-4 rounded transition-colors mt-4 shadow">
              Obter Cotações
            </button>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="w-full md:w-2/3 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-t-4 border-[#8BC53F]">
            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Melhor Opção Econômica</div>
            <div className="text-3xl font-bold text-[#0f172a] mb-1">R$ 142,50</div>
            <div className="text-xs text-gray-400">DirectLog Logística • Entrega em D+2</div>
          </div>
          <div className="bg-[#0f172a] text-white p-4 rounded-lg shadow border-t-4 border-blue-500">
            <div className="text-xs text-gray-400 uppercase font-bold mb-1">Melhor Opção de Velocidade</div>
            <div className="text-3xl font-bold mb-1">R$ 290,00</div>
            <div className="text-xs text-gray-400">Mandarim Cargo • Entrega em D+1</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
          <h3 className="font-bold text-gray-800 text-lg mb-6">Resultados Ordenados por Menor Preço</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Transportadora</th>
                  <th className="px-4 py-3">Faixa Atendida</th>
                  <th className="px-4 py-3">Prazo Estimado</th>
                  <th className="px-4 py-3">Modalidade</th>
                  <th className="px-4 py-3 text-right">Preço de Tabela</th>
                </tr>
              </thead>
              <tbody>
                {mockFretes.map((frete, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold text-gray-800">{frete.transp}</td>
                    <td className="px-4 py-4 text-gray-500">{frete.faixa}</td>
                    <td className="px-4 py-4 font-medium text-gray-700">{frete.prazo}</td>
                    <td className="px-4 py-4 text-gray-500">{frete.modalidade}</td>
                    <td className="px-4 py-4 font-bold text-[#0f172a] text-right">{frete.preco}</td>
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