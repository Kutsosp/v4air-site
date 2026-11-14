# Automated site tests

GitHub runs these on every pull request and on every change to `main` (workflow `.github/workflows/site-tests.yml`).
Nobody has to start them. On a pull request they show up as a check at the bottom of the page:

- **green tick**: safe to merge as far as the tests can tell;
- **red cross**: do not merge. Click **Details**, then **Summary**: a table lists each check and what went wrong.

## What is checked

**Forms data test** (`forms/run.mjs`). The real application form and the real nomination form are filled in Chrome,
the way a person would, and sent through the real backends: the Cloudflare Worker (normal path) and the Apps Script
code (fallback). Google Sheets is imitated in memory, so the real Sheet is never touched and no passwords are needed.
The imitation starts with the live Sheet's column headers (`forms/fixtures/sheet-headers.json`) and two old rows.

| Scenario | What it proves |
|---|---|
| Partner PhD, every visible answer | each answer is in the column of the same name, with the same value |
| Worker down | the Apps Script fallback stores the same answers |
| Answers Sheets could misread | `=1+1`, `0123`, `1/2`, `50%`, `TRUE`, dates stay exactly as typed |
| Senior outside the partners, no AI yet | the other branches of the form store correctly |
| Nomination with two people | the nomination row and one Nominees row per person |
| Existing columns and old rows | no existing column moved, renamed or lost; old rows unchanged |

The summary also lists the **new columns** a change adds; they appear at the right end of the real Sheet the first time
someone saves after the change goes live.

**Site check** (`site/check.mjs`). Every page under `public/` opens in Chrome; it fails on a JavaScript error, an internal
link, image, stylesheet or script that does not exist, or invalid structured data, invalid structured data, a broken copy rule (`site/rules.mjs`: "conference",
prices outside /pricing/, partner lists without all six universities) or sideways scrolling at phone width.

## Live form check (the real site and the real Sheet)

Workflow `.github/workflows/live-check.yml`, script `live/run.mjs`. The tests above prove our code; this one proves that
what is deployed works: the forms on https://v4air.eu send test answers through the live Worker and Apps Script into
the real forms Sheet, the check reads the rows back and compares them with the page, then deletes them.

| When | What runs |
|---|---|
| after every successful deploy of the site, the Worker or Apps Script | application through the Worker, application with the Worker blocked (Apps Script fallback), nomination with two nominees |
| every night (04:23 Prague) | one application through the Worker |
| by hand: Actions, Live form check, Run workflow | either of the two |

- Test rows use the address `v4air-test-live-<run>-<tag>@example.com`. The backends never email `@example.*` addresses.
- Cleanup always runs, also after a failure, and deletes every row with such an address in Applications, Nominations
  and Nominees. It refuses to delete more than 30 rows at once.
- After a deploy it first waits (up to 20 minutes) until the live form has the same fields as the deployed commit.
- A failure opens the issue **Live form check failed** (later failures comment on it); the next pass closes it.
- It needs the repository secret `LIVE_TEST_SA_KEY`: the JSON key of the service account that writes the forms Sheet.
- GitHub pauses nightly runs in a repository without commits for 60 days and emails the owner; re-enable them in Actions.

Run it locally with the key file (never commit or print the key):

```
LIVE_TEST_SA_KEY_FILE=/path/to/key.json npm run live            # LIVE_MODE=simple for one application
```

## When the live Sheet gets new columns

Refresh the fixture so the test always starts from the real header: run in this folder, with access to the forms Sheet,
the small script at the top of `forms/fixtures/README` (or ask Claude: "refresh the forms test fixture").

## Run locally

```
cd tests
npm install
npx playwright install chromium      # or use your Chrome: CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm run forms
npm run site
```
