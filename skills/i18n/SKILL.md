---
name: i18n
description: Código só em inglês e texto do usuário pela internacionalização da stack. Use quando há identificador, comentário ou log em outra língua, ou texto que o usuário vê (mensagem, label, botão, e-mail, erro de validação) escrito direto no código, em qualquer língua.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Inglês no código, língua do usuário na tradução

**Regra**: todo código é em inglês: identificadores, comentários, logs, mensagens de exceção interna e commit. A exceção é o arquivo de teste: o nome do teste e o dado de teste podem estar na língua do projeto, porque o teste descreve o comportamento para quem o especificou. Os identificadores do teste continuam em inglês. Texto que o usuário vê é escrito na língua nativa dele, mas **nunca no código**: fica no arquivo de tradução, e o código referencia a chave pelo i18n da stack.

## Por quê

- Inglês é a língua comum de bibliotecas, frameworks e de quem vai manter o código; misturar línguas obriga a lembrar qual termo está em qual língua.
- Texto no código espalha o mesmo conteúdo por vários arquivos (`craft:dry`): mudar uma frase vira caça no projeto, e traduzir para outra língua vira reescrita.
- Arquivo de tradução é revisado por quem cuida do texto sem mexer em código, e o teste verifica a chave em vez da frase.

## Sinais de violação

- Letra acentuada ou de outro alfabeto num arquivo de código fora da pasta de tradução e fora dos testes (o hook `english-code` já nega).
- Identificador em português sem acento: `usuario`, `calcularValor`, `salvarProtocolo`.
- String literal que chega ao usuário: `throw new ValidationError('File too large')`, `<button>Save</button>`, `flash('Saved!')`, `'Hello ' + name`.
- Frase montada por concatenação, com plural feito por `if` (`count === 1 ? 'item' : 'items'`).
- Teste que compara com a frase traduzida em vez de passar pela tradução.

## Como aplicar

1. **Projeto sem i18n**: proponha a biblioteca padrão da stack (tabela abaixo), mostre o plano (dependência, pasta, idioma padrão, primeira chave) e **espere o ok** antes de instalar.
2. **Chave**: em inglês, por domínio e intenção, não pela frase (`attachment.tooLarge`, não `fileIsTooBig10mb`).
3. **Parâmetro**: valores entram como placeholder (`{max}`), nunca por concatenação; plural pela regra de plural do i18n.
4. **Arquivo de tradução**: a frase na língua nativa do usuário (`pt-BR`, por padrão no projeto). Só ela fica fora do inglês.
5. **Teste**: verifica a chave, ou a frase obtida pela mesma função de tradução, nunca o texto literal.
6. **Fora do escopo do i18n**: log, mensagem de exceção que o usuário nunca vê e texto de desenvolvedor ficam em inglês literal no código.

| Stack | Biblioteca | Onde ficam os textos |
|---|---|---|
| Laravel | `__()` / `trans_choice()` nativos | `lang/pt_BR/*.php` ou `lang/pt_BR.json` |
| Vue | `vue-i18n` | `src/locales/pt-BR.json` |
| React | `react-i18next` | `src/locales/pt-BR.json` |
| Node (API) | `i18next` | `locales/pt-BR.json` |
| Python | `gettext` / Django `gettext_lazy` | `locale/pt_BR/LC_MESSAGES/*.po` |
| Go | `go-i18n` | `locales/pt-BR.json` |
| Rust | `fluent` | `locales/pt-BR/*.ftl` |

Projeto com i18n próprio: use o que já existe, sem trocar de biblioteca.

## Exemplo

```ts
// antes
if (file.size > MAX_SIZE) {
  throw new ValidationError(`Arquivo maior que ${MAX_SIZE_MB} MB`)
}

// depois
if (file.size > MAX_SIZE) {
  throw new ValidationError(t('attachment.tooLarge', { max: MAX_SIZE_MB }))
}
```

```json
// src/locales/pt-BR.json
{ "attachment": { "tooLarge": "Arquivo maior que {max} MB" } }
```

## Limites

- Dado de domínio que é conteúdo (nome de cidade, de produto, seed de banco) não é texto de interface: vai para dado (seed em JSON, CSV, banco), não para o arquivo de tradução nem para o código.
- Código legado em português: não traduza em massa no meio de uma feature. O que você toca sai em inglês; a migração do resto é mudança separada.

## Pergunta de verificação

Trocar o idioma do usuário exige editar só arquivos de tradução, nenhum arquivo de código?
