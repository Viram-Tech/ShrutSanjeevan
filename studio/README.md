# Library CMS — Sanity Studio setup

The website's **Library** page reads its books from Sanity when
`SANITY.projectId` is set in `src/config.js`. Until then it falls back to the
built-in sample list, so nothing breaks before setup.

This folder holds the **schema** (`schemas/book.js`) — the source of truth for
what a "Book" looks like. Follow the steps below once to stand up the Studio.

## 1. Create the Studio project

In a **new, separate folder** (not inside the website repo):

```
npm create sanity@latest
```

- Sign in / create a Sanity account (free).
- Create a **new project**, e.g. `shrutsanjivan-library`.
- Dataset name: `production` (public read).
- Pick the "Clean project with no predefined schemas" template.
- Choose the default project output path.

This scaffolds a Studio app and prints your **Project ID**.

## 2. Add the Book schema

Copy `schemas/book.js` from this repo into the Studio project's schema folder
(usually `schemaTypes/` or `schemas/`), then register it. In the Studio's
`schemaTypes/index.js` (or `schema.js`):

```js
import book from './book'

export const schemaTypes = [book]
```

(If your Studio uses `sanity.config.js` with an inline `schema.types` array,
add `book` there instead.)

## 3. Deploy the Studio (hosted, for non-devs)

From the Studio folder:

```
npx sanity deploy
```

Choose a hostname → your staff edit books at `https://<name>.sanity.studio`.

## 4. Allow the website to read it (CORS)

In the Studio project settings (or https://sanity.io/manage → your project →
API → CORS origins), add:

- your production website URL (e.g. `https://testproj.vercel.app`)
- `http://localhost:3000` (for local development)

No credentials needed — reads are public. Leave "Allow credentials" off.

## 5. Point the website at the project

In `src/config.js` set:

```js
export const SANITY = {
  projectId: 'YOUR_PROJECT_ID',
  dataset: 'production',
}
```

Deploy the website. Add books in the Studio, reload the site, and they appear
in the Library.

## How the fields map to the site

| Studio field                     | Site behaviour                              |
| -------------------------------- | ------------------------------------------- |
| `fullBookPdf`                    | "Download whole book" button                |
| `previewPdf` (book)              | Online reader when a book has no chapters   |
| `chapters[].pdf`                 | Per-chapter download (one at a time)        |
| `chapters[].previewPdf`          | "Preview" (read chapter online); falls back to the chapter PDF |
| `title/author/language/topic/…`  | Card, filters, and sorting                  |

Covers are generated automatically from each book — no image upload needed.
