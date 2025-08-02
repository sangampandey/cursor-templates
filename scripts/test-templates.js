#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

async function validateTemplate(templatePath, templateName) {
  const errors = []
  const warnings = []
  
  try {
    const template = await fs.readJson(templatePath)
    
    // Required fields validation
    const required = ['name', 'description', 'version', 'rules']
    for (const field of required) {
      if (!template[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }
    
    // Version format validation
    if (template.version && !/^\d+\.\d+\.\d+$/.test(template.version)) {
      errors.push('Invalid version format. Use semantic versioning (x.y.z)')
    }
    
    // Rules validation
    if (template.rules) {
      if (!template.rules.context) {
        warnings.push('Missing rules.context')
      }
      if (!template.rules.style) {
        warnings.push('Missing rules.style')
      }
      if (!template.rules.restrictions) {
        warnings.push('Missing rules.restrictions')
      }
      if (!template.rules.preferences) {
        warnings.push('Missing rules.preferences')
      }
    }
    
    // Tags validation
    if (!template.tags || template.tags.length === 0) {
      warnings.push('No tags specified')
    }
    
    // Files validation
    if (template.files) {
      for (const file of template.files) {
        if (!file.path || !file.content) {
          errors.push(`Invalid file entry: ${JSON.stringify(file)}`)
        }
        
        // Check for .cursorrules file
        if (file.path === '.cursorrules' && file.content.length < 100) {
          warnings.push('.cursorrules file seems too short')
        }
      }
    } else {
      warnings.push('No files specified')
    }
    
    // Commands validation
    if (template.commands) {
      if (!template.commands.install) {
        warnings.push('No install command specified')
      }
      if (!template.commands.dev) {
        warnings.push('No dev command specified')
      }
    } else {
      warnings.push('No commands specified')
    }
    
    return { errors, warnings, template }
  } catch (error) {
    return { 
      errors: [`Failed to parse template: ${error.message}`], 
      warnings: [],
      template: null 
    }
  }
}

async function testAllTemplates() {
  console.log(chalk.cyan('🧪 Testing all templates...\n'))
  
  let totalTemplates = 0
  let validTemplates = 0
  let templatesWithWarnings = 0
  const allResults = []
  
  try {
    const templateDirs = await fs.readdir(TEMPLATES_DIR)
    
    for (const dir of templateDirs) {
      const templatePath = path.join(TEMPLATES_DIR, dir, 'template.json')
      
      if (await fs.pathExists(templatePath)) {
        totalTemplates++
        console.log(chalk.bold(`Testing: ${dir}`))
        
        const result = await validateTemplate(templatePath, dir)
        allResults.push({ name: dir, ...result })
        
        if (result.errors.length === 0) {
          if (result.warnings.length === 0) {
            console.log(chalk.green('  ✅ Valid'))
            validTemplates++
          } else {
            console.log(chalk.yellow(`  ⚠️  Valid with warnings (${result.warnings.length})`))
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`     • ${warning}`))
            })
            templatesWithWarnings++
          }
        } else {
          console.log(chalk.red(`  ❌ Invalid (${result.errors.length} errors)`))
          result.errors.forEach(error => {
            console.log(chalk.red(`     • ${error}`))
          })
          if (result.warnings.length > 0) {
            result.warnings.forEach(warning => {
              console.log(chalk.yellow(`     • ${warning}`))
            })
          }
        }
        console.log()
      }
    }
    
    // Summary
    console.log(chalk.cyan('📊 Test Summary:'))
    console.log(`  Total templates: ${totalTemplates}`)
    console.log(chalk.green(`  Valid: ${validTemplates}`))
    console.log(chalk.yellow(`  Valid with warnings: ${templatesWithWarnings}`))
    console.log(chalk.red(`  Invalid: ${totalTemplates - validTemplates - templatesWithWarnings}`))
    
    // Generate report
    const reportPath = path.join(__dirname, '..', 'template-test-report.json')
    await fs.writeJson(reportPath, {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTemplates,
        valid: validTemplates,
        warnings: templatesWithWarnings,
        invalid: totalTemplates - validTemplates - templatesWithWarnings
      },
      results: allResults
    }, { spaces: 2 })
    
    console.log(chalk.gray(`\nDetailed report saved to: ${reportPath}`))
    
    // Exit with error code if any templates are invalid
    if (totalTemplates - validTemplates - templatesWithWarnings > 0) {
      process.exit(1)
    }
    
  } catch (error) {
    console.error(chalk.red('Error testing templates:'), error.message)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testAllTemplates()
}

export { validateTemplate, testAllTemplates }