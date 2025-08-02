import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')
const REGISTRY_FILE = path.join(__dirname, '..', 'registry.json')

export class TemplateDiscovery {
  constructor() {
    this.registry = null
  }

  async loadRegistry() {
    if (await fs.pathExists(REGISTRY_FILE)) {
      this.registry = await fs.readJson(REGISTRY_FILE)
    } else {
      this.registry = {
        templates: [],
        categories: {
          frontend: ['react', 'vue', 'angular', 'nextjs', 'svelte'],
          backend: ['express', 'fastapi', 'django', 'rails', 'spring'],
          fullstack: ['nextjs', 't3-stack', 'remix', 'nuxt'],
          mobile: ['react-native', 'flutter', 'ionic'],
          desktop: ['electron', 'tauri'],
          testing: ['jest', 'pytest', 'cypress', 'playwright'],
          devops: ['docker', 'kubernetes', 'terraform', 'ansible']
        },
        featured: [],
        trending: []
      }
      await this.saveRegistry()
    }
  }

  async saveRegistry() {
    await fs.writeJson(REGISTRY_FILE, this.registry, { spaces: 2 })
  }

  async searchTemplates(query, options = {}) {
    const templates = await this.getAllTemplates()
    const searchTerm = query.toLowerCase()
    
    let results = templates.filter(template => {
      const nameMatch = template.name.toLowerCase().includes(searchTerm)
      const descMatch = template.description.toLowerCase().includes(searchTerm)
      const tagMatch = template.tags?.some(tag => 
        tag.toLowerCase().includes(searchTerm)
      )
      
      return nameMatch || descMatch || tagMatch
    })
    
    // Filter by category if specified
    if (options.category) {
      const categoryTags = this.registry.categories[options.category] || []
      results = results.filter(template =>
        template.tags?.some(tag => categoryTags.includes(tag.toLowerCase()))
      )
    }
    
    // Sort by relevance
    results.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase() === searchTerm ? 10 : 0
      const bNameMatch = b.name.toLowerCase() === searchTerm ? 10 : 0
      return bNameMatch - aNameMatch
    })
    
    return results
  }

  async getAllTemplates() {
    const templates = []
    const dirs = await fs.readdir(TEMPLATES_DIR)
    
    for (const dir of dirs) {
      const templatePath = path.join(TEMPLATES_DIR, dir, 'template.json')
      if (await fs.pathExists(templatePath)) {
        try {
          const template = await fs.readJson(templatePath)
          templates.push({
            ...template,
            path: templatePath,
            directory: dir
          })
        } catch (error) {
          console.warn(chalk.yellow(`Warning: Invalid template in ${dir}`))
        }
      }
    }
    
    return templates
  }

  async getCategories() {
    return Object.keys(this.registry.categories)
  }

  async getFeaturedTemplates() {
    const allTemplates = await this.getAllTemplates()
    const featured = this.registry.featured || []
    
    return allTemplates.filter(t => featured.includes(t.name))
  }

  async getTrendingTemplates() {
    const allTemplates = await this.getAllTemplates()
    const trending = this.registry.trending || []
    
    return allTemplates.filter(t => trending.includes(t.name))
  }

  async addToRegistry(template) {
    if (!this.registry.templates.find(t => t.name === template.name)) {
      this.registry.templates.push({
        name: template.name,
        description: template.description,
        version: template.version,
        author: template.author,
        tags: template.tags,
        addedAt: new Date().toISOString()
      })
      await this.saveRegistry()
    }
  }

  async importFromGitHub(repoUrl) {
    const spinner = ora('Fetching template from GitHub...').start()
    
    try {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        throw new Error('Invalid GitHub URL')
      }
      
      const [, owner, repo] = match
      const templateName = repo.replace(/-template$/, '')
      
      // Here you would implement actual GitHub fetching
      // For now, we'll create a placeholder
      const template = {
        name: templateName,
        description: `Template from ${owner}/${repo}`,
        version: '1.0.0',
        author: owner,
        tags: ['external', 'github'],
        source: repoUrl,
        rules: {
          context: 'Imported from GitHub',
          style: {},
          restrictions: [],
          preferences: []
        }
      }
      
      const templateDir = path.join(TEMPLATES_DIR, templateName)
      await fs.ensureDir(templateDir)
      await fs.writeJson(
        path.join(templateDir, 'template.json'),
        template,
        { spaces: 2 }
      )
      
      await this.addToRegistry(template)
      
      spinner.succeed(chalk.green(`Template "${templateName}" imported successfully!`))
      return template
      
    } catch (error) {
      spinner.fail(chalk.red(`Failed to import: ${error.message}`))
      throw error
    }
  }

  async recommendTemplates(context = {}) {
    const templates = await this.getAllTemplates()
    const recommendations = []
    
    // Recommend based on recent usage (would need usage tracking)
    // For now, return featured templates
    const featured = await this.getFeaturedTemplates()
    recommendations.push(...featured)
    
    // Recommend based on tags similarity
    if (context.currentTags) {
      const related = templates.filter(t =>
        t.tags?.some(tag => context.currentTags.includes(tag))
      )
      recommendations.push(...related)
    }
    
    // Remove duplicates
    const unique = Array.from(
      new Map(recommendations.map(t => [t.name, t])).values()
    )
    
    return unique.slice(0, 5)
  }
}

export async function discoverCommand(program) {
  const discovery = new TemplateDiscovery()
  await discovery.loadRegistry()
  
  program
    .command('search <query>')
    .description('Search for templates')
    .option('-c, --category <category>', 'Filter by category')
    .action(async (query, options) => {
      const results = await discovery.searchTemplates(query, options)
      
      if (results.length === 0) {
        console.log(chalk.yellow('No templates found matching your search'))
        return
      }
      
      console.log(chalk.cyan(`\n🔍 Found ${results.length} template(s):\n`))
      
      results.forEach(template => {
        console.log(chalk.bold(`  ${template.name}`))
        console.log(`    ${template.description}`)
        if (template.tags?.length > 0) {
          console.log(chalk.gray(`    Tags: ${template.tags.join(', ')}`))
        }
        console.log()
      })
    })
  
  program
    .command('featured')
    .description('Show featured templates')
    .action(async () => {
      const templates = await discovery.getFeaturedTemplates()
      
      console.log(chalk.cyan('\n⭐ Featured Templates:\n'))
      
      if (templates.length === 0) {
        console.log(chalk.gray('  No featured templates yet'))
        return
      }
      
      templates.forEach(template => {
        console.log(chalk.bold(`  ${template.name}`))
        console.log(`    ${template.description}`)
        console.log()
      })
    })
  
  program
    .command('import <url>')
    .description('Import a template from GitHub')
    .action(async (url) => {
      try {
        await discovery.importFromGitHub(url)
      } catch (error) {
        console.error(chalk.red('Import failed:'), error.message)
      }
    })
  
  program
    .command('recommend')
    .description('Get template recommendations')
    .action(async () => {
      const recommendations = await discovery.recommendTemplates()
      
      console.log(chalk.cyan('\n💡 Recommended Templates:\n'))
      
      if (recommendations.length === 0) {
        console.log(chalk.gray('  No recommendations available'))
        return
      }
      
      recommendations.forEach(template => {
        console.log(chalk.bold(`  ${template.name}`))
        console.log(`    ${template.description}`)
        console.log()
      })
    })
}