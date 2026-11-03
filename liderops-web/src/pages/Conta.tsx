import { useState, type FormEvent } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import CampoSenha from '../components/CampoSenha';
import { apiFetch, mensagemDeErro } from '../config/api';
import type { Usuario } from '../types';

interface ContaProps {
  usuario: Usuario;
}

const inputClasse =
  'w-full p-2.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:outline-none';

export default function Conta({ usuario }: ContaProps) {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const [salvando, setSalvando] = useState(false);

  const handleTrocarSenha = async (e: FormEvent) => {
    e.preventDefault();
    if (!senhaAtual) return setAlerta({ tipo: 'erro', texto: 'Informe a senha atual.' });
    if (novaSenha.length < 6) return setAlerta({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 6 caracteres.' });
    if (novaSenha !== confirmar) return setAlerta({ tipo: 'erro', texto: 'A confirmação não confere com a nova senha.' });

    setSalvando(true);
    try {
      const { mensagem } = await apiFetch<{ mensagem: string }>('/usuarios/me/senha', {
        method: 'PATCH',
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      setAlerta({ tipo: 'sucesso', texto: mensagem });
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmar('');
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow self-start">
        <span className="bg-green-500 text-xs font-bold px-2 py-1 rounded text-white mb-4 inline-block">MINHA CONTA</span>
        <h2 className="text-xl font-bold mb-4">{usuario.nome}</h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-400 text-xs">E-mail</dt>
            <dd>{usuario.email}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs">Cargo</dt>
            <dd>{usuario.cargo}</dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs">Perfil de acesso</dt>
            <dd>{usuario.perfil === 'admin' ? 'Administrador' : 'Comum'}</dd>
          </div>
        </dl>
      </div>

      <form onSubmit={handleTrocarSenha} noValidate className="bg-white p-6 rounded-lg shadow border border-gray-100 space-y-4">
        <h3 className="font-semibold text-gray-800">Alterar senha</h3>
        <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />
        <div>
          <label htmlFor="senhaAtual" className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
          <CampoSenha id="senhaAtual" autoComplete="current-password" value={senhaAtual} onChange={setSenhaAtual} className={inputClasse} />
        </div>
        <div>
          <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
          <CampoSenha id="novaSenha" autoComplete="new-password" value={novaSenha} onChange={setNovaSenha} className={inputClasse} mostrarForca />
        </div>
        <div>
          <label htmlFor="confirmarNova" className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
          <CampoSenha id="confirmarNova" autoComplete="new-password" value={confirmar} onChange={setConfirmar} className={inputClasse} />
        </div>
        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-[#8BC53F] hover:bg-[#7ab135] text-white font-bold py-2.5 rounded shadow transition-colors cursor-pointer disabled:bg-gray-400"
        >
          {salvando ? 'Salvando...' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}
