# Content Translation Guide

This application supports multi-language MDX content files. You can provide Turkish translations for your lecture content.

## File Naming Convention

- **English (default)**: `{slug}.mdx` (e.g., `101.mdx`)
- **Turkish**: `{slug}.tr.mdx` (e.g., `101.tr.mdx`)

## How It Works

1. When a user selects Turkish language, the system will:
   - First look for `{slug}.tr.mdx` file
   - If not found, fall back to `{slug}.mdx` (English)

2. When a user selects English language, the system will:
   - Look for `{slug}.mdx` file (default English)
   - Skip any `.tr.mdx` files

## Example Structure

```
content/
  prompting/
    101.mdx          # English version
    101.tr.mdx       # Turkish version
    102-study-cases.mdx  # English version
    102-study-cases.tr.mdx  # Turkish version
```

## Creating Turkish Translations

1. Copy your English MDX file (e.g., `101.mdx`)
2. Rename it to include `.tr` suffix (e.g., `101.tr.mdx`)
3. Translate the content while keeping:
   - The same frontmatter structure
   - The same code examples (if applicable)
   - The same file structure

## Frontmatter

Both English and Turkish files should have the same frontmatter structure:

```yaml
---
title: "Your Title"
description: "Your description"
level: 101
order: 1
---
```

The `title` and `description` in the Turkish file should be translated, but the structure should remain the same.

## Notes

- If a Turkish translation doesn't exist, the English version will be shown automatically
- Navigation will show titles from the language-specific files
- The language preference is stored in cookies and localStorage
