# Turkish Translation Helper Guide

This guide helps you create Turkish translations for all lecture files.

## File Naming Convention

For each English file `{slug}.mdx`, create a Turkish version `{slug}.tr.mdx` in the same directory.

## Translation Checklist

### Prompting Category
- [x] `101.mdx` → `101.tr.mdx` ✅ Created
- [ ] `102-study-cases.mdx` → `102-study-cases.tr.mdx`
- [ ] `201.mdx` → `201.tr.mdx`
- [ ] `202-study-cases.mdx` → `202-study-cases.tr.mdx`
- [ ] `203.mdx` → `203.tr.mdx`
- [ ] `204.mdx` → `204.tr.mdx`

### LLM Category
- [ ] `101.mdx` → `101.tr.mdx`
- [ ] `102-study-cases.mdx` → `102-study-cases.tr.mdx`
- [ ] `201.mdx` → `201.tr.mdx`
- [ ] `202-study-cases.mdx` → `202-study-cases.tr.mdx`

### AI Tooling Category
- [ ] `101.mdx` → `101.tr.mdx`
- [ ] `102-study-cases.mdx` → `102-study-cases.tr.mdx`
- [ ] `201.mdx` → `201.tr.mdx`
- [ ] `202-study-cases.mdx` → `202-study-cases.tr.mdx`

### Reasoning Category
- [ ] `201.mdx` → `201.tr.mdx`
- [ ] `202.mdx` → `202.tr.mdx`
- [ ] `203.mdx` → `203.tr.mdx`
- [ ] `204.mdx` → `204.tr.mdx`
- [ ] `205.mdx` → `205.tr.mdx`

### Resources Category
- [ ] `101.mdx` → `101.tr.mdx`
- [ ] `201.mdx` → `201.tr.mdx`

## Translation Guidelines

1. **Keep Frontmatter Structure**: Translate `title` and `description`, but keep the same structure
2. **Translate Content**: Translate all text content to Turkish
3. **Keep Code Examples**: Code examples can remain in English or be translated if they contain comments
4. **Keep Component Names**: Keep React component names like `<Mermaid>`, `<MultiLanguageCode>` unchanged
5. **Translate Mermaid Labels**: Translate text labels in Mermaid diagrams
6. **Keep Technical Terms**: Some technical terms can remain in English (e.g., "API", "LLM") or use common Turkish equivalents

## Example Translation Pattern

**English:**
```mdx
---
title: "Prompting 101"
description: "Introduction to prompt engineering fundamentals"
---

# Introduction to Prompting

Welcome to Prompting 101!
```

**Turkish:**
```mdx
---
title: "Prompting 101"
description: "Prompt mühendisliği temellerine giriş"
---

# Prompting'e Giriş

Prompting 101'e hoş geldiniz!
```
