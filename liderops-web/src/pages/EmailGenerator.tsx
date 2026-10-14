import { useState } from 'react';

export default function EmailGenerator() {
  const [contexto, setContexto] = useState('');
  const [emailGerado, setEmailGerado] = useState('');
  const [isGerando, setIsGerando] = useState(false);

  // Função que chama a rota real do Gemini no Backend
  const handleGerarEmail = async () => {
    if (!contexto.trim()) return;
    setIsGerando(true);
    
    try {
      const resposta = await fetch('http://localhost:3000/api/ia/gerar-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contexto })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setEmailGerado(`Erro ao gerar script: ${dados.mensagem || dados.erro}`);
        return;
      }

      setEmailGerado(dados.script);
    } catch (error) {
      setEmailGerado('Falha de conexão com o servidor da API (verifique se a porta 3000 está rodando).');
    } finally {
      setIsGerando(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-8 bg-gray-50 min-h-screen font-sans">
      
      {/* Coluna Esquerda: Inputs do Usuário */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Agente IA: Gerador de Cadência</h2>
        <p className="text-sm text-gray-600 mb-6">
          Forneça o contexto do prospecto para que a inteligência artificial crie um e-mail B2B hiper-personalizado.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Contexto do Cliente / Histórico</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
            rows={5}
            placeholder="Ex: Cliente já orçou conosco ano passado, reclamou do prazo de entrega de chapas onda dupla..."
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
          />
        </div>

        <button
          onClick={handleGerarEmail}
          disabled={isGerando}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded transition-colors disabled:bg-gray-400"
        >
          {isGerando ? 'Processando com IA...' : 'Gerar Script'}
        </button>
      </div>

      {/* Coluna Direita: Resultado Mockado */}
      <div className="flex-1 bg-blue-900 p-6 rounded-lg shadow-md text-white">
        <h3 className="text-lg font-bold mb-4 border-b border-blue-700 pb-2">Modelo Script | E-mail</h3>
        
        {emailGerado ? (
          <div className="whitespace-pre-wrap text-gray-100 text-sm leading-relaxed">
            {emailGerado}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-blue-300 italic text-sm">
            O script gerado aparecerá aqui...
          </div>
        )}

        {emailGerado && (
          <div className="mt-6 flex gap-3">
            <button
            onClick={() => navigator.clipboard.writeText(emailGerado)}
            className="flex-1 bg-white text-blue-900 font-medium py-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Copiar Texto
            </button>
            <button className="flex-1 bg-transparent border border-white text-white font-medium py-2 rounded hover:bg-blue-800 transition-colors">
              Salvar nos Favoritos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}