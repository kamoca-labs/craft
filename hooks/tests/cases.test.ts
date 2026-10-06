import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'
import { injected, sandbox } from './helpers.ts'

type Case = {
  description: string
  origin: string
  tool_name: string
  tool_input: { command: string }
  tool_response: { stdout: string, stderr: string }
  inject: string[]
}

type HookGroup = { matcher: string, hooks: { command: string }[] }

const HOOKS_DIR = path.join(import.meta.dirname, '..')
const hooks = JSON.parse(fs.readFileSync(path.join(HOOKS_DIR, 'hooks.json'), 'utf8')).hooks
const cases: Case[] = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'cases.json'), 'utf8'))

function postToolRules(toolName: string): string[] {
  return (hooks.PostToolUse as HookGroup[])
    .filter((group) => new RegExp(`^(${group.matcher})$`).test(toolName))
    .flatMap((group) => group.hooks.map((hook) => hook.command.match(/rules\/([\w-]+)\.ts/)![1]))
}

for (const useCase of cases) {
  test(`[${useCase.origin}] ${useCase.description}`, () => {
    const box = sandbox()
    const run = { command: useCase.tool_input.command, ...useCase.tool_response }
    const fired = postToolRules(useCase.tool_name).filter((rule) => injected(box.run(rule, run)) !== null)
    assert.deepStrictEqual(fired.sort(), [...useCase.inject].sort())
  })
}
