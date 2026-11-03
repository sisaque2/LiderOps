import { useEffect, useState, type FormEvent } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import { apiFetch, mensagemDeErro } from '../config/api';
import type { LeadEmpresa, Usuario } from '../types';

interface EmailGeneratorProps {
  usuario: Usuario;
}

interface EmailGerado {
  assunto: string;
  corpo: string;
}

const PRODUTOS = [
  { id: 'ondulado', label: 'Papelão ondulado' },
  { id: 'offset', label: 'Acoplado ao offset (premium)' },
  { id: 'ambos', label: 'Ondulado + offset' },
];

const OBJETIVOS = [
  { id: 'primeiro_contato', label: 'Primeiro contato' },
  { id: 'follow_up', label: 'Follow-up sem resposta' },
  { id: 'pos_orcamento', label: 'Retorno de orçamento' },
  { id: 'reativacao', label: 'Reativar cliente inativo' },
];

const TONS = [
  { id: 'consultivo', label: 'Consultivo' },
  { id: 'direto', label: 'Direto' },
  { id: 'cordial', label: 'Cordial' },
];

const inputClasse =
  'w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white';

export default function EmailGenerator({ usuario }: EmailGeneratorProps) {
  const [empresas, setEmpresas] = useState<LeadEmpresa[]>([]);
  const [idEmpresa, setIdEmpresa] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [segmento, setSegmento] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [cargoContato, setCargoContato] = useState('');
  const [produto, setProduto] = useState('ondulado');
  const [objetivo, setObjetivo] = useState('primeiro_contato');
  const [tom, setTom] = useState('consultivo');
  const [contexto, setContexto] = useState('');

  const [email, setEmail] = useState<EmailGerado | null>(null);
  const [isGerando, setIsGerando] = useState(false);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    apiFetch<LeadEmpresa[]>('/empresas')
      .then(setEmpresas)
      .catch(() => setEmpresas([]));
  }, []);

  const handleSelecionarEmpresa = (id: string) => {
    setIdEmpresa(id);
    const empresa = empresas.find((e) => String(e.id_empresa) === id);
    setNomeEmpresa(empresa ? empresa.razao_social : '');
  };

  const handleGerarEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!idEmpresa && nomeEmpresa.trim().length < 2) {
      setAlerta({ tipo: 'erro', texto: 'Selecione uma empresa da base ou informe o nome da empresa alvo.' });
      return;
    }
    if (contexto.trim().length < 10) {
      setAlerta({ tipo: 'erro', texto: 'Descreva o contexto do cliente com pelo menos 10 caracteres.' });
      return;
    }

    setIsGerando(true);
    setAlerta(null);
    setCopiado(false);
    try {
      const resposta = await apiFetch<{ email: EmailGerado }>('/ia/gerar-email', {
        method: 'POST',
        body: JSON.stringify({
          idEmpresa: idEmpresa ? Number(idEmpresa) : undefined,
          nomeEmpresa,
          segmento,
          nomeContato,
          cargoContato,
          produto,
          objetivo,
          tom,
          contexto,
        }),
      });
      setEmail(resposta.email);
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setIsGerando(false);
    }
  };

  const textoCompleto = email ? `Assunto: ${email.assunto}\n\n${email.corpo}` : '';
  const palavras = email ? email.corpo.trim().split(/\s+/).filter(Boolean).length : 0;
  const tamanhoIdeal = palavras >= 80 && palavras <= 140;

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(textoCompleto);
      setCopiado(true);
    } catch {
      setAlerta({ tipo: 'erro', texto: 'Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.' });
    }
  };

  const linkMailto = email
    ? `mailto:?subject=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.corpo)}`
    : '#';

  // Integra com o kanban: o e-mail enviado vira uma tarefa de follow-up com prazo de 3 dias
  const handleCriarFollowUp = async () => {
    const prazo = new Date();
    prazo.setDate(prazo.getDate() + 3);
    const empresa = nomeEmpresa.trim() || 'cliente';
    try {
      await apiFetch('/tarefas', {
        method: 'POST',
        body: JSON.stringify({
          titulo: `Follow-up: ${empresa}`.slice(0, 150),
          descricao: `E-mail enviado: "${email?.assunto}". Retomar contato${nomeContato ? ` com ${nomeContato}` : ''}.`,
          prioridade: 'media',
          prazo: prazo.toISOString().slice(0, 10),
        }),
      });
      setAlerta({ tipo: 'sucesso', texto: 'Tarefa de follow-up criada na aba Tarefas.' });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Coluna Esquerda: briefing do prospecto */}
      <form onSubmit={handleGerarEmail} noValidate className="flex-1 bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0f172a]">Agente IA: Gerador de E-mail</h2>
          <p className="text-sm text-gray-600 mt-1">
            Preencha o briefing do prospecto. O e-mail sai assinado por você ({usuario.nome}, {usuario.cargo}).
          </p>
        </div>

        <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa da base (opcional)</label>
            <select value={idEmpresa} onChange={(e) => handleSelecionarEmpresa(e.target.value)} className={inputClasse}>
              <option value="">— Digitar manualmente —</option>
              {empresas.map((emp) => (
                <option key={emp.id_empresa} value={emp.id_empresa}>{emp.razao_social}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa alvo</label>
            <input value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)} placeholder="Ex: Chocolates Garoto" className={inputClasse} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Segmento</label>
            <input value={segmento} onChange={(e) => setSegmento(e.target.value)} placeholder="Ex: Alimentos, Farmacêutico" className={inputClasse} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do contato</label>
            <input value={nomeContato} onChange={(e) => setNomeContato(e.target.value)} placeholder="Ex: Ana Souza" className={inputClasse} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo do contato</label>
            <input value={cargoContato} onChange={(e) => setCargoContato(e.target.value)} placeholder="Ex: Compradora" className={inputClasse} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto em foco</label>
            <select value={produto} onChange={(e) => setProduto(e.target.value)} className={inputClasse}>
              {PRODUTOS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo</label>
            <select value={objetivo} onChange={(e) => setObjetivo(e.target.value)} className={inputClasse}>
              {OBJETIVOS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium text-gray-700 mb-1">Tom</span>
          <div className="flex gap-2">
            {TONS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTom(t.id)}
                className={`px-4 py-1.5 rounded-full border text-sm transition-colors cursor-pointer ${
                  tom === t.id ? 'bg-[#0f172a] border-[#0f172a] text-white' : 'border-gray-300 text-gray-600 hover:border-gray-500'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contexto do cliente / histórico</label>
          <textarea
            className="w-full p-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none resize-none"
            rows={5}
            maxLength={1500}
            placeholder="Ex: Orçou conosco ano passado, reclamou do prazo de entrega de chapas onda dupla. Hoje compra de um fornecedor do Paraná."
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
          />
          <div className="text-right text-xs text-gray-400">{contexto.length}/1500</div>
        </div>

        <button
          type="submit"
          disabled={isGerando}
          className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-3 rounded transition-colors shadow cursor-pointer disabled:bg-gray-400"
        >
          {isGerando ? 'Processando com IA...' : email ? 'Gerar outra versão' : 'Gerar E-mail'}
        </button>
      </form>

      {/* Coluna Direita: resultado */}
      <div className="flex-1 bg-[#0f172a] p-6 rounded-lg shadow text-white flex flex-col">
        <h3 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">E-mail gerado</h3>

        {email ? (
          <>
            <div className="mb-3">
              <div className="text-xs uppercase text-gray-400 mb-1">Assunto</div>
              <div className="font-semibold text-green-400">{email.assunto}</div>
            </div>
            <div className="whitespace-pre-wrap text-gray-100 text-sm leading-relaxed bg-white/5 rounded p-4 flex-1">
              {email.corpo}
            </div>
            <div className={`mt-2 text-xs ${tamanhoIdeal ? 'text-green-400' : 'text-amber-300'}`}>
              {palavras} palavras {tamanhoIdeal ? '· tamanho ideal' : '· o ideal é entre 80 e 140'}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleCopiar}
                className="bg-white text-[#0f172a] font-medium py-2 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {copiado ? 'Copiado ✓' : 'Copiar texto'}
              </button>
              <a
                href={linkMailto}
                className="text-center border border-white text-white font-medium py-2 rounded hover:bg-white/10 transition-colors"
              >
                Abrir no e-mail
              </a>
              <button
                onClick={handleCriarFollowUp}
                className="bg-[#8BC53F] hover:bg-[#7ab135] text-white font-medium py-2 rounded transition-colors cursor-pointer"
              >
                Criar follow-up
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-64 text-gray-400 italic text-sm text-center px-6">
            {isGerando ? 'A IA está escrevendo o seu e-mail...' : 'O e-mail gerado aparecerá aqui, já com assunto e a sua assinatura.'}
          </div>
        )}
      </div>
    </div>
  );
}
