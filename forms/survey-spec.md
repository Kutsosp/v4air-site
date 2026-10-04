# V4 AI Researchers Meetup: survey specification

Version 1.5, 20.09.2026 (two rounds of preview comments plus the form-UX research pass: 14 screens instead of 8, one method family per screen, weighted progress with time left, radios instead of small dropdowns, visible labels everywhere, exclusive "none" option, 44 px touch targets, one-sentence hints without full stops, "(optional)" in labels). Replaces the current 53-question Google Form. A static preview of Form A with every field, variant, and revealed control visible on one page is in `form-a-preview.html` next to this file. This document defines three instruments question by question (wording, response options, conditional logic) and describes the behaviour the custom form app must provide. Text in [square brackets] is a placeholder the organizers fill in before launch; nothing in brackets is final copy.

## 1. Overview

### 1.1 Three instruments

| Instrument | Purpose | Respondents | Opens | Size |
|---|---|---|---|---|
| A. Application form | Select participants, set session level, build the programme, match people, find speakers and helpers | Applicants | With the open call | 28 items over 14 screens; grids of 2 to 12 rows; target under 10 minutes |
| B. Nomination form | Collect students, researchers, and people outside academia to invite directly | Anyone: applicants, institutional contacts, senior staff | With the open call, standalone link | 1 repeater plus 5 fields; about 2 minutes |
| C. Post-acceptance form | Confirm attendance, shape each contribution, set the format mix, collect logistics | Accepted participants only | After selection decisions | About 20 items, most of them one click |

### 1.2 Goal coverage

| Goal | Where it is served |
|---|---|
| 1. Measure proficiency | A3 (level per method) |
| 2. Select participants | A1 (identity and mix fields), A2 (project), A3 to A6 (fit) |
| 3. Measure interest in topics | A3, A4, A5 ("want to learn" and "could present" per item) |
| 4. Match participants | A3 to A5 ("could present" = offers), A6 (needs), admin coverage matrix (section 5.12) |
| 5. Staff the event | A7 (roles, organizing help), C2 (contribution details) |
| 6. Recruit through nominations | B |

### 1.3 Conventions

- IDs such as `A3.m04.level` are variable names. The form app stores and exports them exactly as written here.
- "Required" means the respondent cannot advance past the section without answering.
- "Reveal" means a control that appears only after another control on the same row is ticked.
- "Variant" means wording that changes with the career stage chosen in A1.4. The variants are listed under each affected item.
- Quoted text is copy shown to the respondent. Help text is shown in smaller type under the question.
- Dates in respondent-facing copy are written as "28 April 2027". The event runs Wednesday 28 to Friday 30 April 2027.

### 1.4 Shared item lists

Sections A3, A4, and A5 each use one fixed item list. The lists are defined once here and referenced by ID. The admin dashboard (section 5.12) uses the same IDs.

**Methods (used in A3)**

| ID | Family | Item label | Examples shown in smaller type |
|---|---|---|---|
| m01 | Language and text | LLMs | chat tools, LLM APIs |
| m02 | Language and text | NLP beyond LLMs | topic modeling, text classification, corpus and linguistic analysis |
| m03 | Language and text | Embeddings and semantic search | vector representations, retrieval |
| m04 | Vision and multimodal | Computer vision, static | image classification, object detection |
| m05 | Vision and multimodal | Computer vision, dynamic | video, motion tracking, pose and gesture recognition |
| m06 | Vision and multimodal | Multimodal methods | combining text, image, audio |
| m07 | Speech and signal | Speech and audio processing | ASR, TTS, audio classification |
| m08 | Speech and signal | Sensor and physiological data | eye-tracking, biometric, wearable data |
| m09 | Modeling and inference | Classical machine learning | regression, classification, clustering |
| m10 | Modeling and inference | Bayesian and probabilistic modeling | |
| m11 | Modeling and inference | Causal inference | |
| m12 | Modeling and inference | Network and structural analysis | graph methods, social network analysis |
| m13 | Modeling and inference | Simulation and agent-based modeling | |
| m14 | Generative | Generative AI for content | image, audio, video generation |
| m15 | Generative | Agentic AI and AI-assisted coding | agents, coding copilots, workflow automation |

**Topics (used in A4)**

| ID | Group | Item label | Examples shown in smaller type |
|---|---|---|---|
| t01 | Ethics and society | AI ethics | bias, accountability |
| t02 | Ethics and society | AI policy and regulation | |
| t03 | Human experience | Mental health and wellbeing in relation to AI | |
| t04 | Human experience | Trust and information reliability | |
| t05 | Human experience | Auditability | |
| t06 | Human experience | Tech news overwhelm | |
| t07 | Work and economy | Labor market and future of work | |
| t08 | Work and economy | Economic impact and industry transformation | |
| t09 | Knowledge and culture | Education and learning with or about AI | |
| t10 | Knowledge and culture | Creativity and authorship | |
| t11 | Other | Philosophy of mind and cognition | what AI reveals about human cognition |
| t12 | Other | Environmental and sustainability impact of AI | |

**Experience beyond academia (used in A5)**

| ID | Item label | Examples shown in smaller type |
|---|---|---|
| e01 | Employment outside academia | industry, public sector, NGOs |
| e02 | Freelance or contract consulting | |
| e03 | Advising a company or organization | formal or informal |
| e04 | Founding or co-founding a startup | |
| e05 | Spinning off a company from research | |
| e06 | Licensing or commercializing research or technology | IP, patents, tech transfer |
| e07 | Public engagement or science communication | outreach, media, popularization |
| e08 | Grant or funding applications aimed at commercial or applied outcomes | |
| e09 | Collaboration between academia and industry | joint projects, contract research, technology transfer |

### 1.5 The row pattern used in A3, A4, A5

Every item in the three lists is one row (one card on narrow screens). A row has the same three parts in all three sections, in this column order after the item name:

1. Always visible, first column: a checkbox "I want to learn more".
2. A gate checkbox. Its label differs per section ("I use this", "I work on this", "I have experience with this"). Unticked means the item does not apply; there is no separate "no" option.
3. Revealed when the gate is ticked: in A3, an experience-level control (1 to 4) plus a checkbox "I could present on this". In A4 and A5, only the "I could present on this" checkbox (in A5 worded "I could share this experience").

Revealed controls are not labelled as such in the form; they simply appear.

Reasons for this pattern: each item is read once instead of twice, most rows stay at one click because most people use a few of 15 methods, and "could present" is only offered for items the respondent actually uses or works on. Section intros say explicitly: "Leave an item unticked if it does not apply to you."

## 2. Instrument A: Application form

### 2.0 Intro screen

Title and date line, then the practical box, then the call text. Order matters: the practical facts (time, saving, deadline) come before the pitch, because respondents size up the form before they read about the event.

> **V4 AI Researchers Meetup**
> Kostelec Castle, 35 km from Prague. Wednesday 28 to Friday 30 April 2027.

Practical box:

> **Deadline: 15 January.** Results expected February.

Call text (Peter's wording, 20.09.2026):

> Three days for early-career researchers and graduate students from the V4 region who use or build AI methods across disciplines.
>
> **Participation costs**
> - Students and researchers from partner institutions: fully funded
> - Participants from outside partner institutions: participation fee, amount to be announced
> - All other applicants: TBA
>
> Two dotted-underlined tooltips in the first line, same pattern as "Who is an early-career researcher?" (5.16). "Partner institutions": "Charles University, Czech Technical University in Prague, University of Wrocław, Nicolaus Copernicus University in Toruń, Eötvös Loránd University in Budapest, and Comenius University Bratislava." "Fully funded": "No participation fee. Accommodation at the castle, meals, and a contribution toward travel are covered by the International Visegrad Fund."
>
> **The programme is built from your answers.**
>
> This form asks what you work on, what you want to learn, and who you want to meet. From the answers we pick the talks, workshop topics, and invited speakers, and we put you in the room with the people you asked for. We select for fit and mix, not for who applied first, so a careful application is the best thing you can do for your chances.
>
> You don't need a finished talk or poster. Ideas and work in progress are welcome. If you are selected, we contact you and shape your contribution together.
>
> The programme: a set of talks, a Not-Just-Posters student session, hands-on workshops, and long breaks in one place, so the conversations don't end when the sessions do.
>
> Working language: English.
>
> **Organizing team:**
> Peter Kutsos (project coordinator)
> Petr Chlup (technical coordinator)
>
> Inquiries: info@v4air.eu
>
> **Coordinating institution:**
> Charles University
>
> **Partner institutions:**
> - University of Wrocław
> - Nicolaus Copernicus University in Toruń
> - Czech Technical University in Prague
> - Eötvös Loránd University in Budapest
> - Comenius University Bratislava

Button: "Start the application".

### 2.1 Section A1: About you (screens 1 and 2 of 14)

Screen 1, "About you": A1.1, A1.2, A1.4, A1.11, A1.12, A1.10. Screen 2, "Where you are": A1.3, A1.5, A1.6, A1.7, A1.8, A1.9. Career stage is asked on screen 1 so that screen 2 can already show the right variants.

**A1.1** `A1.name` Full name. Short text. Required.

**A1.2** `A1.email` Email. Email field. Required. Validated for syntax on leaving the field (must contain one "@" and a domain with a dot); the form does not advance with an invalid address. Help: "We use this for the resume link and everything about the meetup". Triggers the resume link (section 5.2).

**A1.3** `A1.country` "Which country is your institution or organization based in?" Autocomplete field over the full ISO 3166-1 country list (not a plain dropdown: the list is far above the 10-option limit where dropdowns stop working). Help: "Start typing to search". Required. The four V4 countries (Czechia, Hungary, Poland, Slovakia) are listed first before any typing; matches are shown as the respondent types. No "Other" option.

**A1.4** `A1.stage` "Where are you in your career?" Single select. Required. Drives variants throughout the form.
- Bachelor or Master student
- PhD student
- Post-doc
- Other early-career researcher. Next to the option, the dotted-underlined question "Who is an early-career researcher?"; hovering or tapping it shows the answer: "We consider early-career researchers to be anyone who identifies as such."
- Senior researcher
- Not in academia

**A1.5** Institution. Required.
- Variant, academic stages: `A1.institution_key` "What institution are you from?" Radio buttons listing the partner institutions located in the country chosen in A1.3, plus "Other" (never more than three options, so radios rather than a dropdown). Choosing "Other" reveals `A1.institution_name`, short text labelled "Name of your institution", required. When the chosen country has no partner institution, the radios are skipped and the text field is shown directly.
- Variant, Not in academia: `A1.institution_name` "Organization", short text, required; and `A1.org_type` "Type of organization", radio buttons, required ("Other" reveals a short text "What kind of organization?"):
  - Company
  - Startup
  - Nonprofit or NGO
  - Government or public sector
  - Research institute outside a university
  - Other: [text]
- Partner institutions and their countries: Charles University (Czechia), Czech Technical University in Prague (Czechia), University of Wrocław (Poland), Nicolaus Copernicus University in Toruń (Poland), Eötvös Loránd University in Budapest (Hungary), Comenius University Bratislava (Slovakia).
- Export: `A1.institution_key` holds one of six partner keys or `other`; `A1.institution_name` always holds the full name, auto-filled when a partner institution is chosen.

**A1.6** `A1.department` "Department or institute (optional)". Short text. Optional. Academic stages only.

**A1.7** `A1.field` Short text. Required.
- Variant, academic stages: "Your field or discipline"
- Variant, Not in academia: "Your area of work"

**A1.8** Conditional short fields.
- Bachelor/Master or PhD student: `A1.programme` "Study programme" (short text, required) and `A1.year` "Year of study" (radio buttons in one row: 1, 2, 3, 4, 5+; required).
- Not in academia: `A1.position` "Your position" (short text, required).
- Post-doc, other early-career, senior: nothing shown.

**A1.9** `A1.days` "Which days can you attend the in-person meetup?" Help: "Kostelec Castle, about 35 km from Prague, Czechia". Multi-select. Required, at least one.
- Wednesday 28 April 2027
- Thursday 29 April 2027
- Friday 30 April 2027

**A1.11** `A1.gender` "Gender (optional)". Dropdown, single select, optional, no validation. Options: Woman (`woman`), Man (`man`), I describe myself otherwise (`other`), Prefer not to say (`not_stated`); the empty default reads "Choose an option" and exports as an empty string. Info-icon tooltip on the label: "We use this information only to ensure a balanced representation of genders at the meetup.". Shown on screen 1 after A1.4. Used only in aggregate for the gender-balance checkpoints and the funder report (gender balance brief, sections 4 and 5); `other` and `not_stated` are counted separately and do not count against either floor. Applications saved before the item existed count as not stated. The consent text in A8 must name this purpose.

**A1.12** `A1.care` "Care duties (optional)". One checkbox, optional, no validation: "I have care duties (a child or a dependent) that make a three-day stay harder for me." Help above the box: "Selecting this does not affect admission. The organizers of V4AIR are committed to gender equality and will use this information only to make the event more accessible to participants of all genders." When ticked, an optional short text `A1.care_detail` appears: "What would help? For example, bringing a child, a childcare room, a nursing room, a specific day or time for your talk."; unticking clears it. Shown on screen 1 after A1.11. Exports as true/false plus the text. Purpose: a count before the venue arrangements are booked (gender balance brief, step 12); details such as ages or numbers belong in form C once people are selected. The consent text in A8 and the privacy notice must name this item and its purpose. Added 04.10.2026.

**A1.10** `A1.link_1` to `A1.link_4` "Links where we can see your work (optional)". Help: "ORCID, Google Scholar, a personal page, GitHub or similar". Up to four URL fields, each with its own visible label "Link 1" to "Link 4", validated for syntax. One field is shown at first; the next appears when the previous one is filled. Optional. Shown on screen 1.

### 2.2 Section A2: Your work (screen 3 of 14)

**A2.1** `A2.project` Long text. Required. Soft limit 1,500 characters with a live counter; no hard cap.
- Variant, academic stages: "Describe a current or upcoming project. What is it about, and how does AI fit in?" Help: "Three to five sentences on what it is, what you find most interesting about it, and where else it could apply, works in progress included".
- Variant, Not in academia: "Describe what you do and how AI relates to your work." Help: "Three to five sentences on what your organization does, your role, and where AI comes in".

**A2.2** `A2.keywords` "Three to five keywords for your work." Tag input with a visible label: type a word or phrase, press Enter or comma to add it; each keyword shown as a removable chip. No placeholder text inside the field. Minimum 3, maximum 5. Required. Help: "Methods, topics, data types or fields, press Enter after each one". Exported as a semicolon-separated string.

### 2.3 Section A3: AI methods you use (screens 4 to 9 of 14)

One screen per method family, then one screen for other methods. Grid research puts the tolerable size at about five rows per screen; the longest family (modeling and inference) has five.

| Screen | Heading | Rows |
|---|---|---|
| 4 | AI methods you use: language and text | m01 to m03 |
| 5 | AI methods you use: vision and multimodal | m04 to m06 |
| 6 | AI methods you use: speech and signal | m07, m08 |
| 7 | AI methods you use: modeling and inference | m09 to m13 |
| 8 | AI methods you use: generative | m14, m15 |
| 9 | Other AI methods you use | c01 to c05 (A3.16) |

Intro, screen 4 only, followed by the level definitions with examples:

> Over the next five short screens, tick the methods you use. For each one, tell us your experience level, whether you could present on it, and whether you want to learn more. Leave a method unticked if you don't use it. You can tick "I want to learn more" on anything, including methods you don't use yet.

Screens 5 to 9 repeat the four level definitions above the grid as a plain list, no heading, no examples. Every method screen (4 to 9) ends with the line: "Ticking "I could present on this" does not commit you to anything. We contact you personally to agree on topic and format."
>
> Experience level:
> 1 Basic use: out-of-the-box tools, for example a chatbot web interface or a pretrained model used as-is.
> 2 Regular use: customizing parameters, using APIs, adapting existing pipelines.
> 3 Advanced use: training or fine-tuning models, building custom pipelines, agentic workflows, coding integration.
> 4 Expert use: building or modifying model architectures or analytical methods.

Each level line has an "Example" toggle next to it (collapsed by default, one click expands). Example texts:

| Level | Example |
|---|---|
| 1 | Asking a chatbot to summarize your interview transcripts, or running a pretrained image classifier on your photos without changing anything. |
| 2 | Calling an LLM API from a script with your own system prompt and settings, or adapting an existing text-processing pipeline to your own corpus. |
| 3 | Fine-tuning a language model on your labelled data, or building a retrieval pipeline that chunks documents, embeds them, and passes the results to an agent. |
| 4 | Designing a new model architecture or loss function, or developing a new statistical estimator and implementing it from scratch. |

Rows m01 to m15, one family per screen, following the row pattern in 1.5:

- First column, always visible: `A3.mNN.learn` checkbox "I want to learn more".
- Gate: `A3.mNN.use` checkbox "I use this". Default off.
- Reveal: `A3.mNN.level` segmented control headed "Experience level" with options 1, 2, 3, 4. Hovering or long-pressing an option shows a tooltip with that level's name and definition (for example "3 Advanced use: training or fine-tuning models, building custom pipelines, agentic workflows, coding integration"). Required once the gate is ticked. Exported as 0 when the gate is off.
- Reveal: `A3.mNN.present` checkbox "I could present on this".

**A3.16** Other methods, `A3.c01` to `A3.c05`, on their own screen (9) headed "Other AI methods you use". Intro: "Anything not covered on the previous screens. Up to five. Type a name; the controls for that row appear, and the next row after it." The grid's first column is headed "Method name" and holds a text field per row (the column header is the visible label; no placeholder). The other columns are the same controls as the fixed rows (learn, use, experience level, present). Controls of a row appear once its name is filled; the next empty row appears at the same moment, up to five. Variables per custom row: `A3.cNN.name`, `A3.cNN.use`, `A3.cNN.level`, `A3.cNN.present`, `A3.cNN.learn`. Rows with an empty name are not exported.

Section exit check, on leaving screen 9: if no gate and no "learn" is ticked on any of screens 4 to 9, show one soft prompt: "You haven't marked any method. Continue anyway?" with "Continue" and "Go back".

### 2.4 Section A4: AI-related topics (screen 10 of 14)

Twelve rows on one screen, above the five-row guideline. Kept together because the rows are two checkboxes each, not a scale, and are grouped under five headings; the pilot (5.14) checks whether this screen loses people.

Intro:

> These are questions about AI rather than methods. Tick the topics you work on or engage with, and the ones you want to learn more about. Leave a topic unticked if it doesn't apply.

Rows t01 to t12, grouped under group headings:

- First column, always visible: `A4.tNN.learn` checkbox "I want to learn more".
- Gate: `A4.tNN.work` checkbox "I work on this".
- Reveal: `A4.tNN.present` checkbox "I could present on this".

Under the grid, one line: "Ticking 'I could present on this' does not commit you to anything. We contact you personally to agree on topic and format."

### 2.5 Section A5: Experience beyond academia (screen 11 of 14)

Intro:

> This section is about steps you have taken to apply your work outside a purely academic setting, whether or not they led anywhere. Tick what you have done and what you want to hear about from others.

Variant, Not in academia, one added sentence: "The items are written from the researcher's side. Tick whatever applies to you from the other side, for example if you have hired researchers, advised, or founded."

Rows e01 to e09:

- First column, always visible: `A5.eNN.learn` checkbox "I want to learn about this".
- Gate: `A5.eNN.have` checkbox "I have experience with this".
- Reveal: `A5.eNN.present` checkbox "I could share this experience".

Under the grid, one line: "Ticking "I could share this experience" does not commit you to anything. We contact you personally to agree on topic and format."

**A5.10** `A5.detail` Revealed under the grid as soon as any box in the grid is ticked. "Tell us more: what did you do, or what do you want to hear about? (optional)" Long text, soft limit 600 characters. Optional. Same behaviour in both variants (academic and not in academia).

The old three-point level (none, some, extensive) is dropped. "Have experience" plus "could share" covers the two decisions the data serves: who to ask to speak, and who wants the session.

### 2.6 Section A6: What you are looking for (screen 12 of 14)

**A6.1** `A6.useful` "What would be most useful to you at the meetup? Pick up to five." Multi-select, maximum 5. Required, at least one. Help: "Do you need someone with specific expertise for a grant project? A supervisor for your thesis idea? Someone to consult?" and, as a second line, "Tell us below and we'll match you with them at the event."
- Finding collaborators
- Feedback on my research direction
- Feedback on results
- Learning methods and approaches from other fields
- Exploring how AI methods could apply to my work
- Contacts in industry, funding, or tech transfer
- Finding talent or expertise for my team or organization
- Sharing my own experience and knowledge
- Just exploring, not sure yet
- Something else: [text] (`A6.useful_other`, short text, revealed when ticked, required when ticked)

Ticking any option reveals a short text field directly under it with the visible label "Tell us more (optional)", up to 300 characters: `A6.useful_detail.<option key>`. Same pattern as the collaborator detail in A6.3. The "Something else" option reveals a field labelled "What is it?", required when the option is ticked.

**A6.2** `A6.collab` "Are you looking for collaborators for your project?" Single select. Required.
- Yes
- Maybe
- No

**A6.3** `A6.collab_kind` Shown when A6.2 is Yes or Maybe. "What expertise or kind of collaborator would help most? (optional)" Short text, up to 300 characters. Optional. Help: "The more specific, the better we can invite people who match".

Closing line of the screen, below A6.3: "We use everything on this screen to build the conference you actually want: the sessions, the people at your table, and the introductions we make before you arrive."

### 2.7 Section A7: Your involvement (screen 13 of 14)

Intro:

> The meetup is built around active participation. Every attendee contributes in some form. Tick the forms you are open to; the exact shape is worked out together with the organizing team after selection.

**A7.1** `A7.roles` "How would you like to contribute?" Multi-select. Required, at least one.
- Speaker
- Workshop leader
- Panel member or interviewee
- Not-Just-Posters session presenter. Info icon with tooltip: "We recommend this session mainly for students who may not yet have the results or experience for a full talk but want to share their project and receive feedback. Student talk applications are also accepted and will be considered."
- Scene setter (open a session with a short briefing or a conversation with a keynote)
- Closer (reflect on the talks in a session, discuss what comes next)
- Not sure yet, I'd like to discuss options
- Other: [text]

**A7.2** `A7.presented` "Have you presented at a conference or workshop before?" Single select. Required. Used to route students between a talk and the Not-Just-Posters session.
- Yes
- No

**A7.3** `A7.roles_note` "Anything to add about how you would like to participate? (optional)" Short text, up to 500 characters. Optional.

**A7.3a** `A7.file`, `A7.link` "Do you have something to show? (optional)" Help: "A paper, a poster, slides, a preprint, a demo, or a repository. One file up to 10 MB (PDF, PPTX, PNG, JPG), or a link". One file input and one URL field, both optional, both allowed. The file uploads the moment it is chosen and can be replaced or removed; it is stored under its original name in the Drive folder `V4AIR uploads/<application ID>/`, one file per application. Exported as `A7.file_name`, `A7.file_url` (Drive link) and `A7.link`.

**A7.4** `A7.help` "Would you help with organizing?" Multi-select. Required, at least one.
- Before the event, at my home institution (promoting the call, recruiting participants)
- On site during the event (coordination, helping other participants)
- I'd rather just participate

"I'd rather just participate" is exclusive: ticking it unticks the two help options, and ticking either help option unticks it.

`A7.help_detail` Revealed when the first or second option is ticked. "Tell us more: what could you help with, and roughly how much time? (optional)" Short text, up to 300 characters. Optional.

### 2.8 Section A8: Last things (screen 14 of 14)

**A8.1** `A8.source` "How did this call reach you?" Multi-select. Required, at least one.
- Nominated by my institution's contact person
- Open call. Ticking it reveals "Where did you see it?", multi-select, at least one required while Open call is ticked:
  - Email (`A8.source_open.email`; reveals `A8.source_open.email_which`, short text "Which mailing list or sender?", optional)
  - My institution's social media (`A8.source_open.inst_social`)
  - Other social media (`A8.source_open.other_social`)
  - An article or news item (`A8.source_open.article`)
  - Somewhere else (`A8.source_open.other`; reveals `A8.source_open.other_txt` "Where?", required when ticked)
- Personal invitation from the organizers
- Other: [text]

**A8.2** `A8.questions` "Questions for the organizers, general comments, or requests (optional)". Long text, soft limit 1,000 characters. Optional. Help: "Anything the form didn't ask about".

**A8.3** `A8.consent` Checkbox. Required. Copy: "[Consent text: who processes the data (Charles University, organizing team), for what (selecting participants, building the programme, contacting the applicant about the meetup), how long it is kept (until [date] after the event), and how to withdraw. Link to the full privacy notice.]"

Button: "Submit application".

### 2.9 End screen

> Thank you. Your application is in. We reply to everyone by [date].
> **Your application ID: V4A-XXXX-XXXX.** Keep it; it is in every email we send you about the meetup.
> You can change your answers until the deadline through the link in the confirmation email.
>
> **Know someone who should be here?** Nominate a student, a researcher, or someone outside academia. It takes two minutes and we invite them directly.
> [Button: Nominate someone] (opens Instrument B with A1.1, A1.2, A1.5, and the application ID prefilled)

Confirmation email: copy of the end screen text, the application ID in the subject line and body, plus the resume link. ID rules are in section 5.17.

## 3. Instrument B: Nomination form

Standalone URL, also reachable from the A end screen with prefill. Open to anyone.

### 3.0 Intro

> **Nominate people for the V4 AI Researchers Meetup**
> Kostelec Castle near Prague, 28–30 April 2027. Free and fully funded for accepted participants.
>
> Know a motivated student, a researcher whose work fits, or someone in industry, tech transfer, or a startup who could bring an outside perspective? Tell us who. We write to them directly and invite them to apply. Two minutes.


### 3.1 About you

**B1** `B.name` Your name. Short text. Required. Prefilled from A when linked.

**B2** `B.email` Your email. Email field. Required. Prefilled from A when linked.

**B3** `B.institution` Your institution or organization. Short text. Optional. Prefilled from A when linked.

**B3a** `B.application_id` "Your application ID (optional)". Help: "If you applied yourself, this pairs your nominations with your application, it is in every email we sent you". Short text, uppercase, format `V4A-XXXX-XXXX` (section 5.17). Prefilled and read-only when opened from the application's end screen. When typed, validated for format on leaving the field; on submit the server checks that the ID exists and, if it does not, accepts the nomination and flags it for the organizers instead of blocking the nominator.

### 3.2 People you nominate

**B4** Repeater. Starts with one empty card; "Add another person" adds a card. Caps: up to 3 students, up to 3 researchers, up to 3 people outside academia. The type selector on each card disables a type once its cap is reached. Each card:

- `B4.n.type` "Who are they?" Single select. Required.
  - Student
  - Researcher
  - Outside academia (industry, tech transfer, startup, public sector, other)
- `B4.n.name` Name. Short text. Required.
- `B4.n.contact` "Email or another way to reach them." Short text. Optional. Help: "If you don't have it, name and institution are enough."
- `B4.n.affiliation` "Institution or organization." Short text. Optional.
- `B4.n.why` "Why do they fit? One or two sentences." Short text, up to 300 characters. Optional. Help: "What they work on, or why they would benefit."

**B5** `B.mention` "May we mention your name when we write to them?" Single select. Required.
- Yes
- No

**B6** `B.consent` Checkbox. Required. Copy: "[Consent text covering processing of the nominator's and nominees' data for the single purpose of sending an invitation, retention until [date], and how nominees are told where their contact came from when B5 is Yes.]"

Button: "Send nominations".

### 3.3 End screen

> Thank you. We will write to them directly.
> **Your nomination ID: V4N-XXXX-XXXX.** Quote it if you write to us about these nominations.
> Haven't applied yourself yet? [Link: Apply to the meetup]

## 4. Instrument C: Post-acceptance form

Sent to accepted participants by personal link. The link carries the participant's identity and the organizers' proposed contribution (section 4.2). Name, email, institution, and days are prefilled from A. The application ID is shown at the top of the form and repeated on the end screen; the C submission gets its own `V4C-` ID (section 5.17).

### 4.0 Intro

> **You're in. A few things before April.**
> About 5 minutes. Deadline: [date].

### 4.1 Section C1: Attendance

**C1.1** `C1.confirm` "Please confirm your participation." Single select. Required.
- Yes, I'll be there
- I can't attend after all (ends the form; shows `C1.reason`, optional short text "If you want, tell us why" and a thank-you)

**C1.2** `C1.days` "Which days will you be there?" Multi-select, prefilled from A1.9, editable. Required.
- Wednesday 28 April 2027
- Thursday 29 April 2027
- Friday 30 April 2027

**C1.3** `C1.arrival` "When do you expect to arrive at Kostelec?" Two selects side by side: day (Tuesday 27 April, Wednesday 28 April, Thursday 29 April, Friday 30 April) and part of day (morning, afternoon, evening). Required.

**C1.4** `C1.departure` "When do you expect to leave?" Same two selects (Wednesday 28 April to Saturday 1 May). Required.

### 4.2 Section C2: Your contribution

**C2.1** `C2.proposal_response` Displays organizer-written text: "Based on your application we propose: [format] on [topic]." Then: "Does this work for you?" Single select. Required.
- Yes
- Yes, with changes (reveals `C2.changes`, short text, required)
- I'd like to discuss it first (reveals `C2.discuss`, short text, optional)

**C2.2** `C2.title` "Working title." Short text. Required when the proposed format is a talk, workshop, or Not-Just-Posters contribution; optional otherwise. Help: "It can change."

**C2.3** `C2.abstract` "Two to four sentences about your contribution." Long text, soft limit 800 characters. Same required rule as C2.2. Help: "This goes into the programme."

**C2.4** `C2.length` "Preferred length." Single select. Shown for talks and workshops only. Required when shown.
- 15 minutes
- 30 minutes
- 45 minutes
- 90 minutes (workshops)
- Other: [text]

**C2.5** `C2.needs` "What do you need in the room?" Multi-select. Required, at least one.
- Nothing special
- Projector
- Whiteboard or flipchart
- Participants bring laptops
- Internet access for participants
- Other: [text]

### 4.3 Section C3: Programme format

**C3.1** `C3.more` "Which two of these formats would you most like to see more of?" Multi-select, exactly 2. Required.
- Frontal talks and presentations
- Interactive hands-on workshops
- Open discussions and roundtables
- Rotating small-group conversations
- Self-organized sessions (propose your own topic)

**C3.2** `C3.less` "Any format you'd rather have less of?" Single select. Optional. Same five options plus "None".

**C3.3** `C3.self_organized` Shown when C3.1 includes "Self-organized sessions". "What topic would you propose?" Short text. Optional.

This replaces the old five-row 1 to 5 enjoyment grid (old Q49). A forced choice of two gives a direct input to the format mix; a five-point scale on every row tends to return "4" everywhere.

### 4.4 Section C4: Logistics

**C4.1** `C4.nights` "Which nights will you stay at the castle?" Multi-select. Required. Options: [organizers list the funded nights, for example Tuesday 27 April, Wednesday 28 April, Thursday 29 April]. Add option "I'll arrange my own accommodation".

**C4.2** `C4.room` [Include only if rooms are shared.] "Rooms are shared. Any preference or constraint we should know about?" Short text. Optional.

**C4.3** `C4.diet` "Dietary requirements." Multi-select. Required, at least one.
- None
- Vegetarian
- Vegan
- Gluten-free
- Lactose-free
- Halal
- Kosher
- Other: [text]

**C4.4** `C4.access` "Accessibility or health needs we should plan for." Short text. Optional.

**C4.5** Travel. Help at the top: "[State the travel contribution rule and any cap here.]"
- `C4.travel_from` "Where will you travel from? City and country." Short text. Required.
- `C4.travel_mode` "How?" Single select: Train, Bus, Car, Plane, Other. Required.
- `C4.travel_cost` "Estimated round-trip cost in EUR." Number. Required.
- `C4.letter` "Do you need an invitation letter or visa support?" Yes / No. Required.

**C4.6** `C4.emergency` "Emergency contact: name and phone number." Short text. Optional.

### 4.5 Section C5: Consents

**C5.1** `C5.list` "May we share your name, institution, and topics with other participants before the event, so people can find each other?" Single select. Required.
- Yes
- No

**C5.2** `C5.photo` "We take photos and short videos during the event for reporting to the funder and for future calls. Is it OK if you appear in them?" Single select. Required.
- Yes
- I'd prefer not to

### 4.6 Section C6

**C6.1** `C6.other` "Anything else we should know?" Long text. Optional.

Button: "Send". End screen: "Thank you. See you in Kostelec on [date]. Practical information follows by email in [month]."

## 5. Form app: required behaviour

Described as text for the build. Applies to all three instruments unless stated.

### 5.1 Structure and navigation
Form A has 14 screens (section 2). "Back" keeps all answers. No screen has more than one grid.

Progress is shown as a bar plus two bold texts under it: "Screen 4 of 14" on the left and "About 7 min left" on the right. The bar is weighted by the expected time of each screen, not by screen count, so it moves fast through the short identity screens and slows through the grids (the meta-analysis in the research pass found constant-speed bars do nothing for drop-off and fast-to-slow bars reduce it). Time left is the sum of the weights of the current and remaining screens, rounded up, never below 1. Expected minutes per screen, to be recalibrated from the pilot (5.14):

| Screen | Minutes |
|---|---|
| Intro | 0.5 |
| 1 About you | 0.75 |
| 2 Where you are | 0.75 |
| 3 Your work | 2.5 |
| 4 to 8 Method families | 0.5 each |
| 9 Other methods | 0.25 |
| 10 Topics | 1 |
| 11 Beyond academia | 0.75 |
| 12 Looking for | 0.75 |
| 13 Involvement | 0.75 |
| 14 Last things | 0.5 |
| Total | 11 |

### 5.2 Save and resume (A and C)
Every change is saved to the server immediately, keyed by a respondent token. When A1.2 is filled with a valid address, the app creates the record, assigns the application ID (5.17), and emails a resume link right away, not only at the end. The link opens the last incomplete section. After submission the same link allows edits until the deadline; the confirmation email says so.

### 5.3 Conditional wording
Label variants keyed by `A1.stage` are stored as a lookup table in the app config, not hard-coded in the templates. Items with variants: A1.5, A1.6, A1.7, A1.8, A2.1, A5 intro. The A1.5 institution list is additionally filtered by `A1.country`.

### 5.4 Reveal rows
The row pattern in section 1.5. Revealed controls animate in briefly and are reachable by keyboard in the natural tab order. Unticking a gate hides the revealed controls and clears their values. Revealed controls carry no "reveal" label or badge in the form.

Growing lists (A1.10 links, A3.16 other methods): one empty entry is shown; when it is filled, the next empty entry appears, up to the cap. Empty entries are not exported.

### 5.5 Pick-up-to-N, exactly-N, exclusive options
A6.1 (up to 5) shows a counter "2 of 5 selected" and disables remaining options at the cap. C3.1 (exactly 2) does the same and blocks "Next" until two are chosen. An exclusive option ("I'd rather just participate" in A7.4, "None" in C3.2, "Nothing special" in C2.5) unticks the others when ticked and is unticked when any other is ticked.

### 5.5a Choice controls
Radio buttons for any single choice with up to about seven options (career stage, institution, organization type, year of study, collaborators, presented before). Checkboxes for multiple choice. Dropdowns are not used in Form A; the country field is an autocomplete. Options are listed vertically, one per line, except short numeric sets (year of study), which sit in one row.

### 5.6 Repeater (B4)
"Add another person" appends a card. Each card has a remove button. Type caps are enforced by disabling a type in the selector once its cap is reached, with a note "You have already nominated 3 students."

### 5.7 Prefill and handoff
The A end screen links to B with a signed, short-lived token carrying name, email, and institution. C links are personal: the token carries the participant ID, prefilled identity and days, and the organizer-written proposal text for C2.1. Tokens expire at the respective deadlines.

### 5.8 Validation and labelling
Validation runs when the respondent leaves a field (not on the first keystroke) and again on "Next". An error message disappears the moment the input becomes valid, without waiting for the field to be left again. Required fields are marked with an asterisk and one legend per screen; optional fields say "(optional)" in the label, since most fields are required. Every input has a visible label outside the field; placeholder text is not used as a label anywhere (it disappears on typing and fails contrast). Email and URL syntax checks. Keyword count check on A2.2 (3 to 5). Long-text fields show a live character counter against the soft limit but never block submission. The A3 all-empty prompt (section 2.3) is the only confirmation dialog in the form.

### 5.9 Narrow screens
Rows render as stacked cards: item label and examples on top, then "I want to learn more", then the gate checkbox, then revealed controls. The level control wraps to two lines at widths under 360 px.

### 5.10 Accessibility and touch targets
Every control has a bound label. Focus order follows reading order. Colour is never the only carrier of meaning. Contrast meets WCAG AA. The whole form can be completed with a keyboard. Every tappable target is at least 44 × 44 CSS px (WCAG 2.2 requires 24 × 24 at level AA; 44 to 48 is the usual mobile recommendation): checkboxes and radios are drawn at 22 px inside a 44 px clickable label area, grid cells are fully clickable, text inputs are at least 44 px tall.

### 5.10a Hint text
One sentence, no full stop, no links, placed under the label and above the control. Hints say how the answer is used or what to put in, not rules. Longer explanations go into the screen intro, not into hints.

### 5.11 Export
CSV and XLSX. One row per respondent, one column per variable ID. Multi-selects are expanded into one boolean column per option (`A6.useful.collaborators`, `A6.useful.feedback_direction`, and so on). Grid items export as `A3.m01.use`, `A3.m01.level`, `A3.m01.present`, `A3.m01.learn`, with level 0 when use is false. Free text exported as-is. Added columns: `started_at`, `last_saved_at`, `submitted_at`, `status` (in progress, submitted, withdrawn).

### 5.12 Admin view
A small internal dashboard, live during the call:
- Counts of submitted and in-progress applications by country (A1.3), career stage (A1.4) and gender (A1.11), for monitoring the mix, plus the count of applicants who ticked care duties (A1.12) with their free-text answers, for the venue arrangements. The gender counts serve the checkpoint dates in the gender balance brief (1 November 2026, 1 December 2026, 15 January 2027).
- Coverage matrix over the 36 fixed items plus a list of custom method names from A3.16: for each item, number of respondents with "learn" ticked and number with "present" ticked. Items with learners but no presenters are the list of gaps to fill by invitation (goal 4). Items with presenters but few learners are candidates to drop from the programme.
- Role lists: respondents per option of A7.1 and A7.4, with A7.2 (presented before) shown next to each name.
- Keyword cloud from A2.2 with counts, clickable to list the respondents who used each keyword.
- Nominee list from B with duplicate detection by email and by normalized name, and a flag when a nominee has already applied.
- Export buttons for A, B, C.

### 5.13 Opening and closing
A and B open together with the call and close at the application deadline; after the deadline they show a closed message with the contact address. C is open per participant from the moment their link is sent until its own deadline.

### 5.14 Before launch
Five test respondents complete A end to end, timed per screen, on their own devices, at least two on phones. Record median time per screen (feeds the weights in 5.1) and any question where two testers hesitate or ask what is meant. Fix wording before the call goes out. Test every variant path (student, researcher, not in academia) and every reveal.

### 5.15 Language
English only.

### 5.16 Tooltips
Two forms. A dotted-underlined question next to an option that shows its answer on hover and on tap (A1.4 "Who is an early-career researcher?"). An info icon next to an option or label that opens a short text on hover and on tap, used on the A1.11 label "Gender (optional)", the A7.1 option "Not-Just-Posters session presenter", and each of the four A3 level options (tooltip = level name and definition). The A3 level examples use a collapsed "Example" toggle instead of a tooltip, so they can be read on any device. Tooltip text is part of the app config, next to the option it belongs to.

### 5.17 Response IDs
Every response in every instrument gets a human-readable ID the moment its record is created, before anything is submitted. Format: a form prefix, a hyphen, and eight characters in two groups of four, from the alphabet `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (no 0, O, 1, I), generated randomly and checked for uniqueness on the server.

| Instrument | Prefix | Example | Created when |
|---|---|---|---|
| A. Application | `V4A` | V4A-7K3M-9QX2 | The applicant enters a valid email in A1.2 (the same moment the resume link is sent) |
| B. Nomination | `V4N` | V4N-4PZR-B8TD | The nomination form is submitted |
| C. Post-acceptance | `V4C` | V4C-M2HW-6EFA | The personal C link is generated for an accepted participant |

The application ID is the key that ties everything about one person together: the A record, any B records where `B.application_id` matches, and the C record. It appears:
- on the A end screen and on the C intro and end screens;
- in the subject line and body of every email about these forms (resume link, confirmation, acceptance or decline, C invitation, reminders);
- prefilled and read-only in B3a when B is opened from the A end screen;
- in the admin view next to the applicant's name, and in every export as `response_id` plus, for B and C, `application_id`.

Nominators who did not apply leave B3a empty; their nomination stands on its own `V4N` ID. Applicants who forget their ID recover it from any email we sent them, or by asking at the inquiry address.

## 6. Mapping from the current Google Form

| Old question | Old content | New location | Note |
|---|---|---|---|
| 1 | Email | A1.2 | |
| 2 | Full name | A1.1 | |
| 3 | Days | A1.9 | Weekday names added |
| 4 | Career stage | A1.4 | "Other" renamed "Not in academia"; tooltip on "Other early-career researcher" |
| 5, 12, 21 | Institution (three branches) | A1.5, A1.6 | Partner-institution select filtered by country, free text for others; department split out as optional |
| 6 | Field (researcher) | A1.7 | Asked of everyone |
| 7, 15, 22 | Project description (three branches) | A2.1 | One field, wording variant |
| 8, 16 | Most interesting about project | A2.1 help text | Folded in as a hint |
| 9, 17 | Applicable beyond context | A2.1 help text | Folded in as a hint |
| 10 | Looking for collaborators (researcher only) | A6.2 | Asked of everyone |
| 11 | Kind of collaborator (researcher only) | A6.3 | Asked of everyone |
| 13 | Study programme | A1.8 | Students only |
| 14 | Year of study | A1.8 | Students only |
| 18 | Most useful at conference (student only) | A6.1 | Asked of everyone, options merged with 23 |
| 19 | Help organizing (student only) | A7.4 | Asked of everyone |
| 20 | Position (other) | A1.8 | Not in academia only |
| 23 | What draws you (other) | A6.1 | Options merged |
| 24 | Hoping to find or contribute (other) | A6.3, A7.3 | |
| 25–29 | Method proficiency, five grids | A3, `level` | Same 15 items, same 0 to 4 scale |
| 30–34 | Methods can talk / want to learn, five grids | A3, `present` and `learn` | Same row as the level |
| 35–39 | Topics engage with, five checkbox lists | A4, `work` | |
| 40–44 | Topics can talk / want to learn, five grids | A4, `present` and `learn` | Same row as `work` |
| 45 | Beyond-academia experience, 3-point grid | A5, `have` | Three-point level dropped |
| 46 | Beyond-academia can talk / want to learn | A5, `present` and `learn` | Same row as `have` |
| 47 | Involvement roles | A7.1 | "Not sure yet" option added; Not-Just-Posters tooltip added |
| 19 (detail) | Help organizing | A7.4 + `A7.help_detail` | Free-text detail revealed when a help option is ticked |
| 48 | Tell us more about participating | A7.3; C2.1 | |
| 49 | Format enjoyment, 1 to 5 per format | C3.1, C3.2 | Moved to post-acceptance; forced choice replaces the scale |
| 50 | Nominate students | B4, type Student | Repeater card |
| 51 | Nominate researchers | B4, type Researcher | Repeater card |
| 52 | Nominate someone else | B4, type Outside academia | Repeater card |
| 53 | How did the call reach you | A8.1 | |
| Section header only | Consent and data policy | A8.3, B6, C5 | Questions added; text to be written |

New items with no old counterpart: A1.3 country (full list, V4 pinned), A1.5 `A1.org_type` for non-academics, A1.6 department, A1.10 links (up to four), A2.2 keywords, A3.16 custom method rows, A5 item e09 and `A5.detail`, A6.1 "Something else" text and per-option details, A7.2 presenting experience, A8.2 questions for the organizers, A3.16 other method, A8.2 consent, B5 mention nominator, all of C1, C2, C4, C5.
