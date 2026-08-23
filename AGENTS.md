# AGENTS.md — Open Agentic Ops

Regras específicas deste projeto. Em caso de conflito com o `AGENTS.md` global, estas têm prioridade.

## O que é este repo

Repositório da **Sensedia Open Agentic Ops**: uma squad agêntica autônoma que opera o ciclo de vida de Open Finance — de norma regulatória, demanda de cliente ou decisão estratégica até deploy monitorado — com um único FDE (Forward Deployed Engineer) garantindo julgamento humano onde a ambiguidade exige.

Este repo é o **runtime da squad**. O opencode é a ferramenta usada para desenvolver este projeto. A arquitetura de referência está em `Inicio/sensedia-open-agentic-ops.md` e `Inicio/diagrama-squad-open-agentic-ops-texto.md`.

## Papéis da squad (topologia)

| Papel | Tipo | Responsabilidade central |
|---|---|---|
| **Intake Agent** | Platform (extensão) | Recebe as 4 origens (Cliente, Regulatório/Informes, Estratégia/Sensedia, SRE), classifica domínio e ambiguidade. Baixa ambiguidade + precedente → rascunha spec; alta ambiguidade → escala ao FDE |
| **FDE** *(humano)* | — | Autoria de spec (só alta ambiguidade), aprovador único no HITL gate, auditor periódico das classificações do Intake (sempre prospectivo) |
| **Feature Agent (backend)** | Stream-aligned | Implementa a feature no domínio backend |
| **Feature Agent (frontend)** | Stream-aligned | Implementa a feature no domínio frontend |
| **Platform Agent** | Platform | Testes, lint, deploy, observabilidade como serviço — instância única, agnóstica de stack |
| **Review Agent** | Enabling | Feedback de PR contra padrões do time; orienta, não bloqueia |
| **Architecture Agent** | Complicated-subsystem | Discussão síncrona em contrato de API externo/compliance; registra ADR; aconselha, não veta |
| **SRE Agent** | Platform (extensão) | Monitora SLOs/error budget; gera task automática que realimenta o board como 4ª origem |

## Gates

- **HITL gate**: FDE aprova o merge — nenhum merge sem humano na cadeia, inclusive specs autoradas só pelo Intake.
- **Eval gate**: trajectory eval (PromptFoo) como condição não-negociável antes do deploy.

## Regras de design (não reabrir sem motivo forte)

- **Sem QA Agent separado.** Qualidade é propriedade do harness (Sensores + Eval gate), não um papel à parte.
- **Platform Agent é uma única instância agnóstica de stack**, não "backend" nem "frontend".
- **Skill de domínio = Guia (feedforward), não agente novo.** O mesmo runtime roda para os dois Feature Agents; a diferença é só qual skill cada instância carrega.
- **Architecture Agent aconselha, não veta.** A decisão fica com o Feature Agent, registrada como ADR.
- **Discordância de Review/Architecture sobre classificação em andamento → sempre pausa e escala pro FDE.** Sem hierarquia de severidade.
- **Correção de auditoria do FDE é sempre prospectiva** — nunca reabre implementação já feita, só realimenta a heurística de triagem do Intake.
- **PII sempre mascarado na fronteira de entrada (Intake)** — ancorado em classificação LGPD (dado pessoal/sensível), informado pelo perfil de segurança do Open Finance (FAPI-BR). Nunca dado raw em comunicação inter-agente, checkpointer, telemetria, evals ou logs (ver ADR-0006).
- **Protocolo é definido pelo modo de interação (Team Topologies), não por "quem está do outro lado".** X-as-a-Service/trigger → MCP; Collaboration/Facilitating → A2A.

## Convenções de desenvolvimento

- **Todo desenvolvimento desta oferta segue o padrão SDD (Spec-Driven Development) e SPDD (Spec-Driven Product Development).** Nenhuma implementação começa sem spec aprovada; o pipeline é `proposal.md → design.md → spec.md → tasks.md → prompt.md` (OpenSpec/SPDD), com artefatos em `openspec/`.
- **Feature start workflow (playbook):** toda nova feature começa com um **Feature Intake Brief** em `docs/sdd/feature-intakes/<feature-name>.md` (template em `docs/sdd/feature-intake-template.md`), seguido de **safe analysis** (sem modificar arquivos) e só então `/opsx:propose <feature-name>`. O processo completo está em `docs/sdd/feature-start-playbook.md`. Fluxo: `Intake Brief → Safe Analysis → /opsx:propose → Review → Validate → Apply → Test → Archive`.
- **Estrutura OpenSpec canônica:** `openspec/changes/<feature>/{proposal.md, design.md, specs/<feature>/spec.md, tasks.md}`; changes concluídos vão para `openspec/archive/<date>-<feature>/`. Não usar `openspec/changes/archive/`. O `prompt.md` é artefato SPDD (fora do schema OpenSpec). ADRs permanecem em `docs/adr/` (convenção Nygard).
- **Comandos `/opsx:*`:** `explore`, `propose`, `apply`, `archive` (em `.opencode/commands/`) orquestram o fluxo OpenSpec via CLI `openspec`.
- **Ao finalizar a sessão, gerar/atualizar `HANDOFF.md` na raiz** com o estado atual, decisões fechadas, artefatos, próximos passos e pendências. Este é o padrão obrigatório de encerramento de sessão.
- Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) para o guia de contribuição (fluxo SDD/SPDD, validação, commits).
- Siga as convenções do projeto; mudanças mínimas e alinhadas à tarefa.
- Rode lint e testes antes de concluir, quando disponíveis.
- Sem comentários não solicitados no código.
- Dados de cliente são confidenciais; nunca invente fatos sobre clientes — marque suposições explicitamente.
