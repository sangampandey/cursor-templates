#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import semver from 'semver'
import { Analytics } from '../scripts/analytics.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)
const analytics = new Analytics()

const program = new Command()
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('Unhandled Rejection at:'), promise, chalk.red('reason:'), reason)
  analytics.trackCommand('error', null, false)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error(chalk.red('Uncaught Exception:'), error)
  analytics.trackCommand('error', null, false)
  process.exit(1)
})

// Enhanced error handling wrapper
function handleError(error, command, context = {}) {
  const errorId = Date.now().toString(36)
  const errorDetails = {
    id: errorId,
    command,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  }
  
  if (program.opts().debug) {
    console.error(chalk.red('\n🐛 Debug Information:'))
    console.error(chalk.gray(`Error ID: ${errorId}`))
    console.error(chalk.gray(`Command: ${command}`))
    console.error(chalk.gray(`Context: ${JSON.stringify(context, null, 2)}`))
    console.error(chalk.red(`Stack: ${error.stack}`))
  } else {
    console.error(chalk.red(`\n❌ ${error.message}`))
    console.error(chalk.gray(`Error ID: ${errorId} (use --debug for more details)`))
  }
  
  analytics.trackCommand(command, context.template, false)
  
  // Save error details for debugging
  saveErrorLog(errorDetails)
}

async function saveErrorLog(errorDetails) {
  try {
    const errorLogPath = path.join(__dirname, '..', 'logs', 'errors.json')
    await fs.ensureDir(path.dirname(errorLogPath))
    
    let errors = []
    if (await fs.pathExists(errorLogPath)) {
      errors = await fs.readJson(errorLogPath)
    }
    
    errors.push(errorDetails)
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors = errors.slice(-50)
    }
    
    await fs.writeJson(errorLogPath, errors, { spaces: 2 })
  } catch (logError) {
    // Silently fail to not disrupt error handling
    console.debug('Failed to save error log:', logError.message)
  }
}

program
  .name('cursor-templates')
  .description('CLI for managing Cursor IDE templates')
  .version('1.0.0')
  .option('--debug', 'Enable debug mode')
  .option('--verbose', 'Enable verbose output')
  .option('--no-analytics', 'Disable analytics tracking')

program
  .command('list')
  .description('List all available templates')
  .option('-c, --category <category>', 'Filter by category (frontend, backend, mobile, desktop, fullstack)')
  .option('-t, --tag <tag>', 'Filter by tag')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    try {
      let templates = await getTemplates()
      
      // Apply category filter
      if (options.category) {
        templates = filterByCategory(templates, options.category)
      }
      
      // Apply tag filter
      if (options.tag) {
        templates = templates.filter(t => 
          t.tags && t.tags.some(tag => 
            tag.toLowerCase().includes(options.tag.toLowerCase())
          )
        )
      }
      
      if (options.json) {
        console.log(JSON.stringify(templates, null, 2))
        return
      }
      
      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found matching the criteria'))
        return
      }
      
      const categoryTitle = options.category ? ` (${options.category})` : ''
      console.log(chalk.cyan(`\n📦 Available Templates${categoryTitle}:\n`))
      
      // Group by category for better display
      const grouped = groupTemplatesByCategory(templates)
      
      for (const [category, categoryTemplates] of Object.entries(grouped)) {
        if (Object.keys(grouped).length > 1) {
          console.log(chalk.bold.blue(`\n${category.toUpperCase()}:`))
        }
        
        categoryTemplates.forEach(template => {
          console.log(chalk.bold(`  ${template.name}`) + chalk.gray(` (v${template.version})`))
          console.log(`    ${template.description}`)
          if (template.tags && template.tags.length > 0) {
            console.log(chalk.gray(`    Tags: ${template.tags.join(', ')}`))
          }
          console.log()
        })
      }
      
      console.log(chalk.gray(`Total: ${templates.length} template(s)`))
    } catch (error) {
      console.error(chalk.red('Error listing templates:'), error.message)
    }
  })

program
  .command('categories')
  .description('List all available categories')
  .action(async () => {
    try {
      const templates = await getTemplates()
      const categories = getCategories(templates)
      
      console.log(chalk.cyan('\n📂 Template Categories:\n'))
      
      for (const [category, count] of Object.entries(categories)) {
        console.log(`  ${chalk.bold(category)}: ${count} template(s)`)
      }
    } catch (error) {
      console.error(chalk.red('Error listing categories:'), error.message)
    }
  })

program
  .command('search <query>')
  .description('Search for templates')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (query, options) => {
    try {
      let templates = await getTemplates()
      const ratings = await getRatings()
      
      // Apply category filter first
      if (options.category) {
        templates = filterByCategory(templates, options.category)
      }
      
      // Search in name, description, and tags
      const searchTerm = query.toLowerCase()
      const results = templates.filter(template => {
        const nameMatch = template.name.toLowerCase().includes(searchTerm)
        const descMatch = template.description.toLowerCase().includes(searchTerm)
        const tagMatch = template.tags?.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        )
        return nameMatch || descMatch || tagMatch
      })
      
      if (results.length === 0) {
        console.log(chalk.yellow(`No templates found for "${query}"`))
        return
      }
      
      console.log(chalk.cyan(`\n🔍 Search results for "${query}":\n`))
      
      results.forEach(template => {
        const rating = ratings.templates[template.name]
        const ratingText = rating ? chalk.yellow(`★${rating.rating} (${rating.votes})`) : ''
        
        console.log(chalk.bold(`  ${template.name}`) + chalk.gray(` (v${template.version})`) + ` ${ratingText}`)
        console.log(`    ${template.description}`)
        if (template.tags?.length > 0) {
          console.log(chalk.gray(`    Tags: ${template.tags.join(', ')}`))
        }
        console.log()
      })
      
      console.log(chalk.gray(`Found: ${results.length} template(s)`))
    } catch (error) {
      console.error(chalk.red('Error searching templates:'), error.message)
    }
  })

program
  .command('featured')
  .description('Show featured templates')
  .action(async () => {
    try {
      const templates = await getTemplates()
      const ratings = await getRatings()
      
      console.log(chalk.cyan('\n⭐ Featured Templates:\n'))
      
      for (const templateName of ratings.featured) {
        const template = templates.find(t => t.name === templateName)
        if (template) {
          const rating = ratings.templates[templateName]
          const ratingText = rating ? chalk.yellow(`★${rating.rating} (${rating.votes})`) : ''
          
          console.log(chalk.bold(`  ${template.name}`) + chalk.gray(` (v${template.version})`) + ` ${ratingText}`)
          console.log(`    ${template.description}`)
          console.log()
        }
      }
    } catch (error) {
      console.error(chalk.red('Error loading featured templates:'), error.message)
    }
  })

program
  .command('trending')
  .description('Show trending templates')
  .action(async () => {
    try {
      const templates = await getTemplates()
      const ratings = await getRatings()
      
      console.log(chalk.cyan('\n🔥 Trending Templates:\n'))
      
      for (const templateName of ratings.trending) {
        const template = templates.find(t => t.name === templateName)
        if (template) {
          const rating = ratings.templates[templateName]
          const ratingText = rating ? chalk.yellow(`★${rating.rating} (${rating.votes})`) : ''
          
          console.log(chalk.bold(`  ${template.name}`) + chalk.gray(` (v${template.version})`) + ` ${ratingText}`)
          console.log(`    ${template.description}`)
          console.log()
        }
      }
    } catch (error) {
      console.error(chalk.red('Error loading trending templates:'), error.message)
    }
  })

program
  .command('rate <template> <rating>')
  .description('Rate a template (1-5 stars)')
  .option('-c, --comment <comment>', 'Add a comment')
  .action(async (templateName, rating, options) => {
    try {
      const ratingNum = parseInt(rating)
      if (ratingNum < 1 || ratingNum > 5) {
        console.log(chalk.red('Rating must be between 1 and 5'))
        return
      }
      
      const templates = await getTemplates()
      const template = templates.find(t => t.name === templateName)
      if (!template) {
        console.log(chalk.red(`Template "${templateName}" not found`))
        return
      }
      
      await addRating(templateName, ratingNum, options.comment)
      console.log(chalk.green(`✅ Rated ${templateName} with ${ratingNum} star(s)`))
      
    } catch (error) {
      console.error(chalk.red('Error rating template:'), error.message)
    }
  })

program
  .command('update')
  .description('Update project template files')
  .option('--check', 'Check for available updates without applying them')
  .option('--force', 'Force update even if versions match')
  .action(async (options) => {
    try {
      await analytics.trackCommand('update')
      
      const metadataPath = path.resolve('.cursor-template.json')
      
      if (!await fs.pathExists(metadataPath)) {
        console.log(chalk.yellow('No template metadata found. This doesn\'t appear to be a template-based project.'))
        return
      }
      
      const metadata = await fs.readJson(metadataPath)
      const templates = await getTemplates()
      const currentTemplate = templates.find(t => t.name === metadata.template)
      
      if (!currentTemplate) {
        console.log(chalk.red(`Template "${metadata.template}" no longer exists`))
        return
      }
      
      const hasUpdate = isNewer(currentTemplate.version, metadata.version)
      
      if (options.check) {
        if (hasUpdate) {
          console.log(chalk.cyan(`📦 Update available for ${metadata.template}`))
          console.log(`  Current: ${metadata.version}`)
          console.log(`  Latest: ${currentTemplate.version}`)
        } else {
          console.log(chalk.green(`✅ ${metadata.template} is up to date (${metadata.version})`))
        }
        return
      }
      
      if (!hasUpdate && !options.force) {
        console.log(chalk.green(`✅ Template is already up to date (${metadata.version})`))
        return
      }
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Update ${metadata.template} from ${metadata.version} to ${currentTemplate.version}?`,
          default: true
        }
      ])
      
      if (!confirm) {
        console.log(chalk.yellow('Update cancelled'))
        return
      }
      
      const spinner = ora('Updating template files...').start()
      
      try {
        // Update template files
        if (currentTemplate.files) {
          for (const file of currentTemplate.files) {
            const filePath = path.resolve(file.path)
            
            // Backup existing file if it exists
            if (await fs.pathExists(filePath)) {
              const backupPath = `${filePath}.backup.${Date.now()}`
              await fs.copy(filePath, backupPath)
              console.log(chalk.gray(`  Backed up ${file.path} to ${path.basename(backupPath)}`))
            }
            
            await fs.ensureDir(path.dirname(filePath))
            await fs.writeFile(filePath, file.content)
          }
        }
        
        // Update metadata
        metadata.version = currentTemplate.version
        metadata.updatedAt = new Date().toISOString()
        await fs.writeJson(metadataPath, metadata, { spaces: 2 })
        
        spinner.succeed(chalk.green('Template updated successfully!'))
        
        console.log(chalk.cyan('\n📋 What was updated:'))
        if (currentTemplate.files) {
          currentTemplate.files.forEach(file => {
            console.log(`  ${chalk.bold(file.path)}`)
          })
        }
        
        await analytics.trackCommand('update', metadata.template, true)
        
      } catch (error) {
        spinner.fail(chalk.red('Update failed'))
        throw error
      }
      
    } catch (error) {
      handleError(error, 'update', { template: metadata?.template })
    }
  })

program
  .command('debug')
  .description('Debug and diagnostic commands')
  .option('--errors', 'Show recent error logs')
  .option('--analytics', 'Show usage analytics')
  .option('--clear-logs', 'Clear error logs')
  .option('--system-info', 'Show system information')
  .action(async (options) => {
    try {
      if (options.errors) {
        const errorLogPath = path.join(__dirname, '..', 'logs', 'errors.json')
        if (await fs.pathExists(errorLogPath)) {
          const errors = await fs.readJson(errorLogPath)
          console.log(chalk.cyan(`\n🐛 Recent Errors (${errors.length}):\n`))
          
          errors.slice(-10).forEach((error, index) => {
            console.log(`${index + 1}. ${chalk.red(error.message)}`)
            console.log(`   Command: ${error.command}`)
            console.log(`   Time: ${new Date(error.timestamp).toLocaleString()}`)
            console.log(`   ID: ${error.id}`)
            console.log()
          })
        } else {
          console.log(chalk.green('✅ No error logs found'))
        }
      }
      
      if (options.analytics) {
        await analytics.generateReport()
      }
      
      if (options.clearLogs) {
        const errorLogPath = path.join(__dirname, '..', 'logs', 'errors.json')
        await fs.remove(errorLogPath)
        console.log(chalk.green('✅ Error logs cleared'))
      }
      
      if (options.systemInfo) {
        console.log(chalk.cyan('\n💻 System Information:\n'))
        console.log(`Node.js: ${process.version}`)
        console.log(`Platform: ${process.platform}`)
        console.log(`Architecture: ${process.arch}`)
        console.log(`Working Directory: ${process.cwd()}`)
        console.log(`Templates Directory: ${TEMPLATES_DIR}`)
        console.log(`Script Path: ${__filename}`)
      }
      
      if (!options.errors && !options.analytics && !options.clearLogs && !options.systemInfo) {
        console.log(chalk.cyan('Debug options:'))
        console.log('  --errors       Show recent error logs')
        console.log('  --analytics    Show usage analytics')
        console.log('  --clear-logs   Clear error logs')
        console.log('  --system-info  Show system information')
      }
      
    } catch (error) {
      handleError(error, 'debug')
    }
  })

program
  .command('quality')
  .description('Analyze template quality and generate metrics')
  .option('--template <name>', 'Analyze specific template')
  .option('--report', 'Show quality report')
  .action(async (options) => {
    try {
      const { QualityMetrics } = await import('../scripts/quality-metrics.js')
      const metrics = new QualityMetrics()
      
      if (options.template) {
        const templatePath = path.join(TEMPLATES_DIR, options.template, 'template.json')
        if (await fs.pathExists(templatePath)) {
          const result = await metrics.analyzeTemplate(templatePath, options.template)
          
          console.log(chalk.cyan(`\n🎯 Quality Analysis: ${result.name}\n`))
          console.log(`Score: ${result.score}/100 (${result.grade})`)
          
          if (result.issues.length > 0) {
            console.log(chalk.red('\n❌ Issues:'))
            result.issues.forEach((issue, index) => {
              console.log(`  ${index + 1}. ${issue}`)
            })
          }
          
          if (result.recommendations.length > 0) {
            console.log(chalk.yellow('\n💡 Recommendations:'))
            result.recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`)
            })
          }
          
          console.log(chalk.cyan('\n📊 Detailed Analysis:'))
          Object.entries(result.analysis).forEach(([category, analysis]) => {
            console.log(`  ${category}: ${analysis.score}/${analysis.maxScore}`)
          })
          
        } else {
          console.log(chalk.red(`Template "${options.template}" not found`))
        }
      } else if (options.report) {
        const metricsPath = path.join(__dirname, '..', 'quality-metrics.json')
        if (await fs.pathExists(metricsPath)) {
          const data = await fs.readJson(metricsPath)
          console.log(chalk.cyan('\n📊 Quality Report Summary:\n'))
          console.log(`Templates analyzed: ${data.summary.analyzed}`)
          console.log(`Average score: ${data.summary.averageScore}/100`)
          console.log(`Last updated: ${new Date(data.timestamp).toLocaleString()}`)
        } else {
          console.log(chalk.yellow('No quality metrics found. Run without options to generate them.'))
        }
      } else {
        await metrics.analyzeAllTemplates()
      }
      
      await analytics.trackCommand('quality', options.template, true)
      
    } catch (error) {
      handleError(error, 'quality', { template: options.template })
    }
  })

program
  .command('validate-all')
  .description('Validate all templates')
  .action(async () => {
    try {
      const { testAllTemplates } = await import('../scripts/test-templates.js')
      await testAllTemplates()
    } catch (error) {
      handleError(error, 'validate-all')
      process.exit(1)
    }
  })

program
  .command('init')
  .description('Initialize a new project with a template')
  .option('-t, --template <name>', 'Template name')
  .option('-n, --name <name>', 'Project name')
  .action(async (options) => {
    try {
      const templates = await getTemplates()
      
      let selectedTemplate
      let projectName
      
      // Get template selection
      if (options.template) {
        selectedTemplate = templates.find(t => t.name === options.template)
        if (!selectedTemplate) {
          console.error(chalk.red(`Template "${options.template}" not found`))
          process.exit(1)
        }
      } else {
        const { template } = await inquirer.prompt([
          {
            type: 'list',
            name: 'template',
            message: 'Select a template:',
            choices: templates.map(t => ({
              name: `${t.name} - ${t.description}`,
              value: t
            }))
          }
        ])
        selectedTemplate = template
      }
      
      // Get project name
      if (options.name) {
        projectName = options.name
      } else {
        const { name } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'Project name:',
            default: 'my-project',
            validate: (input) => {
              if (!input.trim()) return 'Project name is required'
              if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
                return 'Project name can only contain letters, numbers, dots, underscores, and hyphens'
              }
              return true
            }
          }
        ])
        projectName = name
      }
      
      const projectPath = path.resolve(projectName)
      
      // Check if directory already exists
      if (await fs.pathExists(projectPath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory "${projectName}" already exists. Continue anyway?`,
            default: false
          }
        ])
        
        if (!overwrite) {
          console.log(chalk.yellow('Operation cancelled'))
          return
        }
      }
      
      console.log(chalk.cyan(`\n🚀 Creating ${selectedTemplate.name} project: ${projectName}\n`))
      
      // Step 1: Create the framework project
      const spinner = ora('Creating project with framework CLI...').start()
      
      try {
        if (selectedTemplate.commands?.install) {
          // Replace . with projectName in the install command
          const installCommand = selectedTemplate.commands.install.replace(/\s\.\s/, ` ${projectName} `)
          
          spinner.text = `Running: ${installCommand}`
          
          // Execute the framework's create command
          await execAsync(installCommand, { stdio: 'pipe' })
          spinner.succeed(chalk.green('Framework project created successfully!'))
        } else {
          // Fallback: just create directory
          await fs.ensureDir(projectPath)
          spinner.succeed(chalk.green('Project directory created!'))
        }
      } catch (error) {
        spinner.fail(chalk.red('Failed to create framework project'))
        console.error(chalk.red('Error:'), error.message)
        console.log(chalk.yellow(`\nYou can manually run: ${selectedTemplate.commands?.install || 'create project manually'}`))
      }
      
      // Step 2: Add template files
      const templateSpinner = ora('Adding Cursor template files...').start()
      
      try {
        // Copy template files
        if (selectedTemplate.files) {
          for (const file of selectedTemplate.files) {
            const filePath = path.join(projectPath, file.path)
            await fs.ensureDir(path.dirname(filePath))
            await fs.writeFile(filePath, file.content)
          }
        }
        
        // Write template metadata
        const metadataPath = path.join(projectPath, '.cursor-template.json')
        await fs.writeJson(metadataPath, {
          template: selectedTemplate.name,
          version: selectedTemplate.version,
          installedAt: new Date().toISOString(),
          projectName: projectName
        }, { spaces: 2 })
        
        templateSpinner.succeed(chalk.green('Template files added successfully!'))
      } catch (error) {
        templateSpinner.fail(chalk.red('Failed to add template files'))
        console.error(chalk.red('Error:'), error.message)
      }
      
      // Display next steps
      console.log(chalk.cyan('\n📋 Available commands:'))
      if (selectedTemplate.commands) {
        Object.entries(selectedTemplate.commands).forEach(([key, value]) => {
          if (key !== 'install') { // Skip install since we already ran it
            console.log(`  ${chalk.bold(key)}: ${value}`)
          }
        })
      }
      
      console.log(chalk.yellow('\n🚀 Next steps:'))
      console.log(`  1. cd ${projectName}`)
      console.log(`  2. Open in Cursor IDE`)
      if (selectedTemplate.commands?.dev) {
        console.log(`  3. Run: ${selectedTemplate.commands.dev}`)
      }
      console.log(chalk.green(`\n✨ Your ${selectedTemplate.name} project is ready!`))
      
    } catch (error) {
      console.error(chalk.red('Error initializing project:'), error.message)
    }
  })

async function getTemplates() {
  const templateDirs = await fs.readdir(TEMPLATES_DIR)
  const templates = []
  
  for (const dir of templateDirs) {
    const templatePath = path.join(TEMPLATES_DIR, dir, 'template.json')
    if (await fs.pathExists(templatePath)) {
      try {
        const template = await fs.readJson(templatePath)
        templates.push(template)
      } catch (error) {
        console.warn(chalk.yellow(`Warning: Could not load template from ${dir}`))
      }
    }
  }
  
  return templates
}

function filterByCategory(templates, category) {
  const categoryMap = {
    frontend: ['react', 'vue', 'angular', 'svelte'],
    backend: ['express', 'fastapi', 'django', 'node', 'python'],
    mobile: ['react-native', 'flutter', 'mobile', 'ios', 'android'],
    desktop: ['electron', 'tauri', 'desktop'],
    fullstack: ['nextjs', 't3', 'remix', 'nuxt', 'fullstack', 'ssr']
  }
  
  const categoryTags = categoryMap[category.toLowerCase()] || []
  
  return templates.filter(template =>
    template.tags?.some(tag => 
      categoryTags.some(categoryTag => 
        tag.toLowerCase().includes(categoryTag)
      )
    )
  )
}

function groupTemplatesByCategory(templates) {
  const groups = {
    'Frontend': [],
    'Backend': [],
    'Mobile': [],
    'Desktop': [],
    'Full-Stack': [],
    'Other': []
  }
  
  templates.forEach(template => {
    const tags = template.tags || []
    let categorized = false
    
    if (tags.some(tag => ['react', 'vue', 'angular', 'svelte'].includes(tag.toLowerCase()))) {
      groups['Frontend'].push(template)
      categorized = true
    }
    if (tags.some(tag => ['express', 'fastapi', 'django', 'node', 'python', 'backend', 'api'].includes(tag.toLowerCase()))) {
      groups['Backend'].push(template)
      categorized = true
    }
    if (tags.some(tag => ['react-native', 'flutter', 'mobile', 'ios', 'android'].includes(tag.toLowerCase()))) {
      groups['Mobile'].push(template)
      categorized = true
    }
    if (tags.some(tag => ['electron', 'tauri', 'desktop'].includes(tag.toLowerCase()))) {
      groups['Desktop'].push(template)
      categorized = true
    }
    if (tags.some(tag => ['nextjs', 't3', 'remix', 'nuxt', 'fullstack', 'ssr'].includes(tag.toLowerCase()))) {
      groups['Full-Stack'].push(template)
      categorized = true
    }
    
    if (!categorized) {
      groups['Other'].push(template)
    }
  })
  
  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, templates]) => templates.length > 0)
  )
}

function getCategories(templates) {
  const categories = {}
  const grouped = groupTemplatesByCategory(templates)
  
  for (const [category, categoryTemplates] of Object.entries(grouped)) {
    categories[category] = categoryTemplates.length
  }
  
  return categories
}

async function getRatings() {
  try {
    const ratingsPath = path.join(__dirname, '..', 'community', 'ratings.json')
    if (await fs.pathExists(ratingsPath)) {
      return await fs.readJson(ratingsPath)
    }
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not load ratings'))
  }
  
  return {
    templates: {},
    featured: [],
    trending: []
  }
}

async function addRating(templateName, rating, comment) {
  try {
    const ratingsPath = path.join(__dirname, '..', 'community', 'ratings.json')
    await fs.ensureDir(path.dirname(ratingsPath))
    
    let ratings = await getRatings()
    
    if (!ratings.templates[templateName]) {
      ratings.templates[templateName] = {
        rating: 0,
        votes: 0,
        reviews: []
      }
    }
    
    const template = ratings.templates[templateName]
    
    // Simple rating calculation (could be more sophisticated)
    const newTotal = (template.rating * template.votes) + rating
    template.votes += 1
    template.rating = Math.round((newTotal / template.votes) * 10) / 10
    
    if (comment) {
      template.reviews.push({
        user: 'anonymous', // In real app, would use actual user
        rating,
        comment,
        date: new Date().toISOString()
      })
    }
    
    await fs.writeJson(ratingsPath, ratings, { spaces: 2 })
  } catch (error) {
    throw new Error(`Failed to add rating: ${error.message}`)
  }
}

function isNewer(newVersion, currentVersion) {
  try {
    return semver.gt(newVersion, currentVersion)
  } catch (error) {
    // Fallback to simple string comparison if semver fails
    return newVersion !== currentVersion
  }
}

program.parse()