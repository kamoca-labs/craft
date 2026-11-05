import { addContext, ruleBody } from '../lib.ts'

addContext('SessionStart', ruleBody('tool'))
