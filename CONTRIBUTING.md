# Contributing to CodeQuest

CodeQuest is a small, working prototype for a complete coding-practice loop. Useful contributions make feedback clearer, progress more reliable, and the implementation easier to inspect. The [roadmap](docs/ROADMAP.md) lists known gaps without implying they are already fixed.

## Get oriented

1. Read the [visual walkthrough](docs/WALKTHROUGH.md).
2. Follow the [fresh local setup](README.md#try-locally).
3. Inspect the [engineering walkthrough](docs/ENGINEERING.md) and relevant source.
4. Create a focused branch for your change.

Use disposable local data and fictional accounts. The seed command deletes data in the selected database. Keep environment files, generated databases, credentials, real email addresses, and private source code out of commits, screenshots, and reports. The app is not ready to execute hostile submissions on a public server.

## Describe the problem first

For a bug report, include:

- What you were trying to accomplish.
- The shortest steps that reproduce the issue using a seeded challenge.
- What you expected and what happened instead.
- Browser/runtime version and a screenshot or error message with private details removed.

For a proposal, explain the learner's problem and the smallest change that would help. Discuss changes to rewards, execution, or the data model before a large implementation.

## Verify the behavior you changed

```bash
npm run typecheck
npm run lint
npm run verify:all
npx playwright install chromium
npm run test:e2e -- --project=chromium
```

Run database checks against disposable data. The CLI exercises the real executor but bypasses sessions and duplicates some business logic. Changes to submission/reward behavior need tests of the actual action logic.

`npm run test:unit` currently collects zero tests. The existing Chromium suite has known accessibility failures. Report which checks ran, their results, and any failures; do not treat existing failures as permission to ignore a regression. See [test boundaries](docs/ENGINEERING.md#testing).

For UI changes, include before/after screenshots and check the full task on desktop and mobile: input, pending state, failure, recovery, success, and navigation. Check keyboard access and focus as well as pointer interactions.

## Keep pull requests easy to review

Lead with the user-visible problem and resulting behavior. Keep changes scoped, link relevant tests, and document any remaining limitation. Do not include generated databases, environment files, dependency folders, or browser artifacts. Update screenshots and documentation when they no longer match the app.

CodeQuest is [MIT licensed](LICENSE).
