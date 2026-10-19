import fs from 'node:fs'
import path from 'node:path'
import { consentGiven, deny, FULL_SUITE_LOCAL, readInput, SKIP_FULL_SUITE } from '../lib.ts'

const PUSH_OR_REVIEW = /\b(git\s+push|gh\s+pr\s+create|glab\s+mr\s+create)\b/
const CI_CONFIGS = ['.github/workflows', '.gitlab-ci.yml', 'bitbucket-pipelines.yml', '.circleci/config.yml', 'Jenkinsfile', 'azure-pipelines.yml', '.drone.yml', '.woodpecker.yml']

const input = readInput()
const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const hasCi = CI_CONFIGS.some((config) => fs.existsSync(path.join(projectDir, config)))

const answered = () => consentGiven(input.transcript_path, [FULL_SUITE_LOCAL, SKIP_FULL_SUITE])

if (PUSH_OR_REVIEW.test(input.tool_input.command || '') && !hasCi && !answered()) {
  deny('push-gate', input)
}
