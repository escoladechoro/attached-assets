# Instituto Acaz Ribeiro — Sistema de Gestão Clínica

Sistema de gestão clínica completo para o Instituto Acaz Ribeiro (Brasília).

## Arquitetura

- **Frontend**: React + Vite (Tailwind CSS + Radix UI + shadcn/ui)  
  Rota: `/` — porta atribuída via `$PORT`
- **Backend**: Express 5 + Node.js  
  Porta: `8080` (interna)
- **Banco**: PostgreSQL via `DATABASE_URL` (Drizzle ORM)
- **Auth**: JWT via `SESSION_SECRET` — tokens em `localStorage` (chave: `acaz_token`)

## Estrutura do Monorepo

```
artifacts/
  acaz-clinic/       # Frontend React+Vite
  api-server/        # Backend Express 5

lib/
  db/                # Schema Drizzle + migrações
  api-spec/          # OpenAPI spec (openapi.yaml)
  api-zod/           # Schemas Zod gerados pelo Orval
  api-client-react/  # Hooks TanStack Query gerados pelo Orval
```

## Funcionalidades Implementadas

### Autenticação
- JWT com 3 roles: `gestao`, `recepcao`, `profissional`
- Login/Logout com token em localStorage
- Guard de rota no AppLayout (redirect para /login)
- Credenciais de seed: `admin@acaz.com / admin123`, `recepcao@acaz.com / admin123`

### Gestão de Clientes (`/clients`)
- Listagem paginada com busca
- Cadastro completo (CPF, endereço, data de nascimento, contato de emergência)
- Detalhe com histórico de contratos

### Gestão de Profissionais (`/professionals`)
- Listagem com status ativo/inativo
- Configuração de percentual de repasse (padrão: 70% pro / 30% clínica)
- Grade de horários semanais (`schedule_slots`)
- Estatísticas de receita por profissional

### Agenda (`/agenda`)
- Visualização diária dos agendamentos
- Criação com seleção de horários disponíveis (sem conflito)
- Atualização de status: Agendado → Confirmado → Concluído / Cancelado / Falta

### Serviços e Pacotes (`/services`)
- Catálogo de serviços avulsos (preço, duração, categoria)
- Pacotes de sessões com validade

### Vendas com Split Financeiro (`/sales`)
- Registro de venda (serviço ou pacote)
- Cálculo automático de taxas de gateway:
  - PIX / Dinheiro: 0%
  - Débito: 2%
  - Crédito: 3,5%
- Split automático: clínica (30%) / profissional (70%) sobre valor líquido
- Detalhe de cada venda com breakdown completo

### Contratos e Sessões (`/contracts`)
- Criação de contrato vinculado a pacote
- Tracking de sessões utilizadas vs total
- Registro de nova sessão com data e observações
- Status: ativo → concluído (automático ao usar todas as sessões)

### Dashboard (`/dashboard`)
- Resumo do período: agendamentos, receita total, novos clientes, contratos ativos
- Agendamentos do dia com status
- Vendas recentes

### Relatórios (`/reports`)
- Relatório financeiro: receita bruta, taxas, líquido, breakdown por método de pagamento, por profissional, por serviço
- Relatório de agendamentos: total, por status, por profissional
- Visualização com gráficos (Recharts)

## Banco de Dados — Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários do sistema (login) |
| `clients` | Clientes da clínica |
| `professionals` | Profissionais com percentual de repasse |
| `schedule_slots` | Grade de horários por profissional |
| `services` | Serviços avulsos |
| `packages` | Pacotes de sessões |
| `appointments` | Agendamentos (com detecção de conflito) |
| `sales` | Vendas com split pré-calculado |
| `contracts` | Contratos de pacote |
| `contract_sessions` | Sessões executadas de cada contrato |

## Variáveis de Ambiente Necessárias

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Conexão PostgreSQL |
| `SESSION_SECRET` | Chave de assinatura JWT |
| `PORT` | Porta do frontend (atribuída automaticamente) |

## Dados de Seed

- 3 profissionais com grades de horário
- 3 clientes
- 6 serviços
- 3 pacotes
- 2 usuários (gestao + recepcao)

## Correções Aplicadas

- Import incorreto em `auth.tsx` (`src/custom-fetch` → exportação correta)
- setState durante render em `AppLayout` → movido para `useEffect`
- Token JWT não enviado antes do `refetch()` → setter aplicado de forma síncrona no `login()`
- Redirect da rota raiz via `window.location.href` → `<Redirect>` do wouter
- 5 endpoints retornando array simples → formato `{ data: [], total: X }`
- Schemas Zod com `z.date()` em query params → `z.string()` (reports, agenda, slots)
