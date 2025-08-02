# Usage Guide for Cursor Templates

## Quick Start

### 1. Installation

**Global Installation (Recommended):**
```bash
npm install -g cursor-templates
```

**Use without installing:**
```bash
npx cursor-templates [command]
```

### 2. Initialize Your First Project

```bash
# Interactive selection
cursor-templates init

# Direct template selection
cursor-templates init --template nextjs-app-router

# Specify custom path
cursor-templates init --template react-native-expo --path ./my-mobile-app
```

### 3. Explore Available Templates

```bash
# List all templates
cursor-templates list

# Search for specific templates
cursor-templates search react
cursor-templates search mobile
cursor-templates search backend
```

## Complete Command Reference

### Core Commands

#### `init` - Initialize a New Project
```bash
cursor-templates init [options]

Options:
  -t, --template <name>  Template name
  -p, --path <path>      Project path (default: current directory)
```

**Examples:**
```bash
# Interactive mode
cursor-templates init

# Specific template
cursor-templates init -t vue3-typescript-vite

# Custom directory
cursor-templates init -t t3-stack-full -p ./my-fullstack-app
```

#### `list` - Show All Templates
```bash
cursor-templates list
```

Shows all available templates with descriptions and tags.

#### `search` - Find Templates
```bash
cursor-templates search <query> [options]

Options:
  -c, --category <category>  Filter by category
```

**Examples:**
```bash
# Search by keyword
cursor-templates search typescript
cursor-templates search mobile

# Search by category
cursor-templates search --category frontend
cursor-templates search --category backend
```

#### `validate` - Validate Template
```bash
cursor-templates validate <template>
```

**Examples:**
```bash
# Validate by template path
cursor-templates validate templates/nextjs/template.json

# Validate custom template
cursor-templates validate ./my-template/template.json
```

#### `create` - Create New Template
```bash
cursor-templates create
```

Interactive wizard to create a new template.

### Discovery Commands

#### `featured` - Show Featured Templates
```bash
cursor-templates featured
```

#### `recommend` - Get Recommendations
```bash
cursor-templates recommend
```

#### `import` - Import from GitHub
```bash
cursor-templates import <github-url>
```

**Example:**
```bash
cursor-templates import https://github.com/user/my-cursor-template
```

## Available Templates by Category

### Frontend Frameworks
- `react-typescript-vite` - React + TypeScript + Vite
- `vue3-typescript-vite` - Vue 3 + Composition API + TypeScript
- `angular-enterprise` - Angular 17+ + Signals + RxJS
- `sveltekit-typescript` - SvelteKit + TypeScript

### Full-Stack Frameworks
- `nextjs-app-router` - Next.js 14+ App Router
- `remix-typescript` - Remix + TypeScript
- `nuxt3-fullstack` - Nuxt 3 + Nitro
- `t3-stack-full` - T3 Stack (Next.js + tRPC + Prisma)
- `astro-content` - Astro + TypeScript + MDX

### Mobile Development
- `react-native-expo` - React Native + Expo + TypeScript
- `flutter-riverpod` - Flutter + Riverpod + Clean Architecture

### Backend APIs
- `node-express-typescript` - Express.js + TypeScript
- `python-fastapi-async` - FastAPI + Async + SQLAlchemy
- `django-rest-api` - Django + DRF + PostgreSQL

### Desktop Applications
- `electron-react-typescript` - Electron + React + TypeScript

## What Happens When You Initialize a Template?

1. **Template Files Created:** Essential configuration files (`.cursorrules`, config files, example components)
2. **Metadata Added:** `.cursor-template.json` file tracks template info
3. **Commands Displayed:** Installation and development commands for your chosen framework
4. **Next Steps Shown:** Clear instructions for getting started

## Example: Setting Up a Next.js Project

```bash
# Initialize the template
cursor-templates init --template nextjs-app-router

# Follow the displayed commands
npm install
npm run dev

# Open in Cursor IDE - the .cursorrules file will automatically configure AI assistance!
```

## Working with .cursorrules Files

Each template includes a `.cursorrules` file that configures Cursor IDE's AI assistant:

- **Framework-specific guidance:** AI knows your framework's best practices
- **Code style preferences:** Consistent formatting and conventions  
- **Restrictions:** Things to avoid in your framework
- **Preferences:** Recommended approaches and patterns

## Custom Template Creation

### Step 1: Create Template Structure
```bash
cursor-templates create
```

### Step 2: Edit template.json
```json
{
  "name": "my-template",
  "description": "My custom template",
  "version": "1.0.0",
  "rules": {
    "context": "Expert developer context...",
    "style": { ... },
    "restrictions": [...],
    "preferences": [...]
  },
  "files": [
    {
      "path": ".cursorrules",
      "content": "# Your cursor rules..."
    }
  ]
}
```

### Step 3: Validate Template
```bash
cursor-templates validate my-template
```

## Tips for Best Results

1. **Use Cursor IDE:** Templates are optimized for Cursor with AI assistance
2. **Follow Commands:** Use the suggested install/dev commands for each template
3. **Check .cursorrules:** Review the AI configuration for your framework
4. **Stay Updated:** Templates follow latest framework best practices

## Troubleshooting

### Common Issues:

**"Template not found"**
- Check template name with `cursor-templates list`
- Use exact template name from the list

**"Permission denied"**
- Use `sudo` for global installation: `sudo npm install -g cursor-templates`

**"Command not found"**
- Ensure npm global bin directory is in your PATH
- Or use `npx cursor-templates` instead

### Getting Help:
- Run any command with `--help` flag
- Check the GitHub repository for issues and documentation
- Use `cursor-templates validate` to check template format

## Next Steps After Template Setup

1. **Install Dependencies:** Run the displayed install command
2. **Start Development:** Use the provided dev command
3. **Open in Cursor:** The AI will be automatically configured
4. **Follow Framework Docs:** Each template includes links to relevant documentation
5. **Customize:** Modify the template files to match your project needs

Happy coding with Cursor Templates! 🚀