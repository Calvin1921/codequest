# CodeQuest, one practice session

**The goal:** turn a vague “my solution does not work” into a specific case to understand and fix, then save the completed work.

This walkthrough uses the real local app, seeded problems, and a fictional account. No external service or model call is needed. The screenshots show the current prototype, including the rough edges listed below.

## 1. Choose a manageable task

![Challenge list: Sum of Array, String Reverse, Find Duplicates, Flatten Array, and LRU Cache](../public/screenshots/demo-challenges.png)

A challenge card tells the learner what to build, how difficult it is, and the estimated practice time. **Sum of Array** is a short introduction to the full flow; **LRU Cache** offers a deeper stateful problem.

All five seeded tasks currently use JavaScript. Some category filters have no seeded content; the roadmap calls for displaying only available choices.

## 2. Run a solution and identify the missed case

![A reduce-based solution passes three tests but fails on an empty array](../public/screenshots/demo-failure.png)

The first solution uses `reduce` without an initial value. It works for non-empty arrays, but an empty array exposes the missing behavior. Three passing cases narrow the problem; the failed case shows the input, expected result, and runtime error.

The problem statement, code, tests, and authored hints stay in one workspace. The intent is to help the learner move from feedback to a concrete revision without changing tools.

The current result layout can require scrolling to read a long error. Improving that readability is a near-term priority.

## 3. Make the smallest useful correction

![Adding zero as the initial reduce value produces four passing tests and 80 XP](../public/screenshots/demo-success.png)

Adding `0` as the initial value handles the empty input. All four cases pass, and the application records completion and awards XP.

**Run Tests is also a submission.** On the fresh account in these screenshots, one failed run followed by a passing run earned 80 XP. Extra attempts change the bonus. The “Unsaved” footer is a known stale-status bug; the dashboard below confirms this completion was stored. Rewards and status handling are on the roadmap.

## 4. See what changed and continue

![Demo Learner dashboard shows 80 XP, one of five challenges completed, and String Reverse next](../public/screenshots/demo-progress.png)

The learner can see the result of the session: one completed challenge, an activity entry, and another task to try. The next suggestion follows the challenge order; it is not an adaptive or AI-generated recommendation.

The product idea is a repeatable practice habit with understandable feedback. XP and streaks support that habit; they do not prove proficiency.

## Try the same example

[Set up a fresh local demo](LOCAL_DEMO.md), register a fictional account, and open **Sum of Array**.

First, run this version:

```js
function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num)
}
```

Expected outcome: three of four tests pass; the empty-array test fails.

Then add the starting value:

```js
function sumArray(arr) {
  return arr.reduce((sum, num) => sum + num, 0)
}
```

Expected outcome: all four tests pass. Return to the dashboard to see the saved completion. Use trusted sample code only; the current runner is not hardened for untrusted input.

## Explore a deeper use case: LRU Cache

The included LRU task checks state over a sequence of operations. For a cache with capacity two:

| Operation                     | What should happen                                     |
| ----------------------------- | ------------------------------------------------------ |
| `put(1, 1)`, then `put(2, 2)` | Fill both slots                                        |
| `get(1)`                      | Return `1` and make key `1` most recently used         |
| `put(3, 3)`                   | Evict key `2`, which is now least recently used        |
| `get(2)`                      | Return `-1`, confirming eviction                       |
| `get(3)`                      | Return `3`, confirming the new value remains available |

This example connects a familiar coding exercise to a concrete engineering behavior: retaining useful data within a capacity limit. The [seed file](../prisma/seed.ts) contains the problem, reference solution, and test cases. The [executor](../lib/code-executor.ts) handles class-operation sequences as well as ordinary function calls.

## Where AI would fit

**Today:** fixed tests determine correctness, and hints are authored. There is no live model integration.

**Possible extension:** a coach could explain a failed case or suggest a relevant next exercise. Its explanations would need evaluation and failure handling; the deterministic runner would remain responsible for pass/fail and rewards.

[Back to the project](../README.md) · [Engineering walkthrough](ENGINEERING.md) · [Roadmap](ROADMAP.md)
