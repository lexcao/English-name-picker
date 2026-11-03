# English Name Picker

Find an English name from the popular names of your birth year, try a sound or first letter close to your real name, and say it aloud.

Live site: https://lexcao.io/English-name-picker/

## Features

- Birth-year and gender/category form, with the year range read from data metadata; default year **2025**.
- Initial-letter filtering, ranked name cards, and batches of 100 names with load more.
- Select and remove favorites, review your shortlist, and listen to names.
- Browser speech synthesis with enable/disable, language, and voice settings. Available voices depend on the browser and operating system.
- Paginated table showing rank, name, gender, and birth counts.
- Social handle checks via profile links for Instagram, X, TikTok, and GitHub. Check availability manually on each platform; a missing profile does not establish availability. Platforms have different username rules.
- 中文 / English toggle, initially chosen from the browser language; the language preference is saved locally.
- Responsive light/dark UI that follows the system theme.
- Home, choose, browser, and check routes use `#/`, `#/choose`, `#/browser`, and `#/check` so refreshing a route works on GitHub Pages without server rewrites.

## Development

Requires **Node.js 24 or newer**.

```sh
npm install
npm run dev
npm run build
npm run preview
```

The application uses vanilla TypeScript and Vite, with no runtime framework dependencies. `build` runs TypeScript checking before bundling. Vite uses `base: './'`; assets and data load relative to the deployed directory, including `/English-name-picker/`.

## Data

**Data: SSA, years 1880–2025.** Source: [U.S. Social Security Administration national baby names](https://www.ssa.gov/oact/babynames/limits.html), `names.zip`. The committed JSON was generated from the archive supplied on November 3, 2026. `public/data/meta.json` records the source, URL, year range, and generation timestamp.

Download the official **national** `names.zip` archive, then regenerate:

```sh
# Default input location (the ZIP and data/raw directory are gitignored)
mkdir -p data/raw
# Save the downloaded national archive as data/raw/names.zip
npm run generate:data

# Or pass an explicit archive path
npm run generate:data -- /path/to/names.zip

# Archive used for this refresh
npm run generate:data -- /workspace/english-name-refresh/picker/ssa-names-2026-11-03.zip
npm run build
```

The generator reads `yobYYYY.txt` files, orders each year's male/female records by occurrences (retaining SSA order for ties), and writes up to the top 1,000 records per year and category to `public/data/YYYY-male.json` and `public/data/YYYY-female.json`. Older years may have fewer than 1,000 names. Each record contains `name`, `gender` (`male`/`female`), numeric `occurrences`, and a one-based `rank`. The year range comes from the archive. The app fetches these local files on demand; it does not depend on a remote dataset server.

SSA categories reflect sex recorded in the source data. Names are U.S. birth records, not a complete list of English names. SSA omits names with fewer than five occurrences to protect privacy.

## Deploy

The repository's existing GitHub Pages deployment uses the `gh-pages` branch. With the Git remote and GitHub authentication configured, run:

```sh
npm run deploy
```

This builds `dist/` and uses the `gh-pages` package to publish that directory to the `gh-pages` branch. Keep GitHub Pages configured to serve that branch's root. No domain is hardcoded into the application or build configuration. Deployment is an explicit step; ordinary builds do not publish anything.
