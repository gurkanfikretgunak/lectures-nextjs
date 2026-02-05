# AI & LLM Lectures

A comprehensive, modern lecture platform built with Next.js for learning about Artificial Intelligence, Large Language Models, Prompting, AI Tooling, and their real-world applications. Features bilingual support (English/Turkish), interactive diagrams, code examples in multiple languages, and a beautiful, responsive design.

**Made by [gurkanfikretgunak](https://github.com/gurkanfikretgunak)**

## ✨ Features

- 📚 **Comprehensive Content**: Lectures covering Prompting, LLM, AI Tooling, Reasoning, Applications, and Resources
- 🌍 **Bilingual Support**: Full English and Turkish language support with automatic fallback
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode support
- 🔍 **Powerful Search**: Fast, client-side search across all lectures
- 📊 **Interactive Diagrams**: Mermaid diagram support for visual learning
- 💻 **Multi-Language Code**: Code examples in Python, TypeScript, C#, and Dart
- 📱 **Mobile Responsive**: Optimized for all screen sizes
- ⚡ **Fast Performance**: Built with Next.js 14 for optimal performance
- 🎯 **Table of Contents**: Automatic TOC generation from headings
- 🔒 **Password Protection**: Optional password gate for content protection

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lectures-nextjs.git
cd lectures-nextjs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. (Optional) Configure password protection:
```bash
cp config.yaml.example config.yaml
# Edit config.yaml to set your password
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
lectures-nextjs/
├── app/                      # Next.js app directory
│   ├── [category]/          # Dynamic category routes
│   │   └── [slug]/          # Dynamic lecture routes
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── not-found.tsx        # 404 page
├── components/              # React components
│   ├── layout/              # Layout components (header, sidebar, TOC)
│   ├── mdx/                 # MDX custom components
│   │   ├── mermaid.tsx      # Mermaid diagram component
│   │   ├── multi-language-code.tsx  # Multi-language code blocks
│   │   └── code-block.tsx   # Code block component
│   └── ui/                  # UI components (shadcn/ui)
├── content/                 # MDX lecture files
│   ├── prompting/          # Prompting lectures
│   ├── llm/                # LLM lectures
│   ├── ai-tooling/         # AI Tooling lectures
│   ├── reasoning/          # Reasoning lectures
│   ├── applications/       # Application case studies
│   └── resources/          # Resources
├── contexts/               # React contexts
│   └── language-context.tsx # Language switching context
├── lib/                    # Utility libraries
│   ├── mdx.ts              # MDX file processing
│   ├── mdx-components.tsx  # MDX component mappings
│   ├── translations.ts     # Translation strings
│   └── config.ts           # Configuration loader
└── config.yaml             # Configuration file
```

## 📝 Content Management

### Creating a New Lecture

1. Create a new MDX file in the appropriate category directory:
```bash
content/prompting/301.mdx
```

2. Add frontmatter:
```yaml
---
title: "Your Lecture Title"
description: "Brief description of the lecture"
category: "prompting"
level: 301
order: 3
---
```

3. Write your content using Markdown and MDX:
```markdown
# Your Lecture Title

Your content here...

<Mermaid chart={`
flowchart LR
    A[Start] --> B[End]
`} />

<MultiLanguageCode
  python={`print("Hello, World!")`}
  typescript={`console.log("Hello, World!");`}
/>
```

### File Naming Convention

- **English (default)**: `{slug}.mdx` (e.g., `101.mdx`)
- **Turkish**: `{slug}.tr.mdx` (e.g., `101.tr.mdx`)

See [CONTENT_TRANSLATION.md](./CONTENT_TRANSLATION.md) for detailed translation guidelines.

### Categories

- `prompting` - Prompting techniques and strategies
- `llm` - Large Language Models
- `ai-tooling` - AI development tools and frameworks
- `reasoning` - Advanced reasoning patterns
- `applications` - Real-world AI applications
- `resources` - Additional learning materials

### Lecture Levels

- `100-199` - Beginner level
- `200-299` - Advanced level

## 🎨 Custom Components

### Mermaid Diagrams

Render interactive flowcharts and diagrams:

```mdx
<Mermaid chart={`
flowchart TB
    A[Start] --> B[Process]
    B --> C[End]
`} />
```

### Multi-Language Code Blocks

Display code examples in multiple languages:

```mdx
<MultiLanguageCode
  python={`# Python code`}
  typescript={`// TypeScript code`}
  csharp={`// C# code`}
  dart={`// Dart code`}
/>
```

## 🌍 Multi-Language Support

The platform supports English and Turkish. Language preference is stored in cookies and localStorage.

### Adding Translations

1. Create a Turkish version of your MDX file:
```bash
content/prompting/101.tr.mdx
```

2. Translate the content while keeping:
   - Same frontmatter structure
   - Same code examples
   - Same file structure

3. The system automatically:
   - Shows Turkish content when Turkish is selected
   - Falls back to English if Turkish version doesn't exist
   - Updates navigation and UI based on language preference

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Content**: MDX with [next-mdx-remote](https://github.com/hashicorp/next-mdx-remote)
- **Diagrams**: [Mermaid](https://mermaid.js.org/)
- **Code Highlighting**: [rehype-pretty-code](https://github.com/atomiks/rehype-pretty-code)
- **Search**: [FlexSearch](https://github.com/nextapps-de/flexsearch)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Self-hosted with Node.js

## 🔧 Configuration

### Password Protection

Edit `config.yaml` to enable password protection:

```yaml
password:
  enabled: true
  value: "your-password-here"
  message: "Enter password to access the lectures"
```

### Customization

- **Theme**: Modify `tailwind.config.ts` for custom colors
- **Fonts**: Update fonts in `app/layout.tsx`
- **Translations**: Edit `lib/translations.ts` for UI translations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Content Contributions

- Follow the existing MDX structure
- Include frontmatter with proper metadata
- Add code examples where applicable
- Consider adding Turkish translations

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Code highlighting by [Shiki](https://shiki.matsu.io/)

## 📞 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Made with ❤️ by [gurkanfikretgunak](https://github.com/gurkanfikretgunak) for the AI learning community
