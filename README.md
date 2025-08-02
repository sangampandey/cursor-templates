# Cursor Templates 🚀

A comprehensive template system for Cursor IDE, providing ready-to-use project configurations with AI-optimized `.cursorrules` files.

## Features

- **Pre-configured Templates**: Ready-to-use templates for popular frameworks
- **AI-Optimized Rules**: Each template includes `.cursorrules` for optimal AI assistance
- **CLI Tool**: Easy template management and initialization
- **Template Discovery**: Search and discover templates
- **Extensible**: Create and share your own templates

## Installation

```bash
npm install -g cursor-templates
```

Or use directly with npx:

```bash
npx cursor-templates init
```

## Quick Start

### Initialize a new project with a template

```bash
cursor-templates init
```

Or specify a template directly:

```bash
cursor-templates init --template nextjs-app-router
```

### List available templates

```bash
cursor-templates list
```

### Search for templates

```bash
cursor-templates search react
cursor-templates search --category backend
```

## Available Templates

### Frontend
- **nextjs-app-router**: Next.js 14+ with App Router, TypeScript, and Tailwind CSS
- **react-typescript-vite**: React with TypeScript, Vite, and modern tooling

### Backend
- **python-fastapi-async**: FastAPI with async/await, SQLAlchemy, and modern Python patterns
- **node-express-typescript**: Express.js with TypeScript, modern middleware, and best practices

## Template Structure

Each template includes:

1. **`.cursorrules`**: AI assistant configuration specific to the framework
2. **Template metadata**: Description, version, author, and tags
3. **Example files**: Starter code following best practices
4. **Commands**: Common commands for development, building, and testing

### Example `.cursorrules` file

```markdown
# Next.js App Router Development Rules

You are an expert Next.js developer specializing in:
- Next.js 14+ with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- React Server Components

## Code Style
- Use functional components with TypeScript interfaces
- Implement server components by default
- Add 'use client' directive only when necessary
...
```

## Creating Custom Templates

### 1. Create a new template

```bash
cursor-templates create
```

### 2. Edit the template configuration

Templates are stored in `templates/<template-name>/template.json`:

```json
{
  "name": "my-template",
  "description": "My custom template",
  "version": "1.0.0",
  "author": "Your Name",
  "tags": ["custom", "framework"],
  "rules": {
    "context": "You are an expert developer...",
    "style": {
      "language": "TypeScript",
      "framework": "Your Framework",
      "conventions": ["Convention 1", "Convention 2"]
    },
    "restrictions": ["Don't do X", "Avoid Y"],
    "preferences": ["Prefer A", "Use B when possible"]
  },
  "files": [
    {
      "path": ".cursorrules",
      "content": "# Your Cursor rules here..."
    }
  ],
  "commands": {
    "install": "npm install",
    "dev": "npm run dev",
    "build": "npm run build"
  }
}
```

### 3. Validate your template

```bash
cursor-templates validate my-template
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize a new project with a template |
| `list` | List all available templates |
| `search <query>` | Search for templates |
| `create` | Create a new template |
| `validate <template>` | Validate a template |
| `featured` | Show featured templates |
| `import <url>` | Import a template from GitHub |
| `recommend` | Get template recommendations |

## Template Schema

Templates follow a defined schema for consistency:

- **name**: Unique template identifier
- **description**: Brief description of the template
- **version**: Semantic version (x.y.z)
- **rules**: Cursor AI configuration
  - **context**: AI assistant context
  - **style**: Code style preferences
  - **restrictions**: Things to avoid
  - **preferences**: Preferred approaches
- **files**: Files to create when template is applied
- **commands**: Common development commands

## Contributing

1. Fork the repository
2. Create your template in `templates/`
3. Test your template with `cursor-templates validate`
4. Submit a pull request

## Integration with Cursor IDE

After initializing a template:

1. Open the project in Cursor IDE
2. The `.cursorrules` file will automatically configure the AI assistant
3. The AI will follow the specified conventions and best practices

## Advanced Features

### Template Discovery

```bash
# Search by category
cursor-templates search --category frontend

# View featured templates
cursor-templates featured

# Get recommendations
cursor-templates recommend
```

### Import from GitHub

```bash
cursor-templates import https://github.com/user/template-repo
```

## Best Practices

1. **Keep rules focused**: Make `.cursorrules` specific to your framework
2. **Include examples**: Provide example code in your templates
3. **Document commands**: Include all relevant development commands
4. **Use semantic versioning**: Follow semver for template versions
5. **Test thoroughly**: Validate templates before sharing

## Key Features

| Feature | Status | Description |
|---------|--------|-------------|
| Framework Templates | ✅ | 15+ modern framework templates |
| AI Rules Configuration | ✅ | Optimized `.cursorrules` for each template |
| CLI Tool | ✅ | Powerful command-line interface |
| Template Discovery | ✅ | Search and browse templates |
| GitHub Import | ✅ | Import templates from repositories |
| Custom Templates | ✅ | Create your own templates |

## License

MIT

## Support

- Report issues: [GitHub Issues](https://github.com/yourusername/cursor-templates/issues)
- Documentation: [Full Documentation](https://github.com/yourusername/cursor-templates/wiki)

---

Built with ❤️ for the Cursor IDE community