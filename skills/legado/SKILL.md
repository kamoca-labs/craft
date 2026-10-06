---
name: legado
description: Alternativa ao ATDD para sistema legado sem teste automatizado (ex.: alfa). Especificação Given/When/Then, caracterização do comportamento atual por sonda de leitura ou roteiro manual, mudança mínima isolada em código novo, verificação comparando antes e depois, e refactor só no que foi tocado. Use em toda mudança de comportamento num projeto sem executor de teste.
argument-hint: "<o que deve mudar>"
---

# Legado: mudança segura sem teste automatizado

Sem teste, a rede de segurança é **saber o que o código faz hoje** antes de mexer, e **conferir depois** que só mudou o que devia. Mesmos 7 passos do `craft:atdd`, com o teste trocado por sonda e roteiro.

## Passos

1. **Especificação**: critérios de aceite em Given/When/Then, como no `craft:atdd`. Inclua um cenário de **o que não pode mudar** (o caso comum que já funciona). Mostre e espere o ok.
2. **Caracterização**: registre o comportamento **atual** dos cenários, antes de qualquer edição. Uma das duas, nesta preferência:
   - **sonda**: script PHP fora do versionamento (`~/Development/<sistema>/sonda-<assunto>.php`) que sobe o framework do sistema, chama a função ou roda a consulta e imprime o resultado em texto estável (ordenado, sem data/hora). Rode onde o sistema roda e salve a saída em `sonda-<assunto>.antes.txt`;
   - **roteiro manual**: tela, perfil, entrada e o que aparece hoje, um por cenário, mais a consulta SQL de leitura que confere o dado gravado.
   A sonda **só lê**: `SELECT`, nunca `INSERT`, `UPDATE`, `DELETE` nem chamada que grave, envie e-mail ou integre. Se o cenário exige gravar, ele vai para o roteiro manual em ambiente de homologação.
3. **Red**: confirme que a sonda ou o roteiro mostram o comportamento **ausente** ou o bug. Se mostrarem o comportamento já certo, a especificação está errada: volte ao passo 1.
4. **Mudança mínima**, isolada do código velho:
   - **broto** (*sprout*): a lógica nova vai numa função ou classe nova, pequena, sem acesso direto a banco ou sessão (recebe os dados por parâmetro). O código velho só ganha a chamada para ela;
   - **embrulho** (*wrap*): para somar comportamento antes ou depois de uma função existente, renomeie a velha e crie uma com o nome antigo que chama a velha mais o novo;
   - não reescreva, não reformate, não mude encoding (respeite o `ISO-8859-1` do arquivo) nem renomeie o que não é da mudança.
   Rode `php -l` em todo arquivo tocado.
5. **Passing**: rode a sonda de novo para `sonda-<assunto>.depois.txt` e compare com `diff`. A diferença tem que ser **exatamente** a da especificação. O cenário de "não pode mudar" sai idêntico.
6. **Refactor** com `craft:craft`, mas o escopo é **só o código novo e as linhas tocadas**. Código velho fora da mudança fica como está, mesmo feio: sem sonda cobrindo, refactor nele é mudança cega. Anote o que viu de grave para um chamado próprio.
7. **Passing again**: sonda e `diff` de novo depois do refactor, mais `php -l`.

## Entrega

- O roteiro manual (ou os comandos da sonda) vai para a seção `## Como testar` do MR. É ele que o revisor e a homologação vão seguir.
- A sonda e as saídas ficam **fora do commit**. Se valer a pena manter, vire teste de verdade quando o projeto tiver executor.
- Ao fim de cada passo, diga qual terminou e o resultado. Ex.: "Passo 5: diff só nas 2 linhas de mediadores com `ra_hrsmes` nulo, demais idênticas".

## Esqueleto de sonda (alfa)

```php
<?php
define('SYS_NAME', 'alfa');
ini_set('default_charset', 'ISO-8859-1');
header('Content-Type: text/plain; charset=ISO-8859-1');
include_once 'vendor/autoload.php';
require_once 'class/sys.html/core/TMaster.class.php';
new TMaster();

$conn = TMaster::getConnection('<base>');
$q = $conn->Query("SELECT ... ORDER BY 1", false);
while ($r = $conn->FetchObject($q)) {
    echo implode("\t", (array) $r), "\n";
}
```
