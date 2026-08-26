---
title: Translating Kern
description: How to improve one of Kern's languages, or add a new one, without touching TypeScript.
---

Kern ships in Arabic, English, German, Persian and Turkish. Every user-facing string lives in one
JSON file per language in the `app` repository, so improving a language means editing one file — no
TypeScript, no build system, no framework.

If you speak one of these languages natively, the most useful thing you can do is read the screens
and tell us where they sound wrong. German, Arabic and Turkish were written without a native
reviewer; Persian was not. All four want your eyes.

## The files

```
repos/shell/messages/en.json      the source — every key starts here
repos/shell/messages/{ar,de,fa,tr}.json
repos/shell/messages/GLOSSARY.md  one English noun, one translation per language
```

English is the source language. A key exists in `en.json` first and every other file follows it.

## Improving a language

```bash
cd repos/shell
pnpm i18n:missing de       # what German is missing, with the English for each key
# edit messages/de.json
pnpm exec biome format --write messages/
node scripts/check-i18n.mjs
```

The check is the same one CI runs. It reports, per language: keys missing against English, keys that
exist nowhere in English, placeholders that changed name or vanished, values still identical to
English, and plural forms the language needs but the message does not cover.

## Translate the meaning, not the words

A correct word-for-word translation is often a bad string. What to do instead, with examples from
this repository:

- **Recast the sentence.** Persian puts the subordinate clause first where English puts it last.
  `tracker_settings_import_hint` reverses the English clause order and reads better for it.
- **Replace idioms, do not carry them.** "You're all caught up" became «همه‌چیز به‌روز است» —
  "everything is up to date". The English idiom has no Persian equivalent, so it was dropped.
- **Add the particles your grammar needs.** "Search {workspace}…" is ungrammatical in Persian
  without a preposition: «جستجو در {workspace}…».
- **Read the frame the string lands in.** `invite_shares_with_you` was once a correct translation
  that was a noun phrase where the surrounding sentence needed a verb. It was right on its own and
  wrong in place. Open the screen.
- **Decline loanwords.** Turkish writes the plural of a foreign noun with an apostrophe —
  `Webhook'lar`, not `Webhooks`. "Epic" is `Epik`.

## The glossary is binding

`messages/GLOSSARY.md` fixes one translation per language for each product noun — issue, workspace,
cycle, milestone, board, view, label, plan, seat. Check it before inventing a word, and add a row
when you settle one.

This matters more than it sounds. Persian once rendered the identical English string "{count}
issues" as «{count} کار» in one screen and «{count} مورد» in another. German called a work item
`Vorgang` everywhere except two dashboard widgets, which said `Aufgaben` — two words for one noun,
in the screens most likely to be read side by side.

## Plurals

Languages count differently. English has two forms, Arabic has six, Persian and Turkish have one
after a numeral. A counted message is written as a variant:

```json
"tracker_issues_count": [
  {
    "declarations": ["input count", "local n = count: number", "local countPlural = count: plural"],
    "selectors": ["countPlural"],
    "match": { "countPlural=one": "{n} issue", "countPlural=other": "{n} issues" }
  }
]
```

Give your language exactly the categories it uses — `one`, `two`, `few`, `many`, `zero`, `other`,
whichever apply. **A missing category is not a fallback: the reader sees the raw key name.** Arabic
with only `one` and `other` printed `tracker_issues_count` for 2, 3 and 11. The check catches this,
which is why it exists.

`{n}` goes through `Intl.NumberFormat`, so Persian and Arabic readers get their own digits without
you doing anything.

## What stays in English

Brand and protocol names (Mailgun, Postmark, SMTP, Stripe), identifiers (`KERN-1`, `cf.<key>`,
`.env`), query fragments, and anything a user types verbatim. The time field's `1h30m` placeholder is
one of these: the parser reads `h` and `m` and nothing else, so translating the placeholder would
show a shape the field rejects. It does read your digits — `۱h۳۰m` works.

`scripts/check-i18n.mjs` keeps two lists: keys that are literals in every language, and words a
language genuinely shares with English. German writes Status, Name, Dashboard and Backlog exactly as
English does, and those are listed so the check stays quiet about them and loud about everything else.

## Adding a language

```bash
cd repos/shell
node scripts/i18n.mjs new nl     # declares it, creates the file, prints what is left
node scripts/i18n.mjs fill nl    # writes every key as a TODO stub, shaped for your plural forms
```

Declaring a language does not make CI demand a complete one — translate at your own pace. When it
reaches 100%, add it to `REQUIRED` in `scripts/check-i18n.mjs` and CI will keep it there.

Two things the scaffold cannot do for you: add the language to `localeNames` in the appearance
settings page, or the picker shows a bare code; and, if it is written right-to-left, add it to the
`RTL` set in the root layout. The scaffold prints both, with paths.

City names for the timezone picker come from CLDR — run `node scripts/gen-timezone-cities.mjs`.
Never translate those by hand; there are 519 of them.

## Before you open a pull request

```bash
cd repos/shell
node scripts/check-i18n.mjs
pnpm exec biome format --write messages/
```

A pull request that improves one language is welcome on its own. You do not need to touch the others.
