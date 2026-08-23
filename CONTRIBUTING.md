# Contribuindo — Open Agentic Ops

Guia de contribuição para o runtime da squad. Leia também [`AGENTS.md`](AGENTS.md) (regras de desenvolvimento e papéis da squad) e [`README.md`](README.md) (visão geral).

## Fluxo de desenvolvimento (SDD/SPDD + OpenSpec)

Todo desenvolvimento segue o padrão **Spec-Driven Development (SDD)** e **Spec-Driven Product Development (SPDD)**, orquestrado pelo CLI `openspec` e pelos comandos `/opsx:*` do OpenCode.

**Nenhuma implementação começa sem spec aprovada.** O pipeline é `proposal.md → design.md → spec.md → tasks.md → prompt.md` (OpenSpec/SPDD), com artefatos em `openspec/`.

**Fluxo de nova feature:**

```txt
Feature Intake Brief
→ Safe Analysis
→ /opsx:propose
→ Review OpenSpec
→ Validate
→ Apply
→ Test
→ Archive
```

1. **Feature Intake Brief** em `docs/sdd/feature-intakes/<feature-name>.md` (template em `docs/sdd/feature-intake-template.md`).
2. **Safe analysis** antes de propor (sem modificar arquivos).
3. **`/opsx:propose <feature-name>`** cria `proposal.md`, `design.md`, `specs/<feature>/spec.md` e `tasks.md`.
4. **`/opsx:apply <feature-name>`** implementa as tasks.
5. **`/opsx:archive <feature-name>`** arquiva o change concluído em `openspec/archive/<date>-<feature>/`.

O processo completo está em [`docs/sdd/feature-start-playbook.md`](docs/sdd/feature-start-playbook.md).

## Estrutura OpenSpec canônica

- Changes em `openspec/changes/<feature>/{proposal.md, design.md, specs/<feature>/spec.md, tasks.md}`.
- Changes concluídos vão para `openspec/archive/<date>-<feature>/` (não usar `openspec/changes/archive/`).
- O `prompt.md` é artefato SPDD (fora do schema OpenSpec).
- ADRs permanecem em `docs/adr/` (convenção Nygard).

## Padrões de código

- **Stack:** Python + LangGraph + LangSmith + OTel. Hexagonal leve só nas bordas (ports).
- **Sem comentários não solicitados** no código.
- **Mudanças mínimas e alinhadas à tarefa** — siga as convenções do projeto.
- **PII sempre mascarado na fronteira de entrada (Intake)** — nunca dado raw em comunicação inter-agente, checkpointer, telemetria, evals ou logs (ADR-0006).

## Validação (antes de concluir)

Rode lint e testes antes de concluir:

```bash
# Backend
poetry run pytest
poetry run ruff check .

# Frontend
cd frontend && npm run lint
cd frontend && npm run build
cd frontend && npm test
```

## Commits

- Commits pequenos e coesos, mensagens claras seguindo o estilo do repositório (ex.: `feat(runtime):`, `fix(console):`, `docs:`).
- Nunca commite secrets ou chaves — verifique antes de qualquer `git add`/`commit`.
- Nunca `push`, `rebase`, `reset` ou `clean` sem confirmação explícita.

## Encerramento de sessão

Ao finalizar a sessão, gere/atualize `HANDOFF.md` na raiz com o estado atual, decisões fechadas, artefatos, próximos passos e pendências. Este é o padrão obrigatório de encerramento de sessão.
