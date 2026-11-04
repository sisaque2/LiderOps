// Telas do app e o nome de cada uma (usado no menu e no título da aba do navegador)
export const TELAS = {
  leads: 'Higienizar Dados',
  emails: 'Gerar E-mail',
  tarefas: 'Tarefas',
  usuarios: 'Administração',
  conta: 'Minha conta',
} as const;

export type Tela = keyof typeof TELAS;
