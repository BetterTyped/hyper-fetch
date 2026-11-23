# Style: sentences, words, banned constructions

These rules bind running prose in technical documents. They do not bind quoted material, code blocks, schemas, or an example that discusses a banned phrase as evidence.

## Sentence rules

- One claim per sentence. Average around 20 words, hard maximum 35. In procedures: one action per sentence, present tense or imperative, with a visible actor. No semicolon chains of actions.
- Active voice with a named actor: "the pipeline sets the tag", not "the tag is set". An obligation names its owner: "the team confirms this before phase 1", not "that must be confirmed".
- Give agency to the thing that acted. A framework does not "want", a diagram does not "prove", an architecture does not "decide" unless the implementation literally performs that action. Name the code, test, or person that did it.
- Vary sentence length. Three or more short sentences in a row read as staccato: merge them. When a claim carries a condition, cause, exception, or consequence, keep it in the sentence with the claim rather than stating it as a separate short sentence. The average and the hard maximum still bind, and a second claim still gets its own sentence.
- Do not open three consecutive sentences with the same subject. Merge, switch subject, or lead with the action. One repetition is fine; the pattern is the problem.
- Keep articles. "The context window", never "Context window": dropped articles read as headline voice.
- No noun stacks over three words. "Agent retry budget config" is unreadable.
- Each paragraph should change what the next paragraph can say. If paragraphs can be rearranged without changing the argument, they are separate mini-essays, not one piece of writing. Do not restate a point with new nouns to make the piece feel complete.

## Word choice

- Replace an adjective with a number wherever one exists. "140 keys", not "many keys".
- One term per concept, the whole document through. Pick at first use and never rotate synonyms, including verbs for the same action (create/make/generate). More than five defined terms: add a glossary appendix.
- Label an estimate as an estimate, with what it depends on. A fact read from a repo or API needs no hedge.
- Write "is" and "has" where they fit, not "serves as", "functions as", "acts as", "features", "boasts", "comprises".
- Plain verbs over formal ones: "test", not "exercise" or "trial"; the same for every formal variant of an everyday verb.
- Concrete over abstract: a version number beats "recent releases", a named failure mode beats "issues".
- Metaphor only where it explains something the literal description cannot. In gates and procedures the action wins: "the release stops until the product owner approves", not "the train waits". A domain term that happens to be a metaphor may stay; the decoration around it goes.
- Keep the register steady. A plain engineering account must not turn into a slogan, a sales page, or an academic abstract for one paragraph.

Two self-checks apply to every finished paragraph:

- **The read-aloud rule.** Read the paragraph aloud, and rewrite whatever you would not say to a colleague.
- **The remove-the-name test.** For any text about a specific system (a README opening, an overview, a design doc summary): delete the product name and reread. If a stranger could no longer tell what the text is about, it is generic and carries no information; rewrite from the system's own specifics. Does not apply to reference tables and procedures, which are legitimately generic in shape.

## Headings name the content

Four heading kinds: noun phrase, infinitive or imperative, question, and symptom. Use a noun phrase by default; use an infinitive or imperative above a procedure; use a question only in a genuine FAQ or troubleshooting list; use the verbatim symptom in a troubleshooting entry ("Containers won't start", the verbatim error string), naming what the reader searches for.

Banned: the heading that names the question instead of the content ("What tips the answer", "Why this is important"). A heading states the finding, never promises a reveal. The first sentence under a heading never repeats the heading: under "## Rollback" write the mechanism, not "Rollback is important."

## Banned constructions

Each entry names the pattern; the quoted phrases are examples, and paraphrases of the pattern are equally banned. The patterns are language-agnostic; the example vocabulary is English, and a document in another language gets the same patterns checked against that language's own vocabulary list where one exists.

| Pattern | Example | Repair |
|---|---|---|
| Antithesis / negative parallelism | "This is not a technical choice, it is an organizational one"; "not X but Y"; softened forms "less X than Y" | State the positive claim: "the choice affects the organization more than the technology" |
| The reframe-denial | "The number was never the hard part" | Say what the hard part is, directly |
| Meaning-sentence at the end of a section | "That distinction matters"; a closer explaining why the preceding text was important | Delete it; end on the last fact |
| Manufactured-insight setup | "And the part most people miss:"; "What nobody tells you is" | State the point without announcing its rarity |
| False-candor setup | "Here's the honest catch:"; "To be fair," as a pivot | State the caveat |
| Importance announcement | "What matters is", "The key takeaway is", "It is important to note" | State the concrete consequence |
| Recap sentence | "Overall", "In conclusion", "The bottom line" | End on the last fact |
| Restatement for emphasis | A second sentence repeating the first with more force | Keep the better one |
| Rhetorical triad / rule of three | "faster, safer, and more predictable" | Two items, four items, or the one measured claim: "saves two manual steps per release" |
| Question headings and indirect-question headings | "Why this matters", "What X means", "How does Y work?" | Noun phrase naming the content (see "Headings name the content" above); real questions only in a genuine FAQ |
| Throat clearing | "There are several ways to", "In order to", "This document will explore" | Start with the thing the sentence is about |
| Filler | "concretely", "in practice", "note that", "essentially", "basically", "the core is" | Delete |
| Inflated adjectives | crucial, robust, fundamental, essential, significant, seamless, comprehensive | A number, a named property, or nothing |
| Promotional vocabulary | groundbreaking, state-of-the-art, game-changing, world-class, revolutionary, cutting-edge | Concrete, verifiable statements only |
| Cursed vocabulary | delve, intricate, tapestry, pivotal, underscore, foster, testament, leverage, unlock, realm, nuanced, holistic, "landscape"/"navigate" figuratively | The plain word |
| Trailing participle analysis | ", highlighting the need for", "which underscores that", ", streamlining the process" | Delete the tail; it adds no fact |
| False range | "from architecture to culture" where the ends share no scale | Name the actual items |
| Stacked hedging | "could potentially, in some cases, arguably" | At most one qualifier per claim, and only when the source demands it |
| Vague attribution | "experts say", "research suggests" | Name the source and the finding, or own the statement as opinion |
| Symbolic gloss | "This represents a shift toward" | Show the consequence that makes the interpretation true |
| Bold-lead bullets | "**Performance:** the system..." repeated down a list | Bullets that need headings are subsections; a list needs parallel items |
| Emoji furniture | emoji as bullets, prefixes, or category markers | Plain markers |
| Assistant residue | "Here is an overview", "I hope this helps", "Great question", reasoning traces, placeholder text, leaked citation markers | Delete; never ship correspondence as prose |
| Production residue | "as requested", "per the instructions", "unlike the previous version", "this guide deliberately avoids X", "this section was added because" | A constraint shapes the design and stays invisible; exclusions are stated only when the audience needs them |
| Leaked intent example | an example the requester gave to communicate intent, appearing as content in the deliverable | Requester examples are diagnostic material: read the audience and abstraction level from them; the document carries its own examples |
| Closing offer | ending a document with a question or an offer to the reader | Documents end on content; an offer belongs in chat, one line at most |

## Formatting

Formatting reveals structure already present in the material; it must not supply importance the prose has not earned.

- Tables only when items carry two or more properties each and a reader compares across them. A two-column table of prose is prose, or a list. Structure earns its place when a consumer acts on it; otherwise it buys indentation.
- Do not put a heading above every paragraph, or turn a list into a miniature article.
- No section shorter than three paragraphs in running analysis; shorter means it is not a section. Outside running analysis a heading still needs more than one paragraph under it. Template-mandated sections (a summary, a status table, a definitions block) are exempt: they are as long as their job requires.
- Structural Markdown in specifications, provenance tables, and required review formats is functional, not decorative. These rules never flatten a document whose schema carries evidence.
