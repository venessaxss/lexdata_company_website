---
title: "Writing Textbooks with Codex and Claude Code: A Complete Guide"
date: "2026-09-10"
excerpt: "A practical, end-to-end workflow for designing, generating, checking and resuming a textbook project with human approval gates."
aiModels: ["Codex", "Claude Code"]
category: "Guides"
publisher: "LexData"
readTime: "20 min read"
coverImage: "/blog/textbook-writer-skills/image1.png"
featured: true
---

> **Version note — September 10, 2026:** This article preserves a hands-on workflow validated with `textbook-writer` v0.2.0 in July 2026. The upstream toolkit is now at v0.6.2 and supports Codex, Claude Code and WorkBuddy, with STEM, humanities and economics profiles. Screenshots and historical examples below still show v0.2.0; check the [current project README](https://github.com/cabbage2000-lab/textbook-writer-skills) before installation.

*Source note: The tutorial text, screenshots and diagrams were adapted from the document supplied to LexData. The figures retain their original “Programmer Da Bai Cai” attribution marks.*

## Current installation commands

For a new Codex installation, open a terminal and use:

```text
codex plugin marketplace add cabbage2000-lab/textbook-writer-skills
codex plugin add textbook-writer@textbook-writer-skills
```

For Claude Code, run the equivalent commands inside an interactive session:

```text
/plugin marketplace add cabbage2000-lab/textbook-writer-skills
/plugin install textbook-writer@textbook-writer-skills
```

The concepts and gate-based workflow in this guide apply to both hosts. The captured interface examples primarily show Claude Code because they come from the original v0.2.0 validation run.

This workflow was validated on macOS in July 2026 under textbook-writer v0.2.0. The toolkit is cross-platform and works equally well on Windows and Linux.

The full hands-on walkthrough takes roughly 40 minutes. Project tests show that finishing two gate checks for the outline plus writing two chapters takes 40–60 minutes; a full 7-chapter textbook requires several hours in total.

The previous article covered the design philosophy of textbook-writer-skills: a set of textbook authoring skills built for Codex and Claude Code. It adopts backward design to anchor core learning objectives, supports computational verification of exercises, and enables independent generation of each chapter.

Nevertheless, theoretical design knowledge alone cannot support practical operation.

This document supplies the practical workflow: starting from installation, all the way to producing textbook chapters with exercise validation tags. It specifies the exact prompts for each step, expected outputs, and troubleshooting methods.

**Target audience:** Developers creating technical lecture notes, teachers and students converting class notes into textbooks, and educational content creators. No prior experience with skills or plugins is required. You only need Codex or Claude Code installed and basic familiarity with sending prompts.

## Preliminary Boundary Notes

- **Historical v0.2.0 limitation:** The version documented here focused on STEM subjects such as mathematics, physics and computer science, where exercises could be computationally verified. The current project has since added humanities and economics profiles; consult the current README before planning a new book.

- **Version boundary:** The original walkthrough targeted v0.2.0 and replaced the old entry `write-textbook` with `textbook`. Its screenshots and recorded outputs are preserved here as a validated historical workflow. For a new installation, use the current repository instructions.

## Core Design Objectives: Resolve Three Common Pitfalls of AI Textbook Authoring

Readers familiar with the previous article may skim this section; new readers can quickly catch up on context.

If you simply prompt an AI “write a textbook for me”, you will most likely encounter three major flaws:

### Pitfall 1: Output is just a collection of knowledge points, not a real textbook.

The AI tends to list concepts chapter by chapter, producing content resembling bound encyclopedia entries. There is no consistent learning thread running through the whole book, and exercises fail to align with intended learning outcomes.

### Pitfall 2: Examples look plausible but yield incorrect computational results.

This is the most critical flaw for AI-generated STEM textbooks. If readers follow worked examples and find mistakes, the credibility of the whole textbook collapses.

### Pitfall 3: Context window collapse with larger chapter counts.

Packing dozens of chapters into one conversation inevitably causes information loss. When writing later chapters, the AI forgets notations and definitions from early chapters. Once interrupted, the entire task must restart.

The textbook-writer-skills suite is engineered specifically against these three pitfalls:

### Solution to Pitfall 1: Design first, write later

The workflow adopts the established pedagogical framework UbD (Understanding by Design). You first define what learners should master upon completion; only after your confirmation will the system derive chapter outlines and exercises backwards.

### Solution to Pitfall 2: Recalculate every computational example

Answers are released only after verification, with recalculation code attached. Items that cannot be computationally validated receive explicit labels; falsified validation status is strictly prohibited.

### Solution to Pitfall 3: Generate chapters independently and persist progress

Each chapter only consumes lightweight inputs. Writing progress is continuously saved to `.progress.json`, enabling arbitrary interruption and resume.

The workflow consists of five stages, managed by the main skill textbook, which delegates tasks to three sub-skills. Two checkpoints require human approval; these pause points are named gates.

![Five-stage textbook-writing workflow with two human approval gates](/blog/textbook-writer-skills/image1.png)

*Figure 1 Overview: The five-stage pipeline contains two human-operated gates. The workflow halts until gate approval is obtained.*

Keep the term gate in mind — all subsequent operations revolve around this mechanism.

Background briefing complete; hands-on practice may begin.

## Installation Guide

The plugin installation method is recommended: install once, and receive updates alongside the repository.

Before setup, verify Claude Code functions properly. Run this command in your terminal:

![Claude Code version check in a terminal](/blog/textbook-writer-skills/image2.png)

A valid version output confirms readiness. The validated environment version in the document: 2.1.211 (Claude Code).

### Step 1: Add the marketplace. Open a new Claude Code session and input:

![Adding the textbook-writer-skills marketplace in Claude Code](/blog/textbook-writer-skills/image3.png)

Proceed once you receive a success notification and textbook-writer-skills appears in the marketplace list.

### Step 2: Install the plugin. Enter the installation command next:

![Installing the textbook-writer plugin in Claude Code](/blog/textbook-writer-skills/image4.png)

A success message confirms completion.

Note: The two /plugin commands are interactive session commands and cannot be scripted automatically. The commands are copied from the repository README "Quick Start" section and cross-checked against marketplace metadata: marketplace name textbook-writer-skills, plugin name textbook-writer, version 0.2.0.

### Step 3: Verify installation. Mandatory action: launch a brand-new Claude Code session; Run the command to open the /plugin panel:

Deployment succeeds when textbook-writer appears in the installed list.

The plugin ships with 5 skills: textbook (main skill), textbook-outline, textbook-chapter, textbook-exercises, textbook-init.

Common Pitfall Warning: It is expected behavior that the plugin cannot be triggered within your original session after installation. Plugins only activate in newly created sessions; close and restart the session to test.

## Alternative Deployment Methods (non-plugin mode)

### Method 2: Copy to global skills directory (applies to all projects)

![Copying the skills directory for global installation](/blog/textbook-writer-skills/image5.png)

### Method 3: Clone repository and create symbolic link (project-scoped)

![Creating a symbolic link for project-scoped installation](/blog/textbook-writer-skills/image6.png)

After execution, .claude/skills links to the repository skills/ folder. This symlink approach has been verified in the project repository. The plugin workflow remains the preferred choice for daily usage.

![Codex showing the installed textbook-writing skills](/blog/textbook-writer-skills/image7.png)

## Set Up Your Workspace in 3 Minutes Before Writing

Textbook authoring usually spans weeks. Investing three minutes to organize your directory structure before starting delivers long-term benefits.

textbook-init handles three initialization tasks:

- Select directory layout according to your plan: single textbook only, or multiple textbooks in the future;

- Initialize a Git repository, enabling history review and version rollback for all writing progress;

- Generate the progress file .progress.json tracked within the repository, which is the prerequisite for resuming work on another machine.

Note: This step is optional. You may skip directly to the next section; the main skill will fall back to the default directory ./<TextbookName>/. If you intend to complete a full textbook, initialization is strongly recommended.

Enter this prompt inside your Claude Code session:

![Prompt that starts the textbook-init workflow](/blog/textbook-writer-skills/image8.png)

This tool collects four core configuration parameters via one round of interactive prompts: textbook title, writing scope (single textbook or multiple textbooks), working directory path, and whether to enable Git version control. Configuration guidelines are listed below:

| Prompt | Guidelines |
| --- | --- |
| Textbook Name | Used as the folder name. Example: Introduction to Linear Algebra. Do not add quotation marks. |
| Scope Planning | Choose single-book layout if you only intend to write this one textbook; choose multi-workspace layout if you plan to develop multiple textbooks later. |
| Storage Path | Defaults to the current directory ./. Absolute file paths are also supported. |
| Git Version Control | Enabled by default. Disable this function only if you explicitly opt out. |

The fundamental difference between the two layouts lies in where the root of the Git repository is created.

![Comparison of single-book and multi-workspace directory layouts](/blog/textbook-writer-skills/image9.png)

*Figure 3 Two layout modes are available: single-book layout (for one textbook only), and multi-workspace layout (if you plan to write multiple textbooks later).*

![Codex initialization questions for a textbook workspace](/blog/textbook-writer-skills/image10.png)

Once all prompts are answered, the tool outputs a complete plan, including a directory tree preview (listing all files the workflow will generate later) and rationale for each selection. It then pauses for human approval:

![Workspace plan waiting for human confirmation](/blog/textbook-writer-skills/image11.png)

If you are unsatisfied with the layout, state adjustments clearly (e.g., change path to ~/Documents). The tool updates the proposal and waits for approval again. No local files will be created before you confirm.

After you reply "confirm": directories are created, Git repository is initialized, .gitignore and README documentation are generated, and instructions for the next stage are printed.

![Workspace-ready message and the next textbook prompt](/blog/textbook-writer-skills/image12.png)

You can copy this prompt exactly as the opening instruction for the next phase.

One key design choice worth highlighting: .progress.json is NOT excluded in .gitignore.

This file stores the resumption state for interrupted writing. Committing it to the repository enables cross-machine continuation. If ignored, the resume capability becomes locked to a single machine.

Two edge case safeguards: If the target directory already exists and contains files, the tool only lists existing contents. It will never overwrite, move or delete any files. If .progress.json is already present, this signals an ongoing textbook project. You may jump directly to the section “How to resume interrupted work”. If the target path is already nested inside another Git repository, git init will be skipped with an explanation. Nested repositories are pitfalls for most users and not an intended feature.

![Planned Git repository and textbook file layout](/blog/textbook-writer-skills/image13.png)

![Files created after textbook workspace initialization](/blog/textbook-writer-skills/image14.png)

At this stage, you possess a Git-enabled empty workspace and a ready-to-use trigger prompt to launch textbook generation.

## Send the First Prompt

Initiate the generation of a textbook formally.

Note: From this point up to the "final review" stage, all interaction workflows and output samples follow the behavior definitions specified in each SKILL.md and the handoff contract handoff-contract.md stored in the repository. All excerpts shown for Introduction to Linear Algebra originate from real execution logs of eval 4 recorded on 2026-07-16 (path: evals/workspace/2026-07-16-eval-4/). These are not manually crafted demo examples.

Use the trigger instruction obtained after initialization ( with textbook-init):

![Textbook trigger prompt using an initialized workspace path](/blog/textbook-writer-skills/image15.png)

Direct launch without textbook-init

![Direct textbook trigger prompt without initialization](/blog/textbook-writer-skills/image16.png)

After the prompt runs, the tool creates the textbook project folder and progress file .progress.json. The initial state sets current_stage=1, and prints the stage header:

![Stage one prompt for confirming teaching orientation](/blog/textbook-writer-skills/image17.png)

A sequence of four follow-up questions will appear:

| Question | Information Required | Sample Reply |
| --- | --- | --- |
| Discipline | Specify the subfield precisely; use "Linear Algebra" instead of the generic term "Mathematics" | Linear Algebra |
| Reader Prior Knowledge | State whether readers start from zero or hold prerequisite coursework | Beginner-friendly, only high-school algebra assumed |
| Textbook Level | Introductory / Advanced | Introductory |
| Scope Length | 6–8 chapters / 8–12 chapters / 12+ chapters | 6–8 chapters |

No extra confirmation is needed after answering. The four items are saved into the section 1. Curriculum Positioning inside 00-TextbookDesign.md. The workflow proceeds automatically to Stage 2 without pause.

Below is the real output format for curriculum positioning:

![Generated curriculum-positioning summary](/blog/textbook-writer-skills/image18.png)

**Historical note:** In v0.2.0, selecting a humanities subject produced a notice that the workflow supported only STEM conceptual textbooks. Newer releases add humanities and economics profiles, so current behavior may differ from the screenshot-era workflow described here.

## The First Gate: Refine the UbD Five-part Template to Satisfaction

This is the most critical step of the whole workflow.

The primary question of UbD backward design is not “what to write in Chapter 1”, but “what students will take away after completing the course”. The outcomes are organized into five components, collectively called the UbD Five-part Template.

| Component | Plain-language Explanation |
| --- | --- |
| Big Ideas | 3–7 overarching claims running through the whole book; phrased as propositions rather than nouns |
| Enduring Understandings | Template: “Students will understand that …”; long-lasting, transferable insights retained long after learning |
| Essential Questions | 2–5 open-ended inquiry questions spanning multiple chapters |
| Transfer Goals | Students can apply knowledge to new scenarios not explicitly covered in the textbook |
| Learning Objectives | Each objective tagged with a Bloom’s taxonomy level, directly assessable via exercises |

Real examples:

Important concept 2: A matrix is not merely a table of numbers, but an algebraic representation of a linear transformation — every matrix stretches, rotates, projects or manipulates space.

Learning Objective 3: Use Gaussian elimination to solve systems represented by 3×4 augmented matrices and determine the number of solutions. (Bloom: Apply)

After the full template is presented, the workflow pauses at:

![First approval gate for the UbD framework](/blog/textbook-writer-skills/image19.png)

![Example of the confirmed five-part UbD framework](/blog/textbook-writer-skills/image20.png)

*Figure 6: The First Gate. The system delivers a draft, and you make the final call.*

Three response modes are available:

Approve: Reply with "Confirm" ("Pass" / "OK" are acceptable). The workflow proceeds to Stage 3.

Request revisions: State adjustments directly. Example: The 3rd big idea is overly abstract; rephrase it. After revision, the full UbD five-part template is regenerated for reconfirmation. The loop continues until you are satisfied.

Ambiguous approval: Phrases like "Confirm, but revise Item 2" are treated as revision requests. The system will regenerate the complete document and will not advance with partial confirmation.

Extra time spent on this gate is worthwhile. The UbD five-part template serves as the backbone of the textbook. All subsequent chapter structures are derived from this framework; chapters inconsistent with the core storyline will be removed or restructured.

The skill forces you to clarify your design thinking, rather than making decisions on your behalf.

After confirmation, the five-part template is saved into 00-TextbookDesign.md under the section“## 2. Confirmed UbD Five-part Template”, and the progress file is updated simultaneously.

## The Second Gate: How to Review Chapter Structure & Gradient Report

After confirming the UbD five-part template, the workflow enters Stage 3. Four deliverables are generated in one batch, then the process pauses at the second gate. Review guidelines for each component are listed below.

### 1. Review Chapter Structure Tree. Each chapter entry includes: chapter number, chapter title, one-sentence positioning, and the ID of enduring understandings it carries. This ID is critical; it answers why this chapter exists.

The structure supports bidirectional consistency checks: If a chapter bears no enduring understandings, remove or restructure it; If an enduring understanding has no supporting chapter, add a chapter or explicitly state its removal.

Excerpt sample:

| Chapter No. | Chapter Title | One-sentence Positioning | Enduring Understanding ID |
| --- | --- | --- | --- |
| 01 | Vectors and Vector Spaces | Starting from "magnitude + direction", encode geometric intuition into two algebraic operations: vector addition and scalar multiplication | [1] |
| 02 | Matrices and Linear Transformations | Reinterpret matrices as spatial transformations, exposing the composition logic behind the row-column multiplication rule | [2] |

### 2. Review Exercise Plan. Define themes and Bloom’s taxonomy levels for three exercise categories in each chapter: Demonstration Examples / Guided Practices / Independent Exercises. Bloom’s taxonomy is an educational framework for cognitive depth, ordered from low to high: Remember → Understand → Apply → Analyze → Evaluate → Create.

### 3. Review Gradient Report. It provides a level-by-chapter matrix plus three automated checks:

- Warning if ≥60% exercises cluster within a single cognitive level;

- Warning if Apply/Analyze levels are missing;

- Reminder if Remember/Understand levels are insufficient.

Case: The Eval4 textbook (7 chapters, 47 planned exercises) achieves 47% Apply-level exercises, below the 60% threshold, and passes all three checks.

All warnings must come with actionable revisions—for example, add exercises of Level X in Chapter N. Problems cannot be flagged without corresponding solutions.

![Bloom taxonomy cognitive-gradient report](/blog/textbook-writer-skills/image21.png)

*Figure 7: The gradient report keeps cognitive progression consistent instead of distributing difficulty randomly.*

### Fourth review: Performance Tasks. Prepare 1–3 comprehensive tasks, each tagged with its corresponding transfer goal. In plain terms: what students should be able to accomplish after finishing this textbook.

Once all four components are reviewed, the system halts at this checkpoint:

![Second approval gate for chapter structure and exercises](/blog/textbook-writer-skills/image22.png)

Confirmation rules are identical to the previous gate: state modifications explicitly if needed, and the full revised scheme will be regenerated.

After confirmation, content will be saved into 00-TextbookDesign.md under sections:“### 3. Chapter Structure & Gradient Plan (Confirmed)”and“### 4. Performance Tasks”. The progress file is updated to current_stage=4, and the chapter count is finalized.

The entire textbook framework design is completed. The next phase is full-text generation.

## Grab a cup of tea and watch the textbook generate chapter by chapter

Stage 4 has no manual gate and requires no human intervention. You may wait and observe chapter files being created one after another.

The system proceeds sequentially by chapter number, printing a progress line for each chapter:

![Chapter generation progress shown in the terminal](/blog/textbook-writer-skills/image23.png)

▶ Chapter 1/7: Vectors and Vector Spaces

When composing Chapter N, the model receives only four inputs: the chapter outline segment, UbD five-part template, unified glossary, and the chapter summary from the prior chapter.

No text from other chapters will be loaded.

This is a purposely built context isolation mechanism. Cross-chapter consistency is maintained via lightweight carriers including the glossary and previous chapter summaries. The context window will not overflow even with a large number of chapters, which solves the context capacity limitation.

Each chapter follows a fixed four-part structure: Concept Explanation → Demonstration Examples → Guided Exercises → Independent Exercises, together with a chapter introduction and chapter summary. Below is the actual generated skeleton of Chapter 1:

![Generated chapter skeleton with four learning sections](/blog/textbook-writer-skills/image24.png)

Examples constitute a critical module with strict rules: answers for computational problems can only be output after practical verification.

Implementation: Write Python verification scripts (sympy/numpy) adopting alternative solution paths, execute the scripts and cross-check outputs. Verification code is attached alongside exercises for review.

There are only two validation statuses:

- ✅ Verified (<method>)

- ⚠️ Author Confirmation Required (<reason>) — open discussion tasks and numerical experiments that cannot be automatically validated shall be marked explicitly. Falsified verified status is prohibited.

This workflow eliminates computational error risks.

![Completed chapter with computational verification labels](/blog/textbook-writer-skills/image25.png)

*Figure 8: Four-section chapter finalized draft and real calculation verification labels*

After each chapter is finished, a new file is added to the textbook project directory:

![Generated textbook project directory and chapter files](/blog/textbook-writer-skills/image26.png)

The glossary deserves attention: all terminology and notation conventions for the whole book are centralized here. New entries are automatically appended upon completion of each chapter. Since the glossary is fed into the context when drafting every chapter, inconsistencies such as "Chapter 8 forgetting notations defined in Chapter 2" will not occur.

## How to Resume After an Interruption

The solution is straightforward: repeat the triggering prompt.

This works for closed terminals, network disconnections, computer sleep and similar scenarios. The progress file .progress.json adopts an immediate write policy: the system saves progress after finishing every stage and every chapter. If an interruption occurs, only the chapter currently being drafted may be lost; all completed work remains intact.

Below is a real example of the progress file (raw file captured during interruption in Evaluation 4):

![Example textbook progress JSON during an interruption](/blog/textbook-writer-skills/image27.png)

File interpretation: The workflow reaches Stage 4 (chapter-by-chapter writing). Both gate checks are confirmed. There are 7 chapters in total; Chapters 1 and 2 are finished, and Chapter 3 is pending.

Resume Workflow. Start a new conversation (works across days or different machines) and send the identical trigger prompt:

![Prompt used to resume textbook generation](/blog/textbook-writer-skills/image28.png)

Write the textbook Introduction to Linear Algebra, save files to directory ./Textbook_Workspace/Intro_Linear_Algebra/

The system loads .progress.json, locates the breakpoint following loading rules, and outputs the notice:

![Resume notice showing the next unfinished chapter](/blog/textbook-writer-skills/image29.png)

▶ Resume: Introduction to Linear Algebra, continue from Chapter 3

Writing resumes starting with Chapter 3. Files for Chapter 01 and 02 remain untouched.

![Diagram of the three supported resume breakpoints](/blog/textbook-writer-skills/image30.png)

*Figure 9: Three resumption breakpoints. Resume execution from the exact stopping point.*

The rule "completed chapters will not be rewritten" has undergone independent validation in Evaluation 4:

The SHA-1 hash of Chapter 01 stays identical before and after resumption. The introduction of Chapter 02 properly builds on key conclusions from Chapter 01’s summary, and the terminology list can be incrementally extended (example expanded from 7 to 14 entries).

Cross-machine Resumption. This relies on workspace version control design: .progress.json is tracked in the Git repository. Resuming on another machine uses standard Git operations:

![Git commands used to resume the project on another machine](/blog/textbook-writer-skills/image31.png)

After cloning, send the same trigger prompt to Claude Code to resume.

## Interruption During Gate Validation

If the task stops during a gate stage (e.g., the 5-component set is displayed but not confirmed), reloading the task will read existing outputs from 00-CurriculumDesign.md, re-present pending confirmation items, and will not discard existing drafts. No full restart is needed.

Critical reminder: Do not manually edit .progress.json. This file is maintained exclusively by the main workflow. Manual edits frequently cause mismatches between recorded status and actual files. If the file gets corrupted, run git checkout to revert to the last committed version.

## Final Stage: Self-inspection Report & Delivery Summary

After all chapters are drafted, Phase 5 begins. The system runs five self-inspection items one by one. For each item, it outputs a result (Pass / Fail), the exact location of the issue, and revision suggestions.

| No. | Self-inspection Item | Checklist |
| --- | --- | --- |
| 1 | Chapter Alignment Check | Verify whether each chapter truly implements the planned enduring understandings, and confirm every enduring understanding is properly covered in the text. |
| 2 | Bloom’s Taxonomy Gradient Review | Build a gradient matrix using exercises actually written in each chapter. The review is based on finalized text rather than the initial outline. |
| 3 | Terminology Consistency Check | Cross-reference the terminology table and spot-check all chapters to ensure consistent wording and symbols. |
| 4 | Unverified Example Screening | Search the full manuscript for items marked Author Confirmation Required. Compile a complete list for the author’s review. |
| 5 | Progression Logic Check | Examine each chapter’s introduction to ensure natural continuity with the previous chapter. Check for concepts introduced before their formal definition later in the text. |

Self-inspection is not a mandatory gate. After the report is generated, the author decides whether to revise failed items. If revision is requested, the system locates the target chapter, reorganizes materials and triggers single-chapter rewriting, followed by a second review after revisions.

The final delivery summary includes: total chapter count, total number of three categories of exercises, number of verified exercises, full list of items marked Author Confirmation Required, gradient review conclusions, and an inventory of unresolved issues (if any).

Additional note: The Author Confirmation Required tag is compliant. The rule permits clear marking of unverifiable content. Falsifying verification status is prohibited. All such examples must be manually checked before publication, and every entry will be fully listed in the delivery summary without omission.

Once this stage is finished, the full workflow for textbook development is complete.

## Modular Usage: No Need to Write a Whole Book at Once

The workflow supports modular invocation. The three sub-skills can be triggered independently; the full pipeline does not need to run every time.

| Objective | Prompt to send to Claude Code | What it delivers |
| --- | --- | --- |
| Only design curriculum and outline | Use textbook-outline to draft an outline for a data structures textbook | Complete positioning and two gate checks, output 00-CurriculumDesign.md. The textbook skill can later resume writing at any time. |
| Write a single chapter from an existing outline | Use textbook-chapter to write Chapter 3 following the outline | Generate a complete chapter in the four-paragraph structure. |
| Write an in-depth technical article with full examples | Use textbook-chapter to write an article explaining XXX | Standalone mode: generate a lightweight 5-component set (1 enduring understanding + 1 core question), present it for confirmation, then start writing. |
| Generate only verified exercises | Use textbook-exercises to create exercises on matrix multiplication | Collect requirements on topic, difficulty, quantity and level distribution. Every exercise is validated by computation before output. |

Key behavioral difference: Independent sub-skill calls do not create .progress.json. This file is only generated by the main skill. Standalone sub-skill runs are one-off tasks and do not support resume writing.

## What to Do When You Encounter Issues

Below are the seven most frequent problems, sorted by occurrence frequency.

### No response after entering "use write-textbook to write a textbook"?

This stems from the renaming mentioned earlier. Starting from v0.2.0, all skills have been renamed to follow the textbook- noun convention. Legacy names are removed with no aliases available. Name mapping:

write-textbook → textbook

design-textbook-outline → textbook-outline

write-textbook-chapter → textbook-chapter

generate-textbook-exercises → textbook-exercises

Trigger the workflow with the updated name, e.g. "Use textbook to write a textbook". You will see the progress line: ▶ Phase 1/5: Confirm Teaching Orientation if it works.

### The plugin is installed, yet "write a textbook" fails to activate the workflow?

Most likely you are testing within the same session where the plugin was installed. Plugins only take effect in newly created sessions. Start a new conversation and retry. If the issue persists, run /plugin and verify textbook-writer appears in the installed list. Reinstall it if missing.

### The gate confirmation steps feel verbose. Can I skip confirmation and generate content directly?

Skipping is prohibited by design. Gates are hard constraints that cannot be eliminated by any workflow optimization. Core instructional design decisions require human approval.

Reply "Confirm" to proceed if you accept the draft. The confirmation itself takes negligible time; the real workload lies in deliberate planning — which is exactly what this mechanism enforces.

### Some exercises in the final draft are tagged ⚠️ Author Confirmation Required.

This is not an error. Open-ended discussion questions and numerical experiments cannot be automatically validated by the system. Specifications mandate explicit marking instead of falsely claiming validation.

Complete manual review for all marked items before publication. The delivery summary generated in Phase 5 aggregates all such labels for easy auditing.

### You receive a "unsupported" prompt when writing history or philosophy textbooks?

The v0.2.0 workflow documented in this article supported STEM subjects with automatically verifiable exercises. Current releases add humanities and economics profiles; check the project README for the latest scope.

When reproducing the historical workflow, you may continue manually with conceptual analysis tasks. For new projects, use a current subject profile instead.

### Continuation behaves abnormally after manual edits to .progress.json.

The progress file should only be read and written by the main skill. Manual edits often create mismatches between recorded states and local chapter files (e.g. Chapter 3 is included in the done while the file does not exist).

**With Git:** restore `.progress.json` to the last valid committed version. **Without Git:** align the `done` and `next` fields with the chapter files that actually exist, then restart. The fix succeeds when the printed resume point matches the local files.

### Continuation fails after upgrading from 0.1.x to 0.2.0 for unfinished textbooks.

v0.2.0 introduces one breaking change: the standard heading for design documents is unified to ## 2. UbD Framework (Confirmed). Legacy documents use old headings, causing lookup failures during resume.

Manually replace the corresponding section heading inside 00-textbook-design.md with the updated standard heading, then resume writing.

After installation, input the prompt "Write a textbook using textbook". The system will guide you through the whole process step by step via follow-up questions.

The truly time-consuming part is not the 40-minute operation itself. It lies in defining what learners should take away after finishing the course at two critical checkpoints (gate) — and figuring out the intended learning outcomes is inherently the most intellectually demanding part of textbook development.

## Further Reading

- Project Repository: The README contains full design rationale and milestone updates.

- handoff-contract.md: The definitive specification for phase handoff contracts, implementation layout and state machines. This single document covers all low-level mechanism details.

- docs/adr/: Nine Architecture Decision Records explaining the rationale behind each design choice.

- UbD Whitepaper (ASCD): The original source of Understanding by Design (backward design).
