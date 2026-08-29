# hitl-por-etapa

HITL gate por etapa com matriz de autonomia declarativa (ADR-0025) — cada etapa do fluxo pausa via `interrupt()` quando `humano`, prossegue quando `autonomo`, e usa LLM-as-a-judge (fallback determinístico por ora) quando `llm_judge`.
