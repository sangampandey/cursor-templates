#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class Analytics {
  constructor() {
    this.analyticsPath = path.join(__dirname, '..', 'analytics', 'usage.json')
    this.sessionsPath = path.join(__dirname, '..', 'analytics', 'sessions.json')
  }

  async ensureAnalyticsDir() {
    await fs.ensureDir(path.dirname(this.analyticsPath))
  }

  async getUsageData() {
    try {
      if (await fs.pathExists(this.analyticsPath)) {
        return await fs.readJson(this.analyticsPath)
      }
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not load usage data'))
    }

    return {
      totalCommands: 0,
      templatesCreated: 0,
      popularTemplates: {},
      commandUsage: {},
      errorCounts: {},
      firstUsed: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }
  }

  async trackCommand(command, templateName = null, success = true) {
    try {
      await this.ensureAnalyticsDir()
      const data = await this.getUsageData()

      data.totalCommands++
      data.lastUsed = new Date().toISOString()

      // Track command usage
      if (!data.commandUsage[command]) {
        data.commandUsage[command] = 0
      }
      data.commandUsage[command]++

      // Track template usage
      if (templateName) {
        if (command === 'init') {
          data.templatesCreated++
          if (!data.popularTemplates[templateName]) {
            data.popularTemplates[templateName] = 0
          }
          data.popularTemplates[templateName]++
        }
      }

      // Track errors
      if (!success) {
        if (!data.errorCounts[command]) {
          data.errorCounts[command] = 0
        }
        data.errorCounts[command]++
      }

      await fs.writeJson(this.analyticsPath, data, { spaces: 2 })
    } catch (error) {
      // Silently fail for analytics to not disrupt user experience
      console.debug('Analytics tracking failed:', error.message)
    }
  }

  async trackSession(sessionData) {
    try {
      await this.ensureAnalyticsDir()
      
      let sessions = []
      if (await fs.pathExists(this.sessionsPath)) {
        sessions = await fs.readJson(this.sessionsPath)
      }

      sessions.push({
        ...sessionData,
        timestamp: new Date().toISOString()
      })

      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions = sessions.slice(-100)
      }

      await fs.writeJson(this.sessionsPath, sessions, { spaces: 2 })
    } catch (error) {
      console.debug('Session tracking failed:', error.message)
    }
  }

  async generateReport() {
    try {
      const data = await this.getUsageData()
      
      console.log(chalk.cyan('\n📊 Usage Analytics Report\n'))
      
      console.log(chalk.bold('📈 Overview:'))
      console.log(`  Total commands executed: ${data.totalCommands}`)
      console.log(`  Templates created: ${data.templatesCreated}`)
      console.log(`  First used: ${new Date(data.firstUsed).toLocaleDateString()}`)
      console.log(`  Last used: ${new Date(data.lastUsed).toLocaleDateString()}`)

      console.log(chalk.bold('\n🏆 Most Popular Templates:'))
      const sortedTemplates = Object.entries(data.popularTemplates)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      sortedTemplates.forEach(([template, count], index) => {
        console.log(`  ${index + 1}. ${template}: ${count} times`)
      })

      console.log(chalk.bold('\n⚡ Command Usage:'))
      const sortedCommands = Object.entries(data.commandUsage)
        .sort(([,a], [,b]) => b - a)
      
      sortedCommands.forEach(([command, count]) => {
        console.log(`  ${command}: ${count} times`)
      })

      if (Object.keys(data.errorCounts).length > 0) {
        console.log(chalk.bold('\n❌ Error Counts:'))
        Object.entries(data.errorCounts).forEach(([command, count]) => {
          console.log(`  ${command}: ${count} errors`)
        })
      }

      // Success rate
      const totalSuccess = data.totalCommands - Object.values(data.errorCounts).reduce((a, b) => a + b, 0)
      const successRate = ((totalSuccess / data.totalCommands) * 100).toFixed(1)
      console.log(chalk.bold(`\n✅ Success Rate: ${successRate}%`))

    } catch (error) {
      console.error(chalk.red('Error generating analytics report:'), error.message)
    }
  }

  async clearData() {
    try {
      await fs.remove(this.analyticsPath)
      await fs.remove(this.sessionsPath)
      console.log(chalk.green('✅ Analytics data cleared'))
    } catch (error) {
      console.error(chalk.red('Error clearing analytics data:'), error.message)
    }
  }
}

// CLI usage
const analytics = new Analytics()

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2]
  
  switch (command) {
    case 'report':
      await analytics.generateReport()
      break
    case 'clear':
      await analytics.clearData()
      break
    default:
      console.log(chalk.cyan('Usage:'))
      console.log('  node analytics.js report  - Show usage report')
      console.log('  node analytics.js clear   - Clear analytics data')
  }
}

export { Analytics }