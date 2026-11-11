# Discovery: language and layout

Do both checks before you write the first section. Tell the user the result in one line. Ask only when the signals disagree or are missing.

## Language of the document

`ARCHITECTURE.md` uses the language of the project, not the language of the chat.

Read the signals in this order and stop at the first clear one:

1. A language rule in `CLAUDE.md`, `CONTRIBUTING.md` or `.claude/memory/`.
2. The language of the `README.md` and of `docs/`.
3. The language of the last 20 commit messages (`git log --format=%s -20`).
4. The language of the comments and user-visible text in the code.

If two signals disagree (for example, a README in English and commits in Portuguese), or none exists, ask one question with the languages found as options.

Rules for the text:

- Translate the section titles and the prose. Keep the number prefix (`## 5. ...`), so a link to a section stays valid.
- Keep identifiers, paths, commands, product names and quotes as they are.
- Use one term for each concept in the whole file. Section 12 (glossary) is the source of the terms.

## Layout of the repo

Find where the system lives. The layout sets what a building block is (section 5) and how paths are written.

| Signal | Layout |
|---|---|
| One manifest at the root (`package.json`, `pyproject.toml`, `go.mod`, `pom.xml`, `Cargo.toml`) and the code in `src/`, `app/` or `lib/` | **Root** |
| `workspaces` in `package.json`, `pnpm-workspace.yaml`, `nx.json`, `turbo.json`, `lerna.json`, `go.work`, `[workspace]` in `Cargo.toml`, or a multi-module build | **Monorepo** |
| Folders such as `apps/`, `packages/`, `services/`, `modules/`, each with its own manifest or Dockerfile | **Monorepo** |
| A `docker-compose` file with several services that build from different folders | **Several deployable parts** (treat as monorepo) |
| Several top-level folders, each a separate project, with no shared root manifest | **Several projects in one repo** (treat as monorepo) |

Adapt the document to the layout:

- **Root layout.**
  - Building blocks (section 5, level 1) are the top-level modules, packages or layers inside the source folder.
  - Write each path from the repo root (`src/orders/`).
- **Monorepo layout.**
  - Building blocks (section 5, level 1) are the apps, packages and services. Show the dependencies between them.
  - Refine to level 2 only for a block that holds an architecture decision. Do not walk the whole tree.
  - Write each path from the repo root (`packages/billing/src/`).
  - Section 7 (deployment) lists which block ships in which artifact, taken from the Dockerfiles, compose files and CI.
  - Section 8 (concepts) covers what the blocks share (a shared library, one auth rule). A concept of one block goes in the entry of that block.
- **Where the file goes.** Write `ARCHITECTURE.md` at the root of the repo. If the argument is the path of a package, write it in that package and add a link to it in the root file, when the root file exists.
- **Existing docs.** If `docs/` or an `ARCHITECTURE.md` already exists, reuse its content and link to it. Do not duplicate it. If the project keeps its decisions in `docs/adr/` or `docs/decisions/`, section 9 links to that folder and lists only the titles.
