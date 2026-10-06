---
name: validar-dms
description: Executa a validação de aceite do DMS para backend, frontend ou ambos.
argument-hint: escopo opcional: backend, frontend ou all
agent: dms-acceptance
---

Valide o escopo indicado na solicitação (`backend`, `frontend` ou `all`). Se nenhum escopo for informado, use `all`.

Use o agente `dms-acceptance` para revisar as mudanças relevantes e executar os checks correspondentes. Não altere arquivos nem corrija falhas durante esta execução. Relate comandos executados, resultados, achados com evidências e qualquer validação bloqueada.