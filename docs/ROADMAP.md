# Roadmap

These are proposed next steps, not shipped capabilities or release commitments. The current project is a local coding-practice prototype.

## 1. Trust the learning loop

- Preserve completed progress across failed retries and prevent duplicate XP awards. Test pass → fail → pass, repeated passing runs, and concurrent submissions through the real submission logic.
- Update the saved/completed status immediately after a successful submission; distinguish that stored result from subsequent edits.
- Retain drafts per account and challenge, with a clear recovery path after navigation or refresh.
- Make the run/save/reward contract explicit. Consider fixed first-completion XP so practice does not penalize experimentation.
- Make “Next Challenge” open the next task, or label the existing destination “Browse Challenges.”

## 2. Make feedback easier to use

- Wrap runtime errors, show `undefined` explicitly, round execution timings, and give results enough room at laptop sizes.
- Display only configured authentication providers and available challenge categories.
- Improve low-contrast text and verify keyboard focus, result announcements, panel resizing, and the completion dialog.
- Explain the skill being practiced and add mistake-specific authored guidance before expanding the challenge catalog.

## 3. Strengthen verification and execution

- Add action-level regression tests and a complete solve-flow browser test. Wire meaningful checks into CI; a passing empty Vitest run is not coverage.
- Isolate execution outside the application process with resource limits and restricted filesystem/network access before accepting untrusted code.
- Add submission throttling and total-request budgets. Define failure recovery for streak writes after XP commits.
- Validate any database-provider change with schema migrations and concurrency tests.

## 4. Evaluate coaching as an optional extension

- Keep correctness and rewards deterministic.
- Evaluate explanations against known failures and edge cases before introducing generated coaching.
- Define user consent, data retention, unavailable-model behavior, latency, and cost limits.
- Distinguish a learner's activity from demonstrated understanding when suggesting the next task.

[Current behavior and evidence](ENGINEERING.md) · [Contributing](../CONTRIBUTING.md)
