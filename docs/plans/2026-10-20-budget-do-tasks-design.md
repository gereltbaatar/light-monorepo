# Budget → sirius-do tasks

Recurring budgets in sirius-money create a task in sirius-do for each payment date.

## Decisions

| Question | Decision |
|---|---|
| When is a task created? | Ahead of time, dated on the payment day. No scheduler. |
| When is the next period's task created? | When sirius-money's home page loads. |
| Where is the budget ↔ task link stored? | New `ex_budget_tasks` table on the money side. `do_tasks` is untouched. |
| Opt-in? | Per budget, switch on the form, on by default. |
| Task date | The payment date. The existing reminder setting is unrelated. |
| Budget deleted | Unfinished (`todo`) linked tasks are deleted; done tasks stay. |

Both apps share one Supabase project, so sirius-money writes to `do_tasks` directly with the user's session client. RLS on `do_tasks` (`user_id = auth.uid()`) applies as usual.

## Data model

`supabase-budget-tasks.sql`, run by hand after `supabase-budgets.sql` and sirius-do's `supabase-setup.sql`:

- `ex_budgets.create_tasks boolean not null default false`
- `ex_budget_tasks`
  - `budget_id` → `ex_budgets(id)` on delete cascade
  - `user_id` → `auth.users(id)`
  - `due_date date`
  - `task_id` → `do_tasks(id)` on delete set null
  - `unique (budget_id, due_date)`
  - RLS: own rows only

A row whose `task_id` is null means the user deleted the task in sirius-do; it is not recreated.

## Flow

1. **Create budget.** If `create_tasks` is on, `createBudget` creates the task for the next due date.
2. **Home page load.** `syncBudgetTasks()` runs before budgets are read. For each recurring budget with `create_tasks`, it ensures the next due date (today or later) has a row.
3. **Claim, then create.** Insert the `ex_budget_tasks` row first. Only the request whose insert succeeds creates the `do_tasks` row and writes `task_id` back. Concurrent loads therefore never duplicate a task.
4. **No backfill.** Missed past periods are skipped; only the next due date is ensured.

## Task content

Written in the user's sirius-money locale:

- `title`: `Claude төлөх · 20 USD` / `Интернэт төлөх · ₮80,000`
- `due_date`: the payment date; `due_time` empty
- `priority`: `medium`; `category_id`: empty
- `notes`: `sirius-money · Сар бүр · ≈ ₮71,928` (tugrik line only for foreign currencies)

## UI

- **New budget, recurring tab:** "sirius-do-д task үүсгэх" switch under "Автомат давталт", on by default.
- **Budget detail:** info row "sirius-do task" showing on/off, and the next task date when on.

## Deleting a budget

`deleteBudget` reads the budget's `task_id`s, deletes those still `status = 'todo'` from `do_tasks`, then deletes the budget. The cascade removes its `ex_budget_tasks` rows.

## Errors

- `syncBudgetTasks()` never blocks the home page. Failures (migration not run, `do_tasks` missing) are logged and skipped.
- If a claim succeeds but the task insert fails, the claim row is deleted so the next load retries.
- In `createBudget`, a task failure does not fail the budget. The form shows a warning toast: "Төсөв үүслээ, гэхдээ task үүсгэж чадсангүй".

## Verification

No test files. Type-check and lint, then by hand:

1. Create a recurring budget with the switch on → task appears in sirius-do on the due date.
2. Reload sirius-money home several times → still one task per due date.
3. Delete the task in sirius-do, reload home → not recreated.
4. Delete the budget → its unfinished task disappears, done ones remain.
