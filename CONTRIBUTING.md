# Contributing to Cursor Templates 🚀

Thank you for your interest in contributing to Cursor Templates! This project aims to provide the best AI-optimized template system for Cursor IDE. Every contribution helps make development easier for the community.

## 🌟 Ways to Contribute

### 1. **Add New Templates**
- Create templates for new frameworks or languages
- Improve existing template configurations
- Add better `.cursorrules` files for AI optimization

### 2. **Improve Documentation**
- Fix typos or unclear instructions
- Add more examples and use cases
- Translate documentation to other languages

### 3. **Enhance the CLI Tool**
- Add new features or commands
- Fix bugs and improve performance
- Improve error handling and user experience

### 4. **Website & Design**
- Improve the website design and user experience
- Add new interactive features
- Optimize for mobile and accessibility

### 5. **Testing & Quality Assurance**
- Write tests for templates and CLI
- Report bugs and issues
- Test on different operating systems

## 🛠️ Development Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Getting Started
```bash
# 1. Fork and clone the repository
git clone https://github.com/sangampandey/cursor-templates.git
cd cursor-templates

# 2. Install dependencies
npm install

# 3. Test the CLI locally
npm run test
node cli/index.js --help

# 4. Run quality checks
npm run validate
```

## 📝 Template Creation Guide

### Template Structure
```
templates/
├── your-framework/
│   ├── template.json          # Template metadata
│   ├── .cursorrules          # AI optimization rules
│   ├── README.md            # Framework-specific docs
│   └── examples/            # Optional example files
```

### Template Metadata (`template.json`)
```json
{
  "name": "Your Framework",
  "description": "Brief description of what this template provides",
  "version": "1.0.0",
  "category": "frontend|backend|mobile|desktop|fullstack",
  "tags": ["javascript", "react", "modern"],
  "author": "Your Name",
  "license": "MIT",
  "cursorrules": {
    "path": ".cursorrules",
    "description": "AI optimization rules for this framework"
  },
  "commands": {
    "install": "npx create-your-framework@latest .",
    "dev": "npm run dev",
    "build": "npm run build",
    "test": "npm test"
  },
  "files": [
    {
      "path": ".cursorrules",
      "content": "# Your cursorrules content here..."
    }
  ],
  "requirements": {
    "node": ">=16.0.0",
    "npm": ">=7.0.0"
  },
  "documentation": {
    "url": "https://your-framework-docs.com",
    "getting_started": "https://your-framework-docs.com/getting-started"
  }
}
```

### Creating Effective `.cursorrules` Files

The `.cursorrules` file is crucial for AI optimization. Here's a template:

```markdown
# {Framework Name} AI Development Rules

You are an expert {Framework Name} developer. Follow these rules when helping with {Framework Name} projects:

## Code Style & Standards
- Use TypeScript for type safety
- Follow {framework-specific} naming conventions
- Implement proper error handling
- Use modern ES6+ features

## Architecture Patterns
- Follow {framework-specific} best practices
- Use proper component/module structure
- Implement clean separation of concerns
- Follow SOLID principles where applicable

## Performance & Optimization
- Optimize for {framework-specific} performance
- Use proper caching strategies
- Implement lazy loading where appropriate
- Follow bundle size optimization practices

## Testing & Quality
- Write unit tests for all components/functions
- Use {preferred testing framework}
- Implement integration tests where needed
- Follow TDD/BDD practices

## Security & Best Practices
- Sanitize all user inputs
- Implement proper authentication/authorization
- Follow {framework} security guidelines
- Use environment variables for sensitive data

## AI-Specific Instructions
- Always suggest modern, idiomatic {Framework} code
- Provide complete, working examples
- Explain complex concepts with comments
- Suggest relevant libraries and tools
- Help with debugging and optimization
```

## 🔧 CLI Development Guidelines

### Adding New Commands
1. Add the command in `cli/index.js`
2. Follow the existing pattern for error handling
3. Add proper help text and options
4. Update the README with new command usage

### Code Style
- Use ES modules (`import/export`)
- Follow async/await patterns
- Add proper error handling with `handleError()`
- Use chalk for colored output
- Add loading spinners for long operations

### Testing CLI Commands
```bash
# Test specific commands
node cli/index.js list
node cli/index.js search react
node cli/index.js init --template react-ts --name test-project

# Validate all templates
node cli/index.js validate-all
```

## 🎨 Website Development

### Local Development
```bash
# Serve website locally
cd website
python -m http.server 8000
# or
npx serve .
```

### Adding New Features
- Keep mobile-first responsive design
- Use CSS variables for theming
- Add loading states for better UX
- Include fun animations and micro-interactions
- Ensure accessibility (ARIA labels, keyboard navigation)

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Test your changes thoroughly
- [ ] Run `npm run validate` and fix any issues
- [ ] Update documentation if needed
- [ ] Add yourself to contributors in README.md
- [ ] Follow the existing code style

### PR Title Format
```
type(scope): description

Examples:
feat(template): add Svelte TypeScript template
fix(cli): improve error handling for missing templates
docs(readme): update installation instructions
style(website): improve mobile responsiveness
```

### PR Description Template
```markdown
## Changes
Brief description of what this PR does

## Type of Change
- [ ] New template
- [ ] CLI improvement
- [ ] Bug fix
- [ ] Documentation update
- [ ] Website enhancement
- [ ] Test improvement

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Validated with `npm run validate`

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Changes are documented
- [ ] No breaking changes (or clearly documented)
```

## 🎯 Template Quality Standards

### Requirements
- **AI Optimization**: Must include comprehensive `.cursorrules`
- **Modern Practices**: Use latest framework features and best practices
- **Documentation**: Clear setup and usage instructions
- **Testing**: Include test configurations and examples
- **Performance**: Optimized for development and production
- **Security**: Follow security best practices

### Quality Checklist
- [ ] Comprehensive `.cursorrules` file
- [ ] Modern, idiomatic code patterns
- [ ] TypeScript support (where applicable)
- [ ] Proper error handling
- [ ] Development and build scripts
- [ ] Testing setup
- [ ] Documentation and examples
- [ ] Security best practices
- [ ] Performance optimizations

## 🏷️ Issue Guidelines

### Bug Reports
Use the "Bug Report" template and include:
- Operating system and version
- Node.js and npm versions
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs

### Feature Requests
Use the "Feature Request" template and include:
- Clear description of the feature
- Use case and benefits
- Possible implementation approach
- Alternatives considered

### Template Requests
Use the "Template Request" template and include:
- Framework/language name and version
- Why this template would be valuable
- Key features it should include
- Links to official documentation

## 🤝 Community Guidelines

### Code of Conduct
We follow the [Contributor Covenant](https://www.contributor-covenant.org/):
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect different opinions and approaches

### Getting Help
- **Discord**: Join our [Discord community](https://discord.gg/cursor-templates) (if available)
- **GitHub Discussions**: Use GitHub Discussions for questions
- **Issues**: Create issues for bugs and feature requests
- **Email**: Contact maintainers at cursor-templates@example.com

## 🎉 Recognition

### Contributors
All contributors are recognized in:
- README.md contributors section
- Website contributors page
- Release notes for significant contributions

### Maintainers
Current maintainers:
- **@sangampandey** - Project creator and lead maintainer

Interested in becoming a maintainer? Contact us after making several valuable contributions.

## 📚 Additional Resources

### Learning Resources
- [Cursor IDE Documentation](https://docs.cursor.sh/)
- [AI Pair Programming Best Practices](https://docs.cursor.sh/guides/pair-programming)
- [Template Development Guide](./TEMPLATE_GUIDE.md)

### Related Projects
- [Cursor IDE Documentation](https://docs.cursor.sh/) - Official Cursor IDE documentation
- [Cursor IDE](https://cursor.sh/) - The AI-powered IDE this project supports

### Development Tools
- [Node.js](https://nodejs.org/) - Runtime environment
- [Commander.js](https://github.com/tj/commander.js) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI prompts

---

## 🚀 Ready to Contribute?

1. **Choose your contribution type** from the list above
2. **Set up your development environment** following the setup guide
3. **Read the relevant guidelines** for your contribution type
4. **Make your changes** and test them thoroughly
5. **Submit a pull request** following our PR guidelines

Thank you for helping make Cursor Templates better! 🎉

---

*Questions? Feel free to reach out in GitHub Discussions or create an issue. We're here to help!*