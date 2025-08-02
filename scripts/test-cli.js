#!/usr/bin/env node

import { exec } from 'child_process'
import { promisify } from 'util'
import chalk from 'chalk'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)

const CLI_PATH = path.join(__dirname, '..', 'cli', 'index.js')

async function runCommand(command, description) {
  console.log(chalk.blue(`Testing: ${description}`))
  console.log(chalk.gray(`Command: ${command}`))
  
  try {
    const { stdout, stderr } = await execAsync(command)
    
    if (stderr && !stderr.includes('Warning')) {
      console.log(chalk.red('  ❌ Failed'))
      console.log(chalk.red(`  Error: ${stderr}`))
      return false
    }
    
    console.log(chalk.green('  ✅ Passed'))
    if (stdout.length < 200) {
      console.log(chalk.gray(`  Output: ${stdout.substring(0, 100)}...`))
    }
    return true
  } catch (error) {
    console.log(chalk.red('  ❌ Failed'))
    console.log(chalk.red(`  Error: ${error.message}`))
    return false
  }
}

async function testCLI() {
  console.log(chalk.cyan('🧪 Testing CLI functionality...\n'))
  
  const tests = [
    {
      command: `node ${CLI_PATH} --help`,
      description: 'Help command'
    },
    {
      command: `node ${CLI_PATH} --version`,
      description: 'Version command'
    },
    {
      command: `node ${CLI_PATH} list`,
      description: 'List templates'
    },
    {
      command: `node ${CLI_PATH} list --json | head -5`,
      description: 'List templates as JSON'
    },
    {
      command: `node ${CLI_PATH} categories`,
      description: 'List categories'
    },
    {
      command: `node ${CLI_PATH} search react`,
      description: 'Search templates'
    },
    {
      command: `node ${CLI_PATH} list --category frontend`,
      description: 'Filter by category'
    },
    {
      command: `node ${CLI_PATH} list --tag typescript`,
      description: 'Filter by tag'
    }
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    const result = await runCommand(test.command, test.description)
    if (result) {
      passed++
    } else {
      failed++
    }
    console.log()
  }
  
  // Summary
  console.log(chalk.cyan('📊 CLI Test Summary:'))
  console.log(chalk.green(`  Passed: ${passed}`))
  console.log(chalk.red(`  Failed: ${failed}`))
  console.log(`  Total: ${passed + failed}`)
  
  if (failed > 0) {
    console.log(chalk.red('\n❌ Some CLI tests failed'))
    process.exit(1)
  } else {
    console.log(chalk.green('\n✅ All CLI tests passed'))
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testCLI()
}

export { testCLI }