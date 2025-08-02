#!/usr/bin/env node

import { Command } from 'commander'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import { TemplateDiscovery, discoverCommand } from './discover.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const program = new Command()

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

program
  .name('cursor-templates')
  .description('CLI for managing Cursor IDE templates')
  .version('1.0.0')

program
  .command('list')
  .description('List all available templates')
  .action(async () => {
    try {
      const templates = await getTemplates()
      
      console.log(chalk.cyan('\n📦 Available Templates:\n'))
      
      templates.forEach(template => {
        console.log(chalk.bold(`  ${template.name}`) + chalk.gray(` (v${template.version})`))
        console.log(`    ${template.description}`)
        if (template.tags && template.tags.length > 0) {
          console.log(chalk.gray(`    Tags: ${template.tags.join(', ')}`))
        }
        console.log()
      })
    } catch (error) {
      console.error(chalk.red('Error listing templates:'), error.message)
    }
  })

program
  .command('init')
  .description('Initialize a new project with a template')
  .option('-t, --template <name>', 'Template name')
  .option('-p, --path <path>', 'Project path', '.')
  .action(async (options) => {
    try {
      const templates = await getTemplates()
      
      let selectedTemplate
      
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
      
      const spinner = ora('Initializing template...').start()
      
      const projectPath = path.resolve(options.path)
      await fs.ensureDir(projectPath)
      
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
        installedAt: new Date().toISOString()
      }, { spaces: 2 })
      
      spinner.succeed(chalk.green('Template initialized successfully!'))
      
      // Display commands
      if (selectedTemplate.commands) {
        console.log(chalk.cyan('\n📋 Available commands:'))
        Object.entries(selectedTemplate.commands).forEach(([key, value]) => {
          console.log(`  ${chalk.bold(key)}: ${value}`)
        })
      }
      
      // Display next steps
      console.log(chalk.yellow('\n🚀 Next steps:'))
      console.log(`  1. cd ${options.path}`)
      if (selectedTemplate.commands?.install) {
        console.log(`  2. Run: ${selectedTemplate.commands.install}`)
      }
      console.log(`  3. Open in Cursor IDE`)
      
    } catch (error) {
      console.error(chalk.red('Error initializing template:'), error.message)
    }
  })

program
  .command('create')
  .description('Create a new template')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Template name:',
        validate: input => input.length > 0
      },
      {
        type: 'input',
        name: 'description',
        message: 'Template description:',
        validate: input => input.length > 0
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:'
      },
      {
        type: 'input',
        name: 'tags',
        message: 'Tags (comma-separated):'
      }
    ])
    
    const templateDir = path.join(TEMPLATES_DIR, answers.name)
    await fs.ensureDir(templateDir)
    
    const template = {
      name: answers.name,
      description: answers.description,
      version: '1.0.0',
      author: answers.author,
      tags: answers.tags.split(',').map(t => t.trim()).filter(Boolean),
      rules: {
        context: '',
        style: {
          language: '',
          framework: '',
          conventions: []
        },
        restrictions: [],
        preferences: []
      },
      files: [],
      commands: {}
    }
    
    await fs.writeJson(path.join(templateDir, 'template.json'), template, { spaces: 2 })
    
    console.log(chalk.green(`✅ Template created at: ${templateDir}`))
    console.log(chalk.yellow('Edit template.json to customize your template'))
  })

program
  .command('validate')
  .description('Validate a template')
  .argument('<template>', 'Template name or path')
  .action(async (templateName) => {
    try {
      const spinner = ora('Validating template...').start()
      
      let templatePath
      if (await fs.pathExists(templateName)) {
        templatePath = templateName
      } else {
        templatePath = path.join(TEMPLATES_DIR, templateName, 'template.json')
      }
      
      const template = await fs.readJson(templatePath)
      
      // Basic validation
      const required = ['name', 'description', 'version', 'rules']
      const missing = required.filter(field => !template[field])
      
      if (missing.length > 0) {
        spinner.fail(chalk.red(`Missing required fields: ${missing.join(', ')}`))
        process.exit(1)
      }
      
      // Validate version format
      if (!/^\d+\.\d+\.\d+$/.test(template.version)) {
        spinner.fail(chalk.red('Invalid version format. Use semantic versioning (x.y.z)'))
        process.exit(1)
      }
      
      spinner.succeed(chalk.green('Template is valid!'))
      
    } catch (error) {
      console.error(chalk.red('Validation error:'), error.message)
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

// Initialize discovery features
const discovery = new TemplateDiscovery()
await discovery.loadRegistry()
discoverCommand(program)

program.parse()