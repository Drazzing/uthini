# Laws of UX Reference

Definitions, when to apply, and examples. Source: [Laws of UX](https://lawsofux.com/) by Jon Yablonski.

---

## Aesthetic-Usability Effect

**Definition**: Users often perceive aesthetically pleasing design as more usable.

**When to apply**: Polishing UI, building trust, improving perceived performance.

**Example**: Consistent spacing, clear hierarchy, and brand-aligned colours make a form feel easier to complete even before interaction.

---

## Choice Overload

**Definition**: People get overwhelmed when presented with many options (paradox of choice).

**When to apply**: Menus, settings, filters, multi-step flows.

**Example**: Show 5–7 primary nav items; move secondary links to footer or grouped dropdowns instead of one long nav bar.

---

## Chunking

**Definition**: Break information into small groups and present them as meaningful units.

**When to apply**: Long lists, forms, tables, feature lists.

**Example**: Group contact form into "Personal", "Message", "Preferences"; use a feature grid with 4–6 items per row instead of one long list.

---

## Cognitive Bias

**Definition**: Systematic errors in thinking that influence perception and decisions.

**When to apply**: Copy, defaults, confirmation flows, social proof.

**Example**: Use positive framing ("Save 20%") and clear default choices to guide users toward intended actions without manipulation.

---

## Cognitive Load

**Definition**: The mental effort required to understand and use an interface.

**When to apply**: Every screen; especially forms, dashboards, onboarding.

**Example**: One primary CTA per section; progressive disclosure for advanced options; clear labels instead of jargon.

---

## Doherty Threshold

**Definition**: Productivity soars when system response keeps pace with the user (<400ms feels instant).

**When to apply**: Buttons, navigation, search, any interaction.

**Example**: Provide immediate feedback (e.g. loading state, disabled state) so users never wonder if an action registered.

---

## Fitts's Law

**Definition**: Time to acquire a target depends on its size and distance.

**When to apply**: Buttons, links, nav items, mobile UI.

**Example**: Nav links with `padding: 0.5rem 0.75rem`; mobile tap targets at least 44px; primary CTA larger than secondary.

---

## Flow

**Definition**: Mental state of focused involvement and enjoyment in an activity.

**When to apply**: Long tasks, editors, dashboards, games.

**Example**: Minimise interruptions (modals, notifications); allow saving and resuming; clear progress indicators for multi-step flows.

---

## Goal-Gradient Effect

**Definition**: Motivation increases as people get closer to a goal.

**When to apply**: Progress bars, checkouts, onboarding, rewards.

**Example**: Show "Step 2 of 4" and a progress bar; highlight "Almost there" near the end of a flow.

---

## Hick's Law

**Definition**: Decision time increases with the number and complexity of choices.

**When to apply**: Menus, settings, wizards, filters.

**Example**: Reduce choices per step; use categories or search instead of one giant dropdown.

---

## Jakob's Law

**Definition**: Users spend most time on other sites; they prefer your site to work like those they know.

**When to apply**: Navigation, layout, forms, patterns.

**Example**: Top nav for main links; hamburger menu on mobile; primary CTA on the right or centred; footer with links and legal.

---

## Law of Common Region

**Definition**: Elements inside a clear boundary are perceived as one group.

**When to apply**: Cards, panels, form sections, lists.

**Example**: Use borders or background tint to group related fields (e.g. "Shipping address" in one box).

---

## Law of Proximity

**Definition**: Objects that are close together are perceived as related.

**When to apply**: Spacing, sections, lists, form layout.

**Example**: Smaller gap between a heading and its paragraph; larger gap before the next section.

---

## Law of Prägnanz

**Definition**: People interpret ambiguous or complex images in the simplest way possible.

**When to apply**: Icons, illustrations, layout structure.

**Example**: Use simple, recognisable icons; avoid cluttered or ambiguous visuals.

---

## Law of Similarity

**Definition**: Similar elements are perceived as a group (shape, colour, size).

**When to apply**: Lists, buttons, tabs, cards.

**Example**: Style all primary buttons the same; use one style for external links; consistent card treatment for related items.

---

## Law of Uniform Connectedness

**Definition**: Visually connected elements are perceived as more related than unconnected ones.

**When to apply**: Breadcrumbs, steppers, timelines, related links.

**Example**: Connect steps with a line or colour; group nav items with a subtle background or divider.

---

## Mental Model

**Definition**: Users form a model of how a system works based on prior experience.

**When to apply**: Copy, labels, navigation, error messages.

**Example**: Use "Save", "Submit", "Back" where users expect them; avoid internal jargon that breaks their model.

---

## Miller's Law

**Definition**: The average person can keep about 7 (±2) items in working memory.

**When to apply**: Nav items, list length, form steps, menu options.

**Example**: Limit top-level nav to 5–7 items; chunk long lists into groups of ~5–7.

---

## Occam's Razor

**Definition**: Among options that work equally well, prefer the one with fewer assumptions (simplest).

**When to apply**: Feature decisions, UI options, copy.

**Example**: Prefer one clear path to a goal over multiple equivalent paths that increase complexity.

---

## Paradox of the Active User

**Definition**: Users tend not to read manuals; they start using the software immediately.

**When to apply**: Onboarding, help, tooltips, defaults.

**Example**: Design for immediate use: clear labels, sensible defaults, contextual help rather than long intro text.

---

## Pareto Principle

**Definition**: Often ~80% of effects come from ~20% of causes.

**When to apply**: Prioritisation, analytics, feature sets.

**Example**: Focus UI and performance on the 20% of flows that drive most value; simplify the rest.

---

## Parkinson's Law

**Definition**: A task expands to fill the time available.

**When to apply**: Deadlines, progress, multi-step flows.

**Example**: Use clear steps and optional time estimates so users don't assume a flow is longer than it is.

---

## Peak-End Rule

**Definition**: People judge an experience mainly by how they felt at the peak and at the end.

**When to apply**: Flows, onboarding, support, checkout.

**Example**: End with a clear success state and next step; avoid ending on errors or vague messages.

---

## Postel's Law

**Definition**: Be liberal in what you accept, conservative in what you send.

**When to apply**: Forms, APIs, validation, error handling.

**Example**: Accept flexible input (e.g. phone with or without spaces); display and store in a consistent format.

---

## Selective Attention

**Definition**: People focus on a subset of stimuli relevant to their goals.

**When to apply**: Layout, emphasis, notifications.

**Example**: Make the primary action visually dominant; reduce competing calls for attention on critical screens.

---

## Serial Position Effect

**Definition**: People remember the first and last items in a series best.

**When to apply**: Nav order, lists, carousels, steps.

**Example**: Put key actions at the start or end of a list; avoid burying important items in the middle.

---

## Tesler's Law (Conservation of Complexity)

**Definition**: Every system has some complexity that cannot be reduced; it moves elsewhere.

**When to apply**: Simplifying flows, building tools, onboarding.

**Example**: Simplify the user-facing flow and absorb complexity in the product (sensible defaults, smart behaviour) rather than asking the user to configure everything.

---

## Von Restorff Effect (Isolation Effect)

**Definition**: When several similar objects are present, the one that differs is most likely to be remembered.

**When to apply**: CTAs, alerts, key options.

**Example**: Make the primary button stand out by colour or size; use contrast for "Recommended" or "Save" so it’s noticed.

---

## Working Memory

**Definition**: Cognitive system that temporarily holds and manipulates information for tasks.

**When to apply**: Multi-step flows, comparisons, instructions.

**Example**: Keep steps short; show context (e.g. summary) so users don’t have to remember previous screens.

---

## Zeigarnik Effect

**Definition**: People remember uncompleted or interrupted tasks better than completed ones.

**When to apply**: Progress, save states, reminders.

**Example**: Show incomplete steps (e.g. "Profile 60% complete"); allow saving and returning so users can finish later.
