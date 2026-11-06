/**
 * Usuários fictícios (README: credenciais). Só o hash SHA-256 de `salt:senha` é guardado, nunca a senha.
 * Senhas: ana@kurio.test = Kurio@123 · bruno@kurio.test = Kurio@456
 */
export type UserRecord = {
  id: string
  name: string
  email: string
  salt: string
  passwordHash: string
  avatarUrl: string | null
}

export function buildUserFixtures(): UserRecord[] {
  return [
    {
      id: 'user-ana',
      name: 'Ana Colecionadora',
      email: 'ana@kurio.test',
      salt: 'kurio-salt-ana',
      passwordHash: '1cf032b454b775fa6664d257bc37f265ce10786c486a44d10489adb60c9d2446',
      avatarUrl: null,
    },
    {
      id: 'user-bruno',
      name: 'Bruno Criador',
      email: 'bruno@kurio.test',
      salt: 'kurio-salt-bruno',
      passwordHash: 'e532cd3f6c758aaf345e51ce5ee93d5323929ee1380c015542e55a2627cd4f56',
      avatarUrl: null,
    },
  ]
}
