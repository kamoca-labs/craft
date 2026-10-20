---
name: errors
description: Clean Code, erros tratados de forma explícita e nunca engolidos. Use quando há catch vazio, catch que só loga e segue, erro convertido em null/false silencioso, retorno de código de erro, mensagem genérica, falha que some sem chegar a quem pode agir, ou erro na tela que não diz ao usuário como recuperar.
argument-hint: "[arquivo ou escopo]"
user-invocable: false
---

# Erros explícitos, nunca engolidos

**Regra**: todo erro tem um destino claro: é **tratado** por quem sabe o que fazer com ele, ou **propagado** com contexto até alguém que saiba. Nunca desaparece. Falhe cedo, falhe alto, com mensagem que diz o que deu errado e com que dado.

## Por quê

- Erro engolido vira dado corrompido ou comportamento estranho longe da causa, horas depois.
- `null` silencioso empurra o problema para quem chama, que geralmente não confere.
- Mensagem com contexto encurta a investigação de horas para minutos.

## Sinais de violação

- `catch {}` vazio, ou `catch (e) { console.log(e) }` e segue como se nada tivesse acontecido.
- `try/catch` que retorna `null`, `false` ou `[]` em caso de falha, indistinguível de "não há dado".
- `catch` genérico em volta de bloco grande, capturando até bug de programação.
- `throw new Error('erro')` ou mensagem sem o identificador envolvido.
- Erro relançado sem a causa original (`throw new Error('falhou')` perdendo o `cause`).
- Promise sem `await` nem `.catch`.
- Mensagem ao usuário com código interno, stack trace ou o `error.message` cru.
- Formulário que limpa os campos depois de um erro.
- Erro de rede na tela sem ação de tentar de novo.

## Como aplicar

1. Para cada `catch`, decida: **aqui eu sei recuperar?** Se não, não capture; deixe subir.
2. Se captura para dar contexto, relance com `cause`.
3. Erro esperado do domínio (não encontrado, sem permissão, estado inválido) vira tipo próprio, tratado na borda (HTTP 404/403/422).
4. Valide entrada na fronteira e lance cedo, antes de efeitos parciais.
5. Mensagem: o que falhou + com que dado + (se ajudar) o que fazer.
6. `try` envolve só a linha que pode falhar daquele jeito.

## Erro que o usuário vê

O passo 5 vale para quem desenvolve. O erro que chega ao usuário segue estas regras:

- A mensagem diz o problema e como o usuário recupera. Ex.: "O arquivo tem 11 MB. Envie um arquivo de até 10 MB."
- A mensagem não promete uma causa ou uma solução que o sistema não conhece.
- O formulário com erro guarda o que o usuário digitou.
- O erro de rede oferece uma ação de tentar de novo.
- O texto vai pelo i18n da stack, nunca escrito no código (`craft:i18n`).

## Exemplo

```ts
// antes: falha some, chamador recebe null e segue
async function loadConfig(path: string) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'))
  } catch (e) {
    console.log(e)
    return null
  }
}

// depois: arquivo ausente é caso previsto; JSON inválido sobe com contexto
async function loadConfig(path: string): Promise<Config> {
  const content = await fs.readFile(path, 'utf8').catch((error) => {
    if (error.code === 'ENOENT') return '{}'
    throw error
  })
  try {
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`config inválida em ${path}`, { cause: error })
  }
}
```

## Limites

- Capturar para **recuperar** é correto (retry, fallback documentado, valor padrão previsto em teste).
- Na borda do sistema (handler HTTP, job, CLI) um tratador genérico que loga e responde 500 é o lugar certo para o "pega tudo".
- Não transforme todo erro em exceção customizada: crie tipo próprio só para o que alguém vai tratar de forma diferente.

## Pergunta de verificação

Se esta operação falhar em produção, alguém fica sabendo, com informação suficiente para agir, sem o sistema seguir com dado errado? Se o erro chega ao usuário, ele sabe o que fazer a seguir?
