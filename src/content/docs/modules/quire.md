---
title: Quire
description: Kern's wiki — spaces, a nested page tree, real-time collaborative editing, version history, comments and a database engine.
---

Quire is Kern's wiki. A space holds a tree of pages; a page's prose is a Yjs document that everyone
in it edits at once, and everything else about that page — where it sits, who may read it, its
history, its comments — is a row in Postgres. The module is hosted by the `core` service, and the
editing socket belongs to the separate `collab` service.

**Parts of Quire have an API and no interface yet.** Each section below says which of its operations
have a screen and which do not, and [What is not built](#what-is-not-built) collects the rest.

## Spaces

A space is the top level of the wiki, and the unit permissions are bound to.

Every space carries a **key** — lowercase letters, digits and dashes, 2 to 48 characters, unique
within the workspace. The key is what appears in the URL, so it is worth choosing before anyone
links to a page.

A space also has one of three visibilities:

| Visibility | Who sees it |
|---|---|
| `open` | Every member of the workspace may read it. |
| `restricted` | Members find it and see its name, and need a binding to read a page. |
| `private` | Only people with a binding know it exists. |

`spaces.list` filters row by row rather than asking one workspace-level question, so a space you
have no binding for is **absent from the list** rather than present and forbidden. "You may not open
this" is a different, worse answer than not showing it at all.

Creating a space — name, key, description and visibility — is in the interface. Renaming it, giving
it an icon, setting its home page, changing its visibility and archiving it are on the API
(`spaces.update`, `spaces.archive`) and no screen offers them.

## Pages and the tree

Pages nest without limit, and the whole tree of a space arrives in one request, which is what lets
the sidebar draw every level at once instead of asking per expanded node.

Siblings are ordered by a **fractional index** stored as text rather than by a number. Moving one
page between two others therefore rewrites one row instead of renumbering its siblings, so two
people reordering at the same moment cannot write different numbers for the same rows. The column is
declared `COLLATE "C"`, because the keys are base-62 fractions ordered by code point and any other
collation returns them in an order the algorithm did not intend.

A page is one of three kinds:

- **page** — has a draft and a published version. This is what a documentation space is made of.
- **live** — always live, like a shared note. No draft, no unpublished state.
- **database** — the page's body is a table rather than prose. See [Databases](#databases).

Removing a page has three levels, and they are not the same thing:

1. **Archive** takes the page out of the sidebar. It is still readable, still searchable, and
   comes back with one action.
2. **Trash** takes the page and every descendant out of the space. It is reversible.
3. **Purge** deletes the page, its collaborative document and its history. It cannot be undone, and
   it needs `quire.page.delete`.

Creating, renaming, archiving and trashing a page are in the interface. Reordering and reparenting
(`pages.move`) are on the API, and the sidebar has no drag-and-drop. Listing the trash
(`pages.trash`), restoring from it (`pages.restore`) and purging (`pages.purge`) are on the API, and
no screen lists what is in the trash.

## Writing together

Everyone reading a page shares one document through the `collab` service, so edits appear as they
are typed.

**Presence.** Each person gets a caret in a colour derived from their user id, so somebody keeps the
same colour every session rather than appearing to be a new person after a reload. The page header
counts how many people are in the document.

**Readers.** Somebody who may read a page but not write it appears in the presence list without a
caret. The server strips the cursor and selection out of a read-only connection rather than trusting
the browser to do it, because read-only is decided on the server and the client only receives it as
a hint.

**Offline.** The document is mirrored into IndexedDB, so a page opens instantly and survives losing
the network. Edits made offline merge when the connection comes back.

**Formatting is a closed set**, and it is worth knowing why: everything the editor can write, the
read side has to be able to draw, and a node the editor produces but no renderer understands
disappears silently when the document is read back. The set is paragraphs, headings 2 to 4, bullet
and numbered lists, block quotes, code blocks, horizontal rules, and the marks bold, italic,
strikethrough, inline code and link. Tables, images, file embeds, callouts and toggles are not
in it.

The wire protocol, the document naming and the access check are described in
[Collab protocol](/developers/collab-protocol/).

## Draft and published

A `page` has a draft and a published version. A `live` doc is always live and has neither.

Publishing writes a version, points the page at it and clears the unpublished-changes flag. It needs
`quire.page.publish`. While the draft has moved on from the published version, the page shows a
banner offering **Publish** and **Revert**.

Reverting throws the draft away and puts the published version back. It captures the draft as a
version of its own first, so reverting is not a way to lose an afternoon's writing.

**Publishing records which version a reader should be served; serving it is not built.** Everyone
with read access opens the live document — read-only if they may not write it — whatever has been
published. The published version is what version history marks and what **Revert** goes back to, and
nothing renders it as a page.

## History

A version holds the Yjs state, a snapshot for diffing, the flattened prose and its size in bytes.

Versions are taken:

- automatically, at most once every five minutes while somebody is writing;
- on publish;
- on revert, capturing the draft that is being discarded;
- on restore, capturing the state being replaced *and* recording the restore itself.

**Restoring writes a new version rather than rewinding**, so restoring is never itself the thing
that loses work — the version it replaced is one row above it in the list. It reaches the live
document through `collab.document.replace` rather than by applying an update, because applying an
update *merges*: feeding an old version back would produce the union of the old document and the new
one, with every deleted paragraph returning beside the paragraphs that replaced it.

The version list shows the first 160 characters of each version, so history reads without loading a
document. Listing and restoring are in the interface. Taking a version now and naming it
(`versions.create`) and reading one version's full text (`versions.get`) are on the API.

## Comments

A comment is anchored to a piece of text by a **Yjs relative position**, not a character offset. An
offset names a place that exists only while nobody else is typing: two words inserted above it and
the comment is attached to text it was never about. A relative position points at the content
instead, so it survives other people editing around it.

What the anchor pointed at is stored beside it. A thread whose text has since been deleted therefore
still reads, and the panel says so rather than letting the thread disappear — which is exactly when
somebody's question matters most.

Threads are one level deep. Replying to a reply joins the thread rather than nesting further,
because arbitrary depth in a 320px margin is unreadable. Resolving is a property of the thread and
is written on its root. A comment with no anchor is a remark about the whole page.

Authorisation is answered per action, and it is narrower than most permission systems:

- Anyone with `quire.page.comment` may comment. Guests hold it by default.
- **Only the author may edit a comment.** Editing somebody else's words is not a permission
  anybody holds.
- The author may delete their own comment. Deleting somebody else's needs a workspace **owner** or
  an instance admin — a workspace admin cannot, which is [a known bug](#known-defects).

Posting, replying, resolving and deleting are in the interface. Editing a comment
(`comments.update`) and listing resolved threads are on the API.

## Mentions and notifications

Naming somebody with `@` in a comment notifies them as a `quire.mention`, which arrives in-app and
as a push by default and not by email. You are never notified about mentioning yourself. The
notification carries the first 140 characters of the comment, with the quoted text underneath.

Every notification Quire sends is best effort. A comment must not fail to post because the
notification service is briefly unavailable, so a failure is logged rather than raised.

The `@` menu is not wired into Quire's editors yet — neither the comment composer nor the page body
offers one. The server reads mentions out of whatever body it is given, so a mention posted through
the API notifies; there is no picker on the screen.

## Search

A page is indexed into the workspace-wide search index with its title, its flattened prose and a
link to it. Archived and trashed pages are dropped from the index rather than indexed, because a
search result that opens the trash is worse than no result.

**Only pages in an `open` space are indexed.** A page in a `restricted` or `private` space does not
appear in workspace search, even for somebody who may read it. The reason is that a search index
entry has to name the subjects allowed to see it, and core can answer "may this person read this
object" without being able to enumerate who may. Guessing gives one of two bad outcomes — a private
page in a stranger's results, or a page its own author cannot find — so the restricted case waits
for a procedure that can answer it.

The search box in the sidebar is a different thing and is not affected: it filters the tree already
loaded for the space you are in, so it answers as you type and covers every space you can open.

## Databases

**The database engine is built and has no interface.** Everything in this section is reachable over
the module's API, and nothing in Kern draws it yet.

A page can be a database, and **a row is a page**. That is what makes a row openable, commentable,
versioned and searchable without any of it being built a second time.

Columns are typed, and the set of types is closed on purpose: a type decides how a value sorts and
what a filter may ask of it, so an open set would allow a column no filter could search. The types
are text, number, select, multi-select, status, date, person, files, checkbox, url, email, phone,
relation, rollup, formula, created time, created by, edited time and edited by.

A row's cells live in one `jsonb` column with a GIN index, keyed by a column's **key** rather than
its id, so renaming a column keeps its data.

Filters and sorts run in SQL rather than in memory, because filtering after the fact breaks
pagination — a page of fifty rows filtered down to three is not a page of three, and the caller has
no way to ask for the rest. A property key that arrives in a request is never interpolated into the
query: the property is looked up first, and an unknown key is refused.

- **Relations** write both ends at once, because a link visible from one side only is the bug where
  a rollup silently reads nothing.
- **Rollups** gather a property across a relation and reduce it — count, count values, count unique,
  sum, average, minimum, maximum, range, show original, and the three checkbox reductions.
- **Formulas** are parsed by a hand-written Pratt parser into a typed AST and evaluated by walking
  it. **Never `eval`, never `new Function`**: a formula is text a workspace member types and the
  server evaluates with a database connection already open. Function names are matched
  case-insensitively, over a fixed table of text, number, logic and date functions.

Six view kinds — table, board, calendar, gallery, list and timeline — are declared, and a view's
filters and sorts are applied to the rows it returns. Nothing renders a view.

## Permissions

Every key below is bound at **space** scope, which is what makes "everyone may read the Handbook,
the design team may write it, and this contractor may read one page of it" expressible without a
second permission system. Bindings resolve nearest first: a binding on a page beats one on its
space, which beats one on the workspace, and a deny beats an allow at the same level.

| Key | What it allows | Default roles |
|---|---|---|
| `quire.space.view` | Find a space and read its name | owner, admin, member, guest |
| `quire.space.manage` | Create and configure spaces | owner, admin |
| `quire.page.view` | Read pages | owner, admin, member, guest |
| `quire.page.create` | Create pages | owner, admin, member |
| `quire.page.edit` | Write in a page, rename it, move it | owner, admin, member |
| `quire.page.comment` | Comment without being able to change the page | owner, admin, member, guest |
| `quire.page.publish` | Decide which version is published | owner, admin, member |
| `quire.page.delete` | Purge a page and its history permanently | owner, admin |

Defaults are inherited upwards: owner ⊇ admin ⊇ member ⊇ guest.

The navigation rail and the page menu ask the **workspace-level** answer, which is the right
question for "should this appear at all" and the wrong one for "may I edit this page". The server
asks the space- or page-scoped question and is what refuses.

## Known defects

Two authorisation checks disagree with what the interface shows. Both are in the module rather than
in this page:

- **A workspace admin cannot delete another person's comment.** The check asks for a permission key
  that was never declared, and an undeclared key passes only for an instance admin or a workspace
  owner.
- **The Publish button appears for anybody who may edit.** The menu item and the banner's button are
  shown to holders of `quire.page.edit`, while the server requires `quire.page.publish`, so somebody
  holding one and not the other is offered a button that returns 403.

## What is not built

No dates and no promises — this is what has no code today:

- serving a published version to a reader instead of the live draft
- public or shared links to a page
- import and export of any kind, including Markdown and PDF
- templates
- embeds of issues, files or other pages
- tables and images in the editor
- any interface for databases
- the `@` menu in the page editor and the comment composer
- a trash screen
- drag-and-drop in the page tree
- a space settings screen
- whiteboards, page analytics, blogs and AI

## See also

- [Collab protocol](/developers/collab-protocol/) — the editing socket, document naming and the
  procedures a module calls.
- [Roles & permissions](/administration/roles-permissions/) — how bindings and scopes work across
  Kern.
- The module source: [`KernAIO/module-quire`](https://github.com/KernAIO/module-quire).
- [ADR 0006](https://github.com/KernAIO/app/blob/main/docs/adr/0006-collaborative-documents.md) —
  why prose is a CRDT and everything else is a row.
