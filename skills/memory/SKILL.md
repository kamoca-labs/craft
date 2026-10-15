---
name: memory
description: Memória de longo prazo do projeto em `.claude/memory/`, dentro do repo, no padrão da auto memory do Claude Code. O hook memory injeta esta skill e o catálogo em toda sessão, e o hook memory-outside-project nega memória fora do projeto. Use quando aprender algo que vale para uma conversa futura, ou quando pedirem para lembrar ou esquecer algo.
argument-hint: "[o que lembrar ou esquecer]"
---

# Memória do projeto

**Regra**: toda memória é do projeto. Ela fica em `.claude/memory/`, dentro do repo, e vai para o git com o resto. Nunca grave memória em `~/.claude/projects/<projeto>/memory/`: ela só vale nesta máquina e o time não vê. O hook `memory-outside-project` nega essa gravação.

## Consultar

- O catálogo `MEMORY.md` está no fim deste contexto.
- Antes de agir, confira se uma linha do catálogo toca o assunto. Se toca, leia o arquivo da memória.
- A memória diz o que era verdade quando foi escrita. Se ela cita arquivo, função ou flag, confira se ainda existe.

## Salvar

Ao fim de cada interação, pergunte: isto vale para uma conversa futura? Se vale, salve sem esperar pedido.

| `type` | O que guarda |
|---|---|
| `feedback` | correção do usuário, ou abordagem que ele confirmou |
| `project` | trabalho em andamento, prazo, decisão ou restrição que o código e o git não mostram |
| `reference` | onde achar informação fora do repo (issue, dashboard, doc) |

Não salve:

- o que o código, o git, o CLAUDE.md ou o `docs/` já dizem;
- o que só vale para a conversa atual;
- segredo, credencial ou dado pessoal: o repo é do time;
- preferência pessoal de uma pessoa: ela vai no `~/.claude/CLAUDE.md` dela.

Passos:

1. Procure no catálogo uma memória que já cobre o fato. Se existe, atualize o arquivo dela.
2. Escreva um arquivo por fato em `.claude/memory/<type>_<assunto>.md`:

   ```markdown
   ---
   name: <assunto-em-kebab-case>
   description: <uma linha, usada para decidir se a memória é relevante>
   type: feedback | project | reference
   ---

   <o fato>

   **Por quê:** <o motivo, em feedback e project>
   **Como aplicar:** <quando e como usar, em feedback e project>
   ```

3. Adicione uma linha no catálogo: `- [Título](<arquivo>.md): <gancho de uma linha>`.
4. Troque data relativa por data absoluta ("quinta" vira "2026-10-15").
5. Se uma memória ficou errada, apague o arquivo e a linha dela.

## Catálogo

O `MEMORY.md` é só o catálogo: uma linha por memória, sem frontmatter, sem instrução e sem o conteúdo da memória. Mantenha cada linha curta. O hook injeta só o começo do catálogo, então junte ou apague linhas velhas quando ele cresce.
