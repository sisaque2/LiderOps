import { useEffect, useState } from 'react';
import Alerta, { type MensagemAlerta } from '../components/Alerta';
import { useConfirmacao } from '../hooks/useConfirmacao';
import ConviteCadastro from '../components/admin/ConviteCadastro';
import BaseReceita from '../components/admin/BaseReceita';
import { apiFetch, mensagemDeErro } from '../config/api';
import type { Perfil, Usuario } from '../types';

interface UsuariosProps {
  usuario: Usuario;
}

// Tela exclusiva do admin: código de convite, carga da base da Receita e gestão de usuários
export default function Usuarios({ usuario }: UsuariosProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [alerta, setAlerta] = useState<MensagemAlerta | null>(null);
  const [resetandoId, setResetandoId] = useState<number | null>(null);
  const { confirmar, dialogo } = useConfirmacao();
  const [novaSenha, setNovaSenha] = useState('');

  useEffect(() => {
    apiFetch<Usuario[]>('/usuarios')
      .then(setUsuarios)
      .catch((error) => setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) }))
      .finally(() => setCarregando(false));
  }, []);

  const alterarPerfil = async (alvo: Usuario, perfil: Perfil) => {
    try {
      const { dados } = await apiFetch<{ dados: Usuario }>(`/usuarios/${alvo.id_usuario}`, {
        method: 'PUT',
        body: JSON.stringify({ nome: alvo.nome, email: alvo.email, cargo: alvo.cargo, perfil }),
      });
      setUsuarios((lista) => lista.map((u) => (u.id_usuario === dados.id_usuario ? dados : u)));
      setAlerta({ tipo: 'sucesso', texto: `${dados.nome} agora é ${perfil === 'admin' ? 'administrador' : 'usuário comum'}.` });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  // "Esqueci minha senha": o admin define uma senha provisória e repassa ao usuário
  const redefinirSenha = async (alvo: Usuario) => {
    if (novaSenha.length < 6) {
      setAlerta({ tipo: 'erro', texto: 'A senha provisória deve ter pelo menos 6 caracteres.' });
      return;
    }
    try {
      await apiFetch(`/usuarios/${alvo.id_usuario}/senha`, {
        method: 'PATCH',
        body: JSON.stringify({ novaSenha }),
      });
      setAlerta({ tipo: 'sucesso', texto: `Senha de ${alvo.nome} redefinida. Repasse a senha provisória e peça para trocar em Minha conta.` });
      setResetandoId(null);
      setNovaSenha('');
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  const excluir = async (alvo: Usuario) => {
    const ok = await confirmar('Excluir usuário', `A conta de ${alvo.nome} e as tarefas dessa pessoa serão removidas.`);
    if (!ok) return;
    try {
      await apiFetch(`/usuarios/${alvo.id_usuario}`, { method: 'DELETE' });
      setUsuarios((lista) => lista.filter((u) => u.id_usuario !== alvo.id_usuario));
      setAlerta({ tipo: 'sucesso', texto: 'Usuário removido.' });
    } catch (error) {
      setAlerta({ tipo: 'erro', texto: mensagemDeErro(error) });
    }
  };

  return (
    <div className="space-y-6">
      {dialogo}
      <div className="bg-[#0f172a] text-white p-6 rounded-lg shadow">
        <span className="bg-green-500 text-xs font-bold px-2 py-1 rounded text-white mb-3 inline-block">ADMINISTRAÇÃO</span>
        <h2 className="text-xl font-bold">Administração</h2>
        <p className="text-sm text-gray-300">Controle quem pode se cadastrar, mantenha a base de garimpo atualizada e gerencie os acessos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConviteCadastro />
        <BaseReceita />
      </div>

      <Alerta alerta={alerta} onFechar={() => setAlerta(null)} />

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100 overflow-x-auto">
        <h3 className="font-bold text-gray-800 mb-4">Usuários e permissões</h3>
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3" aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">Carregando...</td></tr>
            )}
            {usuarios.map((u) => {
              const ehVoce = u.id_usuario === usuario.id_usuario;
              return (
                <tr key={u.id_usuario} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium text-[#0f172a]">
                    {u.nome} {ehVoce && <span className="text-xs text-gray-400">(você)</span>}
                  </td>
                  <td className="px-4 py-4 text-gray-600">{u.email}</td>
                  <td className="px-4 py-4 text-gray-600">{u.cargo}</td>
                  <td className="px-4 py-4">
                    <select
                      value={u.perfil}
                      disabled={ehVoce}
                      onChange={(e) => alterarPerfil(u, e.target.value as Perfil)}
                      aria-label={`Perfil de ${u.nome}`}
                      className="p-1.5 border border-gray-300 rounded text-sm bg-white disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="comum">Comum</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    {resetandoId === u.id_usuario ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="text"
                          autoFocus
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          placeholder="Senha provisória"
                          aria-label={`Nova senha para ${u.nome}`}
                          className="w-36 p-1.5 border border-gray-300 rounded text-xs"
                        />
                        <button onClick={() => redefinirSenha(u)} className="text-xs text-green-700 font-semibold hover:underline cursor-pointer">
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setResetandoId(null);
                            setNovaSenha('');
                          }}
                          className="text-xs text-gray-500 hover:underline cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      !ehVoce && (
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => {
                              setResetandoId(u.id_usuario);
                              setNovaSenha('');
                            }}
                            className="text-xs text-blue-700 hover:underline cursor-pointer"
                          >
                            Redefinir senha
                          </button>
                          <button onClick={() => excluir(u)} className="text-xs text-red-600 hover:underline cursor-pointer">
                            Excluir
                          </button>
                        </div>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
