# E2E runs in a container

**Only in a container**, never on the host. The `e2e-container` hook denies the E2E runner outside `docker run`, `docker exec` and `docker compose run/exec`.

- Use the official image of the runner, in the same version as the package of the project. Playwright: `mcr.microsoft.com/playwright:v<version>-noble`. Cypress: `cypress/included:<version>`.
- Declare an `e2e` service in the dev compose file, in the same network as the app. The test reaches the app by the service name (`http://app:3000`), not by `localhost`. Pass the address as `BASE_URL`, which the config reads into `use.baseURL`.
- Set `init: true` and `ipc: host` on the service (`--init --ipc=host` on `docker run`). Without `ipc: host`, Chromium can run out of memory and crash. Without `init`, zombie processes pile up.
- Keep the default root user: the E2E code is trusted. Use the non-root user with the seccomp profile only to open sites that are not yours.
- Mount the folders of the output (`test-results/`, `playwright-report/`) as volumes, so the videos and the traces survive `--rm`.
- Run with `docker compose run --rm e2e` or with the `test:e2e` script of the project, which calls this command.
- If the project does not have the `e2e` service yet, create the service before you run the test. Never run `npx playwright test` or `npx cypress run` directly on the host.

The container gives the same browser, the same fonts and the same system in dev and in CI. So a test that passes on one machine also passes in CI.

## Signs of violation

- `npx playwright test`, `npx cypress run` or another E2E runner run directly on the host.
- The test reaches the app through `localhost` instead of the service name.
- The image of the runner has a version different from the package of the project.
- The `e2e` service has no `ipc: host`, or the config starts its own `webServer` instead of reaching the app service.

## Verification question

Does every E2E run go through the `e2e` service, with the official image in the version of the package?
