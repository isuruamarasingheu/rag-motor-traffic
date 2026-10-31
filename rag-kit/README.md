# RAG Kit: Motor Traffic Act Assistant (Antigravity 2.0 only)

Everything runs in **Antigravity 2.0** with your **Google AI Pro** subscription. You switch between a **Claude** model (planning and review) and a **Gemini** model (building) using the model selector.

## What each file is

| File | Purpose |
|---|---|
| `AGENTS.md` | Master instructions: goal, rules, stack, data formats, pipeline, and the two working modes (section 11) |
| `GEMINI.md` | Tiny compatibility file that points to `AGENTS.md` |
| `PLAN.md` | Ordered tasks with "done when" checks, and a notes log |
| `PROMPTS.md` | Copy-paste prompts for every stage |
| `.agents/skills/*/SKILL.md` | Three skills: `statute-chunking`, `ocr-number-check`, `rag-eval` |

## Your tools

- **Antigravity 2.0 (desktop app):** an agent manager with no code editor. It can run commands, read and write files, search the web, use skills and MCP servers, and produce implementation plans.
- **A code editor (VS Code is free):** only for *reading* diffs and files, opened on the same project folder.

## Which models can you use?

Reports say Antigravity added **Claude Sonnet 5.5 and Opus 5.5 (thinking)** to the model selector on October 3, 2026, for **Google AI Ultra and non-trial, paid Google AI Pro** plans. They are not available on Free, Google AI Plus, or a Pro free trial. If you don't see Claude in the selector under the prompt box, check that your Pro subscription is paid (not a trial) and check the official model list: https://www.antigravity.google/docs/models/

Older Claude 4.6 models are being removed on November 2, 2026, so pick the 5.5 models.

**Quota:** Google doesn't publish exact numbers for Antigravity limits, and all models draw on your plan's quota. A sensible split:
- **Gemini** for most building (writing code, tests, running the pipeline).
- **Claude Sonnet 5.5** for planning, review and error analysis (short, high-value conversations).
- **Claude Opus 5.5** only for hard problems that span several parts of the system.
Watch how fast your quota drops and adjust.

## Setup (about 10 minutes)

1. Create the project folder, e.g. `rag-motor-traffic/`, and run `git init`.
2. Copy everything from this kit into the **project root**, including the hidden `.agents/` folder (it holds the skills). Hidden folders may not show in your file manager; use `ls -a` or turn on "show hidden files".
3. Create `.env` (never commit it):
   ```
   OPENAI_API_KEY=your-key
   ```
   Your Google AI Pro plan does **not** include OpenAI API credit. The project's embeddings and answer generation need an OpenAI API key with a small balance.
4. Open the project folder in **Antigravity 2.0** as a workspace.
5. Select a model, start a **new conversation**, and paste **Prompt G0** from `PROMPTS.md`. It checks that the agent loaded `AGENTS.md` and can see the skills. If your version expects skills in another folder, it will tell you.
6. Switch the selector to a **Claude** model, start another new conversation, and paste **Prompt C0**.
7. Commit everything: `git add . && git commit -m "Add project instructions"`.
8. Start with **Prompt C1**.

## The working loop

1. **Planner mode (Claude model, new conversation):** plans the next task, updates `PLAN.md`, and writes a handoff (C1, C2).
2. **Builder mode (Gemini model, new conversation):** paste the handoff plus G-OPEN. It makes an implementation plan first; read it, approve, then let it build **one task**.
3. **You, in VS Code:** read the diff, run `pytest -q`, check anything involving legal text or numbers yourself, commit.
4. **Planner mode (Claude model, new conversation):** reviews the diff and results (C3), ticks `PLAN.md`, proposes the next task.

Start a **new conversation whenever you switch models.** Each model then starts with a clean context, and the instruction files and `PLAN.md` carry the project memory.

**One writer at a time.** Don't run several agents on overlapping files. Planner mode should only edit `PLAN.md` and evaluation documents unless you say otherwise.

## Antigravity 2.0 tips

- **Keep terminal approvals on.** Don't enable full auto-run while the agent works near your data or `.env`.
- **Plans first.** For anything bigger than one file, ask: "Create an implementation plan and wait for my approval."
- **MCP servers:** add a docs-lookup server so agents check current LangGraph and Chroma APIs. Use the app's MCP settings; for the Antigravity CLI, global MCP settings are in `~/.antigravity/mcp_config.json`. Docs: https://antigravity.google/docs/mcp
- **Subagents:** skip them at first. Later, one can review code or write tests on separate files.
- **Long jobs** (building the embedding index, running the dev evaluation) are good background tasks.
- **Chrome:** useful for testing your React frontend. Run the LankaLAW and Aythiya comparisons yourself and keep the outputs as evidence.

## Your own jobs (AI cannot do these for you)
- Choose and verify the legal sources.
- Check every number from scanned gazettes against the images.
- Write or approve the evaluation questions and gold labels.
- Do the human faithfulness scoring and find a second rater.
- Write the report in your own words; use AI to review, not to author your research claims.

## Check before you rely on it
These tools change often. If a setting or folder doesn't match your version, check the current docs:
- Antigravity 2.0 overview: https://antigravity.google/docs/overview
- Antigravity models and plans: https://www.antigravity.google/docs/models/ and https://www.antigravity.google/docs/plans/
