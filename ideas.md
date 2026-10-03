# College Timetable AI — Design Direction

## Three possible approaches

### Theme Name: Campus Ledger
Very brief intro: A warm editorial planning interface inspired by academic registries, printed timetables, and annotated studio work. It makes complex scheduling feel trustworthy, legible, and human.
Probability: 0.04

### Theme Name: Signal Grid
Very brief intro: A dark operational control room with luminous status signals and high-contrast timetable blocks. It emphasizes live constraint resolution and system feedback.
Probability: 0.07

### Theme Name: Quiet Atlas
Very brief intro: A calm, spatial interface using pale paper tones, ink-like typography, and measured diagrams. It positions timetable generation as a navigable academic map rather than a spreadsheet.
Probability: 0.03

## Selected approach: Campus Ledger

### Design Movement
Contemporary editorial dashboard design with references to university registries, Swiss information design, and carefully annotated working papers.

### Core Principles
1. Make scheduling logic visible without making the interface feel technical or intimidating.
2. Use asymmetrical editorial composition: a persistent navigation rail, strong left-aligned headings, and a wide timetable canvas.
3. Give every status a clear visual language so conflicts, capacity, and generated outcomes can be scanned quickly.
4. Prefer crisp structure, restrained ornament, and tactile paper-like depth over generic SaaS gradients.

### Color Philosophy
The interface uses an off-white paper ground, charcoal ink, deep indigo for primary actions, and a distinctive marigold accent for the active scheduling signal. Indigo communicates institutional trust and algorithmic confidence; marigold marks attention and progress without making the product feel like an error console. Conflict states use a controlled vermilion, while successful constraints use a muted green.

### Layout Paradigm
A left-side campus rail anchors navigation and identity. The main area is an editorial workspace: title and generation controls on the left, compact operational metrics on the right, then a large timetable surface with a deliberate horizontal rhythm. Supporting views appear as tabs rather than separate pages so the user can compare student, faculty, room, and conflict perspectives without losing context.

### Signature Elements
- A small marigold “logic pulse” line and dot used for generation status, active tabs, and constraint highlights.
- Timetable cards with thin ink rules, slightly offset shadows, and color-coded subject bands inspired by register tabs.
- Numbered section labels and concise annotation copy that explains what the algorithm is checking.

### Interaction Philosophy
Interactions should feel like editing a working academic register: direct, reversible, and informative. Generating a timetable should expose progress and result quality. Hovering a session should reveal its faculty, room, batch, and constraint rationale. Invalid inputs should be explained in plain language rather than merely blocked.

### Animation
Use short 160–240ms ease-out transitions for button states, tabs, filters, and card elevation. The timetable should enter with a soft stagger from the rows, while the generation action uses a subtle moving pulse on the marigold indicator. Avoid excessive motion; the system should feel dependable. Respect prefers-reduced-motion.

### Typography System
Use Fraunces for high-impact headings and section titles, paired with IBM Plex Sans for interface text, metadata, and table content. Headings use compact line-height and occasional italic emphasis for editorial character. Interface labels are uppercase or small caps with increased tracking only where they communicate category or status.

### Brand Essence
College Timetable AI is a transparent scheduling workspace for colleges that need conflict-free timetables without losing human oversight. Personality: methodical, candid, resourceful.

### Brand Voice
Headlines are confident and precise; CTAs are active and specific; microcopy explains the reason behind system decisions.
Example lines: “Build a timetable the whole campus can trust.” and “Resolve the room and faculty bottlenecks before they reach Monday morning.”

### Wordmark & Logo
A compact “CT” monogram built from two interlocking timetable columns, with the crossbar of the T doubling as a horizontal time-slot rule. It should work as an ink mark in the rail and as a small favicon without relying on text.

### Signature Brand Color
Marigold Signal — #E3A62F. It is warm, ownable, and reserved for the active scheduling moment: generation, selected slots, and attention-worthy constraints.

## Implementation reminders

- This direction is intentionally light, editorial, and information-dense; avoid purple gradients, default centered SaaS layouts, and generic rounded-card repetition.
- Every page and major component should preserve the Campus Ledger principles: ink-like hierarchy, marigold signal, asymmetrical workspace, visible scheduling logic.
- The prototype should communicate that graph coloring, combinatorics, and logic are active parts of the product, not hidden marketing language.

## Style Decisions

- The college timetable site is the authoritative data source for programs, batches, faculty, subjects, rooms, and source period structure; it informs content and feature coverage, not visual copying.
- The timetable remains a Campus Ledger workspace: paper ground, editorial type, persistent indigo campus rail, marigold scheduling signal, register-like rules, and transparent graph logic.
- Timetable colors are semantic: lecture/classroom sessions use the classroom palette, laboratory sessions use a dedicated lab treatment, and empty cells remain visibly unassigned.
- The six-day, eight-period college rhythm is preserved as P1–P8, and the source selector exposes real programs, semesters, sections, and verified source counts.
- Major views should visibly connect source records to scheduling decisions through evidence labels, model marks, and session rationale rather than generic dashboard copy.
