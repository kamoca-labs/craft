# Section guide (arc42)

Read only the entry of the section in turn. Titles and contents follow the official arc42 template (docs.arc42.org, template 9.1).

## Contents

- 1. Introduction and goals
- 2. Architecture constraints
- 3. Context and scope
- 4. Solution strategy
- 5. Building block view
- 6. Runtime view
- 7. Deployment view
- 8. Cross-cutting concepts
- 9. Architecture decisions
- 10. Quality requirements
- 11. Risks and technical debt
- 12. Glossary

Each entry has four parts: **Facts** (find them in the repo), **Ask** (only the user can decide), **Write** (what the section holds), **Done when** (the test to remove the marker).

## 1. Introduction and goals

- **Facts:** the purpose and main features from `README.md`, the manifest and the routes or commands. Existing requirement documents.
- **Ask:** the top 3 to 5 quality goals, in priority order (the goals of the architecture, not of the project). The stakeholders and what each expects.
- **Write:** 1.1 a short requirements overview, with links to the full documents. 1.2 the quality goals. 1.3 a table of role, contact and expectation.
- **Done when:** the quality goals are ranked by the user, and every stakeholder has an expectation.

## 2. Architecture constraints

- **Facts:** the language and runtime versions, the required platform, the license, the CI rules, the lint and naming conventions, the compliance files.
- **Ask:** the constraints that the repo cannot show: organizational (team, budget, schedule, vendor), legal, mandated tools. Which constraints are fixed and which can change.
- **Write:** a table of constraint, reason and source, split into technical, organizational and conventions.
- **Done when:** the user confirmed the list, or said that no other constraint exists.

## 3. Context and scope

- **Facts:** every external call (HTTP clients, queues, databases, file shares, SDKs), the exposed interfaces (routes, topics, CLI), the env vars and ports, the identity provider.
- **Ask:** the users and systems that talk to this one and what they exchange. What is out of scope.
- **Write:** 3.1 business context: a diagram or table of each partner with its domain inputs and outputs. 3.2 technical context: the channels and protocols, and which input or output uses which channel.
- **Done when:** every external call found in the repo appears in the section, and the user confirmed the boundary.

## 4. Solution strategy

- **Facts:** the framework, the architecture style that the folders show (layers, modules, hexagonal), the main libraries, the data store.
- **Ask:** why these choices, and which quality goal each one serves. The organizational decisions (who owns what).
- **Write:** a short list, each item linked to the quality goal of section 1 and, if it has one, to its entry in section 9. Keep it short.
- **Done when:** each fundamental decision names its reason and the goal it serves.

## 5. Building block view

This section is mandatory in arc42.

- **Facts:** the tree of the repo at the level that the layout sets (see the layout rules in the discovery guide), the imports between blocks, the public entry point of each block.
- **Ask:** the responsibility of a block when the code does not make it clear. Which blocks deserve level 2.
- **Write:** 5.1 level 1: a diagram of the blocks and their dependencies, then a table with name, responsibility, interface and path. Add one subsection for each block refined to level 2.
- **Done when:** every top-level block has a responsibility and a real path, and the diagram matches the imports.

## 6. Runtime view

- **Facts:** the entry points (routes, handlers, jobs, commands) and the call chain of the main ones. The start-up and shutdown code.
- **Ask:** which 3 to 5 scenarios matter most. Which failure scenarios the team fears.
- **Write:** for each scenario, a Mermaid sequence diagram and two or three lines of notes. Include one error or exception scenario.
- **Done when:** the user picked the scenarios, and each one follows a real call chain of the code.

## 7. Deployment view

- **Facts:** Dockerfiles, compose files, IaC (Terraform, Helm, manifests), CI/CD files, environment config files.
- **Ask:** the environments that exist (dev, staging, production), where each runs, and anything outside the repo (network, hosting, secrets store).
- **Write:** a diagram of the infrastructure nodes, then the mapping of each building block to a node or artifact. One block per relevant environment.
- **Done when:** every building block that ships has a node, and the user confirmed the environments.

## 8. Cross-cutting concepts

- **Facts:** the shared code for logging, error handling, auth, config, persistence, i18n, caching, testing.
- **Ask:** which topics matter for this system, and the rule behind each one when the code does not state it.
- **Write:** one subsection for each chosen topic: the rule, where it lives in the code, and how to follow it. Select only the topics a new team member needs.
- **Done when:** each chosen topic names its rule and its path.

## 9. Architecture decisions

- **Facts:** `docs/adr/` or `docs/decisions/`, `.claude/memory/`, the git log and the PR/MR titles that mention a change of technology or structure.
- **Ask:** which decisions were important, costly or risky, and the reason and the rejected options for each.
- **Write:** a list with one entry for each decision: title, context, decision, status, consequences. Do not repeat section 4. If the project keeps ADR files, link them and list the titles.
- **Done when:** each listed decision has a context and a reason from the user or from a source.

## 10. Quality requirements

- **Facts:** test and benchmark config, performance budgets, SLO or alert files, the security checks of the CI.
- **Ask:** the measurable target for each quality goal of section 1: the stimulus, the response and the limit.
- **Write:** 10.1 an overview by quality category (the arc42 template suggests ISO 25010:2023). 10.2 quality scenarios (use, change, failure), each one measurable. Skip 10.2 when 10.1 is already precise and measurable.
- **Done when:** every goal of section 1.2 has at least one measurable scenario or one measurable line in the overview.

## 11. Risks and technical debt

- **Facts:** `TODO` and `FIXME` comments, skipped tests, outdated or vulnerable dependencies, files over the size limits, known bugs in the tracker.
- **Ask:** the risks that the team knows, their priority, and the planned mitigation.
- **Write:** a list ordered by priority: the risk or debt, its impact, and the mitigation. Mark each item as found in the repo or told by the user.
- **Done when:** the list is ordered by the user and each item has an impact.

## 12. Glossary

- **Facts:** the domain terms in the names of types, tables, routes and in the README. Terms used in the sections above.
- **Ask:** the meaning of a term that the repo does not define, and the preferred word when two words name the same thing.
- **Write:** a table of term and definition. Add the translations only when the project uses more than one language.
- **Done when:** every domain term used in sections 1 to 11 has a definition, and the file uses one term for each concept.
