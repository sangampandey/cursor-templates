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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

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

program.parse()