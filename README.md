# Srinidhi Embroidery — design catalogue

A small, static design catalogue for customers to browse and refer to a design by its exact shop-assigned number. Built with HTML, CSS, browser JavaScript, and `designs.json`. No framework runtime, server, account, cart, or build step is required to publish it.

> **Demo content:** the four entries and SVG motifs currently in `designs.json` are illustrative demonstration artwork. They are not genuine Srinidhi Embroidery inventory. Replace both the demo images and the sample numbers with owner-approved designs and identifiers before publishing to customers.

## Files

- `index.html` — page structure and metadata.
- `style.css` — responsive presentation and reduced-motion preference.
- `script.js` — catalogue loading, validation, search, shareable links, and accessible image dialog.
- `designs.json` — the complete source of catalogue entries; every owner-assigned number stays a string.
- `assets/` — demonstration illustrations. Replace them with owner-supplied photos.
- `validate_catalog.py` — optional local check for JSON shape, duplicate numbers, and image files; Python is not needed to view or publish the site.

## Add a design

1. Copy the owner's original design photo into `assets/designs/`. A short filename is easiest, for example `assets/designs/flower-border-104.webp`.
2. Add an entry to the `designs` array in `designs.json`. Keep `number` as a quoted string and preserve it exactly as supplied, including leading zeroes. Write useful image alt text describing the image and including its exact number.
3. Remove `"demo": true` only when the entry represents a real, owner-approved design. The visible DEMO treatment is automatically omitted for entries without that property.

Hypothetical example only—not shop inventory. If the owner assigns `6205` and uploads `assets/designs/6205.jpg`, the manifest changes like this.

Before:

```json
{
  "designs": [
    {
      "number": "001",
      "image": "assets/demo-petal.svg",
      "alt": "Demonstration embroidery illustration, design number 001: a flower.",
      "demo": true
    }
  ]
}
```

After (the design number is a string, and the image path maps to the supplied file):

```json
{
  "designs": [
    {
      "number": "001",
      "image": "assets/demo-petal.svg",
      "alt": "Demonstration embroidery illustration, design number 001: a flower.",
      "demo": true
    },
    {
      "number": "6205",
      "image": "assets/designs/6205.jpg",
      "alt": "Embroidery design number 6205: describe the visible stitching and motif."
    }
  ]
}
```

Keep the existing entry and add the new object with a comma between the objects. Replace all demonstration entries and artwork with real, owner-approved designs before customers use the catalogue.

The identifier is deliberately a string: `"0104"` must not be changed to the number `104`. Keep each `number` unique. Duplicate checks ignore case and surrounding whitespace, but the original string is displayed unchanged. Image paths are relative to this project root; do not begin a local path with `/`.

Optionally check the catalogue from this folder before publishing:

```sh
python validate_catalog.py
```

The browser also validates the loaded data and reports missing images as they fail to load. The local script checks whether referenced files exist on disk.

## Update an existing design

Find the object with the exact current `id` and change only the fields that need updating. For example, to replace its photo and revise its title:

```json
{
  "number": "0104",
  "image": "assets/flower-border-104-new.webp",
  "alt": "Embroidery design number 0104: a fine floral border with small leaves and curved stems."
}
```

Keep the same `number` if the shop still uses the old number. Changing a number also changes that design's shareable link.

## Remove a design

Delete the whole matching object from `designs.json`, including the comma after it when needed for valid JSON. Do not leave a trailing comma after the last object. You may also delete its image file if no remaining catalogue entry uses it.

## Image guidance

Use clear, well-lit photos of the actual embroidery, ideally with a simple background and the full design in frame. JPG, PNG, or WebP are suitable. The catalogue uses `object-fit: contain`, so portrait and landscape photos keep their original proportions without cropping. Compress photos before adding them; around 200–500 KB per image is a practical target, balancing clarity and quick mobile loading. Keep original owner photos backed up elsewhere.

**Do not use Git LFS** for this small GitHub Pages site. GitHub Pages does not serve Git LFS objects as ordinary image files for visitors. Commit normal, compressed image files instead.

## Local preview

For the simplest test, open `index.html` through a local static HTTP server (browsers often block JSON `fetch()` when opening a `file://` URL). For example, if Python is installed, open a terminal in this folder and run:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. Stop the local server with Ctrl+C. Alternatively, use the Replit preview tooling; it is only for preview and is not required by the published GitHub Pages site.

## Publish with GitHub Pages

1. Create a repository for the catalogue. The easiest setup is a new, dedicated repository so unrelated workspace files do not get published.
2. Upload `index.html`, `style.css`, `script.js`, `designs.json`, and the full `assets/` folder to the repository root. In GitHub, use **Add file → Upload files**; drag the files and folder into the upload area, then commit. Keep the HTML, CSS, JavaScript, JSON, and assets together.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose the publishing branch (commonly `main`) and the folder that contains `index.html` (commonly `/ (root)`), then save.
5. Wait for GitHub Pages to publish. Read the real site address shown under Settings → Pages, open it, and confirm the catalogue and images load. A later commit to the selected branch/folder publishes updates.

This site uses relative asset and manifest URLs, so it can run at either kind of GitHub Pages address without a hardcoded deployment URL:

- **Repository named `yourname.github.io`:** Pages serves the repository at the domain root, such as `https://yourname.github.io/`; `index.html` and `designs.json` are at that root.
- **A regular project repository:** Pages normally serves it below a project path, such as `https://yourname.github.io/repository-name/`. Keep all site files together in the published folder; relative paths continue to resolve below that project path.

The examples above explain URL shapes only. They are not deployed addresses.

## Share a design and make a QR code

Opening a design adds a link such as `#design-0104` to the page address. The exact identifier is URL-encoded for the link; the catalogue still displays the original string. A customer can share that full address, and reopening it opens the selected design. Unknown or removed numbers receive a friendly message.

After the real Pages deployment is live, copy its actual address from **Settings → Pages**. For the main QR code, use that base address with no fragment so it opens the collection. For an optional design-specific link, add `#design-` and the URL-encoded owner-assigned number, for example `#design-0104` when the number is `0104`. Open the deployed link to make sure it reaches the intended page/design. Paste the verified, real deployed link into a QR-code generator you trust, download the QR image, and scan the printed code with a different mobile device before distributing it. Do not make or distribute a QR code until the real deployment URL is known and checked.

## Limitations and future uploads

GitHub Pages hosts static, public files. The catalogue can read the JSON and images committed to its repository, but it has no database or private storage; edits require someone with repository access to update the files and publish a commit. Anything committed to the repository, including catalogue images and numbers, is public. Keep owner approval and backups in mind.

**Check GitHub's business-use policy before publishing this shop catalogue there.** GitHub's current Pages policy says Pages is not intended or allowed as free web hosting for an online business or a site primarily directed at facilitating commercial transactions or commercial SaaS. This catalogue has no checkout, but it is for a shop; confirm the current policy applies to the intended use. If it does not fit, choose a host that permits business websites.

GitHub currently documents these Pages limits: source repositories have a **recommended** limit of 1 GB; a published site may be no larger than **1 GB**; bandwidth has a **soft** limit of **100 GB/month**; and builds have a **soft** limit of **10 per hour** (unless published with a custom Actions workflow). A Pages deployment can time out after **10 minutes**. For regular repository files, GitHub warns above 50 MiB and blocks files larger than 100 MiB; browser uploads are limited to 25 MiB per file. These policies can change, so check the linked official docs before relying on them. Compress embroidery photos and avoid committing oversized originals.

References checked October 2026:

- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub Docs: large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [GitHub Docs: Git LFS](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage) — Git LFS cannot be used with GitHub Pages.
- [GitHub Acceptable Use Policies](https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies)

A protected upload/admin area that can authenticate the owner, validate uploads, and persist changes would require a secure backend and protected file storage (or a carefully designed authenticated content service). **GitHub Pages alone cannot accept or persist uploads.** Do not put private credentials in browser code or a public repository.
