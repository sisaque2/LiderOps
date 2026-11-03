import { useEffect, useState, type DragEvent, type FormEvent } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import { useConfirmacao } from '../hooks/useConfirmacao';
import { apiFetch, mensagemDeErro } from '../config/api';
import type { Prioridade, StatusTarefa, Tarefa } from '../types';

const COLUNAS: { id: StatusTarefa; titulo: string; cor: string }[] = [
  { id: 'aguardando', titulo: 'Aguardando', cor: 'bg-slate-400' },
  { id: 'em_andamento', titulo: 'Em andamento', cor: 'bg-blue-500' },
  { id: 'concluida', titulo: 'Concluídas', cor: 'bg-[#8BC53F]' },
];

const PRIORIDADES: Record<Prioridade, { label: string; classe: string }> = {
  alta: { label: 'Alta', classe: 'bg-red-50 text-red-700' },
  media: { label: 'Média', classe: 'bg-amber-50 text-amber-700' },
  baixa: { label: 'Baixa', classe: 'bg-gray-100 text-gray-600' },
};

interface FormTarefa {
  titulo: string;
  descricao: string;
  prioridade: Prioridade;
  prazo: string;
  status: StatusTarefa;
}

const FORM_VAZIO: FormTarefa = { titulo: '', descricao: '', prioridade: 'media', prazo: '', status: 'aguardando' };

const hojeISO = () => new Date().toLocaleDateString('sv-SE');

const formatarPrazo = (prazo: string) => {
  const [ano, mes, dia] = prazo.split('-');
  return `${dia}/${mes}/${ano}`;
};

const inputClasse =
  'w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white';

export default function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarOcultas, setMostrarOcultas] = useState(false);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const { confirmar, dialogo } = useConfirmacao();

  const [formAberto, setFormAberto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState<FormTarefa>(FORM_VAZIO);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [arrastandoId, setArrastandoId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<StatusTarefa | null>(null);

  useEffect(() => {
    apiFetch<Tarefa[]>('/tarefas')
      .then(setTarefas)
      .catch((error) => setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) }))
      .finally(() => setCarregando(false));
  }, []);

  const substituir = (atualizada: Tarefa) =>
    setTarefas((lista) => lista.map((t) => (t.id_tarefa === atualizada.id_tarefa ? atualizada : t)));

  // ---------- Formulário (criar / editar) ----------
  const abrirNova = () => {
    setEditandoId(null);
    setForm(FORM_VAZIO);
    setErroForm('');
    setFormAberto(true);
  };

  const abrirEdicao = (t: Tarefa) => {
    setEditandoId(t.id_tarefa);
    setForm({
      titulo: t.titulo,
      descricao: t.descricao ?? '',
      prioridade: t.prioridade,
      prazo: t.prazo ?? '',
      status: t.status,
    });
    setErroForm('');
    setFormAberto(true);
  };

  const fecharForm = () => {
    setFormAberto(false);
    setEditandoId(null);
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    if (form.titulo.trim().length < 3) {
      setErroForm('O título deve ter pelo menos 3 caracteres.');
      return;
    }

    setSalvando(true);
    setErroForm('');
    try {
      const corpo = JSON.stringify({ ...form, prazo: form.prazo || null });
      if (editandoId) {
        const { dados } = await apiFetch<{ dados: Tarefa }>(`/tarefas/${editandoId}`, { method: 'PUT', body: corpo });
        substituir(dados);
        setAlerta({ tipo: 'sucesso', texto: 'Tarefa atualizada.' });
      } else {
        const { dados } = await apiFetch<{ dados: Tarefa }>('/tarefas', { method: 'POST', body: corpo });
        setTarefas((lista) => [...lista, dados]);
        setAlerta({ tipo: 'sucesso', texto: 'Tarefa criada.' });
      }
      fecharForm();
    } catch (error) {
      setErroForm(mensagemDeErro(error));
    } finally {
      setSalvando(false);
    }
  };

  // ---------- Ações dos cards ----------
  // Atualização otimista: move na tela na hora e desfaz se a API recusar
  const mover = async (tarefa: Tarefa, status: StatusTarefa) => {
    if (tarefa.status === status) return;
    substituir({ ...tarefa, status });
    try {
      const { dados } = await apiFetch<{ dados: Tarefa }>(`/tarefas/${tarefa.id_tarefa}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      substituir(dados);
    } catch (error) {
      substituir(tarefa);
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  const alternarOculta = async (tarefa: Tarefa) => {
    try {
      const { dados } = await apiFetch<{ dados: Tarefa }>(`/tarefas/${tarefa.id_tarefa}/ocultar`, {
        method: 'PATCH',
        body: JSON.stringify({ oculta: !tarefa.oculta }),
      });
      substituir(dados);
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  const excluir = async (tarefa: Tarefa) => {
    const ok = await confirmar('Excluir tarefa', `"${tarefa.titulo}" será excluída. Essa ação não pode ser desfeita.`);
    if (!ok) return;
    try {
      await apiFetch(`/tarefas/${tarefa.id_tarefa}`, { method: 'DELETE' });
      setTarefas((lista) => lista.filter((t) => t.id_tarefa !== tarefa.id_tarefa));
      if (editandoId === tarefa.id_tarefa) fecharForm();
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  // ---------- Drag and drop entre colunas ----------
  const handleDragStart = (e: DragEvent, id: number) => {
    e.dataTransfer.effectAllowed = 'move';
    setArrastandoId(id);
  };

  const handleDrop = (e: DragEvent, status: StatusTarefa) => {
    e.preventDefault();
    const tarefa = tarefas.find((t) => t.id_tarefa === arrastandoId);
    if (tarefa) mover(tarefa, status);
    setArrastandoId(null);
    setColunaAlvo(null);
  };

  const visiveis = tarefas.filter((t) => mostrarOcultas || !t.oculta);
  const totalOcultas = tarefas.filter((t) => t.oculta).length;
  const hoje = hojeISO();

  return (
    <div className="space-y-6">
      {dialogo}
      <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Pipeline de Tarefas</h2>
          <p className="text-sm text-gray-300">Arraste os cards entre as colunas ou use as setas para mudar o status.</p>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={mostrarOcultas}
              onChange={(e) => setMostrarOcultas(e.target.checked)}
              className="accent-[#8BC53F]"
            />
            Mostrar ocultas ({totalOcultas})
          </label>
          <button
            onClick={abrirNova}
            className="bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2 px-4 rounded shadow transition-colors cursor-pointer"
          >
            + Nova tarefa
          </button>
        </div>
      </div>

      <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

      {formAberto && (
        <form onSubmit={handleSalvar} noValidate className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
          <h3 className="font-semibold text-gray-800">{editandoId ? 'Editar tarefa' : 'Nova tarefa'}</h3>
          {erroForm && <Alerta alerta={{ tipo: 'erro', texto: erroForm }} />}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
              <input
                autoFocus
                maxLength={150}
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Ligar para o comprador da Garoto"
                className={inputClasse}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
              <select
                value={form.prioridade}
                onChange={(e) => setForm({ ...form, prioridade: e.target.value as Prioridade })}
                className={inputClasse}
              >
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
              <input
                type="date"
                value={form.prazo}
                onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                className={inputClasse}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea
                rows={2}
                maxLength={2000}
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes, próximos passos..."
                className={`${inputClasse} resize-none`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as StatusTarefa })}
                className={inputClasse}
              >
                {COLUNAS.map((c) => <option key={c.id} value={c.id}>{c.titulo}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={fecharForm} className="px-4 py-2 rounded border border-gray-300 text-gray-600 text-sm hover:bg-gray-50 cursor-pointer">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 rounded bg-[#0f172a] hover:bg-slate-800 text-white text-sm font-medium cursor-pointer disabled:bg-gray-400"
            >
              {salvando ? 'Salvando...' : editandoId ? 'Salvar alterações' : 'Criar tarefa'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUNAS.map((coluna, idx) => {
          const cards = visiveis.filter((t) => t.status === coluna.id);
          return (
            <section
              key={coluna.id}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(coluna.id);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setColunaAlvo(null);
              }}
              onDrop={(e) => handleDrop(e, coluna.id)}
              className={`bg-gray-100 rounded-lg p-3 min-h-80 transition-colors ${
                colunaAlvo === coluna.id ? 'ring-2 ring-[#8BC53F] bg-green-50' : ''
              }`}
            >
              <header className="flex items-center justify-between px-1 mb-3">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <span className={`w-2.5 h-2.5 rounded-full ${coluna.cor}`} />
                  {coluna.titulo}
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white rounded-full px-2 py-0.5">{cards.length}</span>
              </header>

              <div className="space-y-3">
                {carregando && <p className="text-sm text-gray-400 italic px-1">Carregando...</p>}
                {!carregando && cards.length === 0 && (
                  <p className="text-sm text-gray-400 italic px-1">Nenhuma tarefa aqui.</p>
                )}

                {cards.map((t) => {
                  const pendente = t.status !== 'concluida';
                  const atrasada = pendente && t.prazo && t.prazo < hoje;
                  const venceHoje = pendente && t.prazo === hoje;
                  return (
                    <article
                      key={t.id_tarefa}
                      draggable
                      onDragStart={(e) => handleDragStart(e, t.id_tarefa)}
                      onDragEnd={() => setArrastandoId(null)}
                      className={`bg-white rounded-md shadow-sm border border-gray-200 p-3 cursor-grab active:cursor-grabbing ${
                        t.oculta ? 'opacity-50' : ''
                      } ${arrastandoId === t.id_tarefa ? 'ring-2 ring-[#0f172a]' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold text-[#0f172a] ${t.status === 'concluida' ? 'line-through text-gray-500' : ''}`}>
                          {t.titulo}
                        </h4>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${PRIORIDADES[t.prioridade].classe}`}>
                          {PRIORIDADES[t.prioridade].label}
                        </span>
                      </div>

                      {t.descricao && <p className="text-xs text-gray-600 mt-1 line-clamp-3 whitespace-pre-line">{t.descricao}</p>}

                      {t.prazo && (
                        <p
                          className={`text-xs mt-2 ${
                            atrasada ? 'text-red-600 font-semibold' : venceHoje ? 'text-amber-600 font-semibold' : 'text-gray-500'
                          }`}
                        >
                          📅 {formatarPrazo(t.prazo)}
                          {atrasada ? ' · atrasada' : venceHoje ? ' · vence hoje' : ''}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                        <div className="flex gap-1">
                          <button
                            onClick={() => mover(t, COLUNAS[idx - 1].id)}
                            disabled={idx === 0}
                            aria-label="Mover para a coluna anterior"
                            className="w-7 h-7 rounded border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ◀
                          </button>
                          <button
                            onClick={() => mover(t, COLUNAS[idx + 1].id)}
                            disabled={idx === COLUNAS.length - 1}
                            aria-label="Mover para a próxima coluna"
                            className="w-7 h-7 rounded border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            ▶
                          </button>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <button onClick={() => abrirEdicao(t)} className="text-blue-700 hover:underline cursor-pointer">Editar</button>
                          <button onClick={() => alternarOculta(t)} className="text-gray-600 hover:underline cursor-pointer">
                            {t.oculta ? 'Mostrar' : 'Ocultar'}
                          </button>
                          <button onClick={() => excluir(t)} className="text-red-600 hover:underline cursor-pointer">Excluir</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
