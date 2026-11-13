import assert from 'node:assert'
import { test } from 'node:test'
import { sandbox } from './helpers.ts'

const bash = (command: string, options = {}) => sandbox(options).pre('no-shell-edit', 'Bash', { command })

function assertDenied(commands: string[]) {
  for (const command of commands) {
    const result = bash(command)
    assert.strictEqual(result.status, 2, command)
    assert.match(result.stderr, /\[craft:no-shell-edit\]/, command)
  }
}

function assertAllowed(commands: string[]) {
  for (const command of commands) {
    const result = bash(command)
    assert.strictEqual(result.status, 0, `${command}\n${result.stderr}`)
  }
}

test('denies an in-place editor', () => {
  assertDenied([
    "sed -i 's/a/b/' app/X.php",
    "sed -i.bak 's/a/b/' app/X.php",
    "sed -ni '1,5p' app/X.php",
    "sed --in-place 's/a/b/' app/X.php",
    "perl -i -pe 's/a/b/' app/X.php",
    "perl -pi -e 's/a/b/' app/X.php",
    "perl -i.bak -ne 'print' app/X.php",
    "awk -i inplace '{ print }' app/X.php",
    "ruby -i -pe '$_.upcase!' app/X.php",
    "ruby -pi -e 'sub(/a/, \"b\")' app/X.php",
    'ed -s app/X.php',
    'ex -s app/X.php',
  ])
})

test('denies tee, truncate, dd and install that write a file', () => {
  assertDenied([
    'ls | tee saida.txt',
    'ls | tee -a saida.txt',
    'echo x | sudo tee /etc/hosts',
    'truncate -s 0 storage/logs/laravel.log',
    'dd if=a.bin of=b.bin',
    'install -m 644 a.conf /etc/a.conf',
  ])
})

test('denies a redirect to a file', () => {
  assertDenied([
    'echo texto >> README.md',
    'echo texto > README.md',
    "printf '%s\\n' texto > README.md",
    'cat a.txt >| b.txt',
    'composer test 2> erros.log',
    'composer test &> saida.log',
    'cd app && echo x > f',
    "cat > docs/a.md <<'EOF'\n# titulo\ntexto\nEOF",
    'cat > docs/a.md <<EOF\n# titulo\nEOF',
    "cat <<'EOF' > docs/a.md\ntexto\nEOF",
    'docker compose exec -T backend vendor/bin/pest > relatorio.txt',
  ])
})

test('denies a script that writes a file', () => {
  assertDenied([
    "python3 - <<'EOF'\nimport pathlib\npathlib.Path('f').write_text('x')\nEOF",
    'python3 -c "open(\'f\', \'w\').write(\'x\')"',
    'python3 -c "open(\'f\', \'a\')"',
    'python3 -c "open(\'f\', \'x\')"',
    'python3 -c "open(\'f\', \'r+\')"',
    'python3 -c "open(\'f\', mode=\'w\')"',
    'python3 -c "import pathlib; pathlib.Path(\'f\').write_bytes(b\'x\')"',
    'python3 -c "import pathlib; pathlib.Path(\'f\').open(\'w\')"',
    'python3 -c "import pathlib; pathlib.Path(\'f\').touch()"',
    'python3 -c "import shutil; shutil.copy(\'a\', \'b\')"',
    'python3 -c "import shutil; shutil.move(\'a\', \'b\')"',
    'python3 -c "import os; os.rename(\'a\', \'b\')"',
    'python3 -c "import os; os.replace(\'a\', \'b\')"',
    'python -c "import os; os.replace(\'a\', \'b\')"',
    `node -e "require('fs').writeFileSync('f','x')"`,
    `node -e "require('fs').appendFileSync('f','x')"`,
    `node -e "require('fs').writeFile('f','x',()=>{})"`,
    "node - <<'EOF'\nrequire('fs').writeFileSync('f', 'x')\nEOF",
    `ruby -e "File.write('f', 'x')"`,
    `perl -e 'open(my $fh, ">", "f"); print $fh "x"'`,
    `echo "import pathlib; pathlib.Path('f').write_text('x')" | python3 -`,
    "cat <<'EOF' | python3 -\nimport pathlib\npathlib.Path('f').write_text('x')\nEOF",
  ])
})

test('denies the editor inside a wrapper command', () => {
  assertDenied([
    "docker compose exec -T backend sed -i 's/a/b/' app/X.php",
    "grep -rl foo app | xargs sed -i 's/foo/bar/'",
    "find . -name '*.php' -exec sed -i 's/a/b/' {} +",
    "sudo sed -i 's/a/b/' /etc/hosts",
    'docker compose exec -T backend python3 -c "open(\'f\', \'w\')"',
  ])
})

test('allows a redirect to /dev/null and to a descriptor', () => {
  assertAllowed([
    'grep -rn foo app 2>&1 | head',
    'docker compose exec -T backend vendor/bin/pest > /dev/null',
    'composer test 1>/dev/null',
    'composer test 1>/dev/null 2>&1',
    'composer test &>/dev/null',
    'composer test >/dev/null 2>&1',
    'echo erro >&2',
    'echo erro 1>&2',
    'composer test 2> /dev/null',
    'echo x > /dev/stderr',
    'echo "a > b"',
    "git log --format='%h > %s'",
    'ls # > comentario',
  ])
})

test('allows a heredoc or stdin that only feeds a command', () => {
  assertAllowed([
    "git commit -F - <<'EOF'\nfeat: adiciona a regra\n\nUsa a > b no texto.\nEOF",
    "gh pr create --title 'feat: x' --body-file - <<'EOF'\n## Resumo\ntexto > x\nEOF",
    'glab mr create --title "feat: x" --description "$(cat <<\'EOF\'\n## Resumo\ntexto com "aspas" e > sinal\nEOF\n)"',
    'git commit -m "$(cat <<\'EOF\'\nfeat: x\nEOF\n)"',
    "cat <<'EOF'\ntexto > x\nEOF",
    'git commit -m "a > b"',
  ])
})

test('allows a script that only reads and processes', () => {
  assertAllowed([
    `python3 -c "import yaml; yaml.safe_load(open('f.yml'))"`,
    `python3 -c "import json; print(json.load(open('f.json')))"`,
    `python3 -c "print(open('f').read())"`,
    `python3 -c "open('f', 'r').read()"`,
    `python3 -c "open('f', 'rb').read()"`,
    `python3 -c "import sys; sys.stdout.write('x')"`,
    `python3 -c "import sys; sys.stderr.write('x')"`,
    "python3 - <<'EOF'\nimport json\nprint(json.load(open('f.json')))\nEOF",
    `curl -s https://example.com/a.json | python3 -c "import sys, json; print(json.load(sys.stdin))"`,
    `node -e "console.log(require('fs').readFileSync('f', 'utf8'))"`,
    `node -e "process.stdout.write('x')"`,
    'python3 script.py',
    'node script.js',
  ])
})

test('allows commands that write as the normal effect of the tool', () => {
  assertAllowed([
    'composer lint:fix',
    'vendor/bin/pint',
    'vendor/bin/rector process',
    'php artisan make:model Item',
    'git add -A',
    'git mv a b',
    'git rm a',
    'mv a b',
    'cp a b',
    'rm -rf cache',
    'mkdir -p storage/cache',
    'vendor/bin/pest --coverage',
    'install -d storage/cache',
    'npm install',
    'docker compose exec -T backend composer install',
    "sed 's/a/b/' app/X.php",
    "sed -n '1,5p' app/X.php",
    "perl -pe 's/a/b/' app/X.php",
    "awk '{ print $1 }' app/X.php",
    'ls | tee',
    'ls | tee /dev/null',
    'dd if=a.bin of=/dev/null',
  ])
})

test('allows a command that it cannot interpret', () => {
  assertAllowed(['echo "texto sem fim > f', "echo 'texto sem fim > f", 'echo "$(cat > f"', ''])
})

test('acts in every session, with or without a craft activity', () => {
  assert.strictEqual(bash('echo x > f', { activity: false }).status, 2)
  assert.strictEqual(bash('echo x > /dev/null', { activity: false }).status, 0)
})

test('the message says what to use instead', () => {
  const { stderr } = bash('echo x > f')
  assert.match(stderr, /\bWrite\b/)
  assert.match(stderr, /\bEdit\b/)
})
