# Meu planejamento

App privado (só você) para rotina, estudos, finanças e a gestão do apartamento.
Stack: Next.js 16 + TypeScript, Tailwind 4, Supabase (Postgres, Auth, Storage), deploy na Vercel.

## Fase 1

Base do projeto, tema dark, sidebar responsiva, login, proxy de sessão, rotas dos 6 módulos
e schema do banco com RLS.

## Fase 2: Meu Apartamento

- Painel financeiro do imóvel: teto editável, total gasto (obras + compras pagas), saldo e progresso geral
  (etapas e obras concluídas).
- Etapas & Documentação (com botão para criar as etapas padrão), Obras & Reformas (orçado x pago, status),
  Compras & Enxoval (filtros por cômodo e status).
- Design de Interiores: galeria por ambiente, upload com compressão (WebP, lado maior 1600 px) para o bucket
  privado `apt-images`, lightbox com zoom, paleta que copia o Hex, links de referência e caderno técnico.
- Não precisa de nova migration: usa as tabelas da `0001_init.sql`.

## Como rodar

1. **Supabase**: crie um projeto. Em _SQL Editor_, rode `supabase/migrations/0001_init.sql`.
2. **Sua conta**: em _Authentication > Users_, clique em _Add user_ e crie seu e-mail e senha.
   Depois, em _Authentication > Sign In / Providers_, desative _Allow new users to sign up_.
3. **Chaves**: copie `.env.example` para `.env.local` e preencha a URL do projeto e a chave
   publishable (`sb_publishable_...`, em _Settings > API Keys_). Nunca use a secret key no front-end.
4. Instale e rode:
   ```bash
   npm install
   npm run dev
   ```
   Abra http://localhost:3000 e entre com a conta criada.
5. **Vercel**: importe o repositório e cadastre as duas variáveis de ambiente do passo 3.

## Fase 3: Finanças, Planejamento e Estudos

- **Planejamento & Metas:** horizontes diário, semanal, semestral e anual; tarefas com categoria, prioridade e data;
  metas com marco e slider de 0 a 100%.
- **Estudos:** ciclo de 4 etapas por tópico (25% cada), domínio por tópico e progresso geral; repositório de links.
- **Finanças:** navegação por mês, 4 cards (receitas, despesas, saldo livre, investimentos), gastos por categoria,
  cofrinhos com aporte (+ Guardar) e lançamentos filtrados por forma de pagamento.
  Saldo livre = receitas − despesas − investimentos. Cada aporte (+ Guardar) vira um lançamento de débito na categoria Investimentos.
- Não precisa de nova migration.

## Fase 4 (este pacote): Rotina, Visão Geral e Excel

- **Rotina & Hábitos:** grade segunda a domingo com navegação por semana e consistência semanal, método 10-10-10
  e espaço pessoal (gratidão, desejos e coisas que amo fazer).
- **Visão Geral:** banner com atalhos (Meu Apartamento com % de conclusão e Novo lançamento), 4 KPIs
  (saldo do mês com investido, progresso das metas, orçamento do apê, hábitos da semana) e 3 painéis
  (prioridades de hoje, obras e etapas, cofrinhos).
- **Dados** (rodapé da sidebar):
  - _Exportar Excel_: gera `lifeos-AAAA-MM-DD.xlsx` com as 6 abas `Finanças`, `Tarefas_Metas`, `Estudos`,
    `Ap_Obras_Compras`, `Ap_Design_Interiores` e `Habitos_DevPessoal`. Cada aba tem blocos marcados com `## nome`.
  - _Importar Excel_: lê esses blocos e **adiciona** as linhas aos dados atuais (não apaga nem deduplica).
    Use planilhas exportadas pelo próprio app. Imagens enviadas do computador não vão na planilha, só URLs.
  - _Dados de exemplo_: adiciona um conjunto pequeno de exemplos. _Apagar meus dados_: limpa tudo, inclusive imagens.
- A biblioteca `xlsx` vem do npm (0.18.5), que tem avisos de segurança conhecidos ao abrir arquivos de terceiros.
  Importe apenas planilhas suas.

## Estrutura

```
app/(app)/<modulo>/page.tsx     páginas (servidor) que buscam os dados
components/<modulo>/*           telas interativas (cliente)
lib/supabase/*                  clientes e proxy de sessão
lib/excel.ts · lib/demo.ts      Excel, dados de exemplo e limpeza
supabase/migrations/0001_init.sql
```

## Segurança

- Todas as tabelas têm RLS: `auth.uid() = user_id` em select, insert, update e delete.
- O bucket `apt-images` é privado e os arquivos ficam em `<user_id>/...`.
- O proxy usa `getClaims()` (valida a assinatura do token) e redireciona para `/login` sem sessão.
- `robots: noindex` no layout.
