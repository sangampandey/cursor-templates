#!/usr/bin/env node

import fs from 'fs-extra'
import path from 'path'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const execAsync = promisify(exec)
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates')

class QualityMetrics {
  constructor() {
    this.metricsPath = path.join(__dirname, '..', 'quality-metrics.json')
  }

  async analyzeTemplate(templatePath, templateName) {
    const metrics = {
      name: templateName,
      score: 0,
      issues: [],
      recommendations: [],
      analysis: {}
    }

    try {
      const template = await fs.readJson(templatePath)
      
      // 1. Completeness Score (30 points)
      metrics.analysis.completeness = this.analyzeCompleteness(template)
      metrics.score += metrics.analysis.completeness.score

      // 2. Documentation Quality (25 points)  
      metrics.analysis.documentation = this.analyzeDocumentation(template)
      metrics.score += metrics.analysis.documentation.score

      // 3. Best Practices (25 points)
      metrics.analysis.bestPractices = this.analyzeBestPractices(template)
      metrics.score += metrics.analysis.bestPractices.score

      // 4. Usability (20 points)
      metrics.analysis.usability = this.analyzeUsability(template)
      metrics.score += metrics.analysis.usability.score

      // Collect all issues and recommendations
      Object.values(metrics.analysis).forEach(analysis => {
        if (analysis.issues) metrics.issues.push(...analysis.issues)
        if (analysis.recommendations) metrics.recommendations.push(...analysis.recommendations)
      })

      // Calculate grade
      metrics.grade = this.calculateGrade(metrics.score)
      metrics.timestamp = new Date().toISOString()

      return metrics

    } catch (error) {
      return {
        name: templateName,
        score: 0,
        grade: 'F',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  analyzeCompleteness(template) {
    const analysis = { score: 0, maxScore: 30, issues: [], recommendations: [] }
    
    // Required fields (15 points)
    const requiredFields = ['name', 'description', 'version', 'rules', 'files']
    const missingFields = requiredFields.filter(field => !template[field])
    
    if (missingFields.length === 0) {
      analysis.score += 15
    } else {
      analysis.score += Math.max(0, 15 - (missingFields.length * 3))
      analysis.issues.push(`Missing required fields: ${missingFields.join(', ')}`)
    }

    // Files completeness (10 points)
    if (template.files && template.files.length > 0) {
      const hasCursorRules = template.files.some(f => f.path === '.cursorrules')
      if (hasCursorRules) {
        analysis.score += 10
      } else {
        analysis.score += 5
        analysis.issues.push('Missing .cursorrules file')
      }
    } else {
      analysis.issues.push('No template files defined')
    }

    // Commands completeness (5 points)
    if (template.commands) {
      const hasInstall = template.commands.install
      const hasDev = template.commands.dev
      
      if (hasInstall && hasDev) {
        analysis.score += 5
      } else if (hasInstall || hasDev) {
        analysis.score += 3
      }
      
      if (!hasInstall) analysis.recommendations.push('Add install command')
      if (!hasDev) analysis.recommendations.push('Add dev command')
    } else {
      analysis.issues.push('No commands defined')
    }

    return analysis
  }

  analyzeDocumentation(template) {
    const analysis = { score: 0, maxScore: 25, issues: [], recommendations: [] }

    // Description quality (10 points)
    if (template.description) {
      if (template.description.length > 50) {
        analysis.score += 10
      } else if (template.description.length > 20) {
        analysis.score += 7
      } else {
        analysis.score += 4
        analysis.recommendations.push('Expand template description')
      }
    } else {
      analysis.issues.push('Missing description')
    }

    // .cursorrules quality (15 points)
    const cursorRulesFile = template.files?.find(f => f.path === '.cursorrules')
    if (cursorRulesFile) {
      const content = cursorRulesFile.content
      if (content.length > 500) {
        analysis.score += 15
      } else if (content.length > 200) {
        analysis.score += 10
        analysis.recommendations.push('Expand .cursorrules with more guidance')
      } else {
        analysis.score += 5
        analysis.issues.push('.cursorrules content is too brief')
      }

      // Check for key sections
      const hasContext = content.includes('context') || content.includes('You are')
      const hasExamples = content.includes('```') || content.includes('Example')
      const hasBestPractices = content.includes('Best Practices') || content.includes('## ')

      if (!hasContext) analysis.recommendations.push('Add context section to .cursorrules')
      if (!hasExamples) analysis.recommendations.push('Add code examples to .cursorrules')
      if (!hasBestPractices) analysis.recommendations.push('Add best practices section to .cursorrules')
    }

    return analysis
  }

  analyzeBestPractices(template) {
    const analysis = { score: 0, maxScore: 25, issues: [], recommendations: [] }

    // Versioning (5 points)
    if (template.version && /^\d+\.\d+\.\d+$/.test(template.version)) {
      analysis.score += 5
    } else {
      analysis.issues.push('Invalid or missing semantic version')
    }

    // Tags (5 points)
    if (template.tags && template.tags.length > 0) {
      analysis.score += 5
      if (template.tags.length < 3) {
        analysis.recommendations.push('Add more descriptive tags')
      }
    } else {
      analysis.issues.push('No tags specified')
    }

    // Rules structure (15 points)
    if (template.rules) {
      let rulesScore = 0
      
      if (template.rules.context) rulesScore += 4
      else analysis.issues.push('Missing rules context')
      
      if (template.rules.style) rulesScore += 4
      else analysis.issues.push('Missing rules style')
      
      if (template.rules.restrictions && template.rules.restrictions.length > 0) rulesScore += 3
      else analysis.recommendations.push('Add restrictions to rules')
      
      if (template.rules.preferences && template.rules.preferences.length > 0) rulesScore += 4
      else analysis.recommendations.push('Add preferences to rules')
      
      analysis.score += rulesScore
    } else {
      analysis.issues.push('Missing rules object')
    }

    return analysis
  }

  analyzeUsability(template) {
    const analysis = { score: 0, maxScore: 20, issues: [], recommendations: [] }

    // Name quality (5 points)
    if (template.name) {
      if (template.name.match(/^[a-z0-9-]+$/)) {
        analysis.score += 5
      } else {
        analysis.score += 3
        analysis.recommendations.push('Use kebab-case for template name')
      }
    }

    // Author information (5 points)
    if (template.author) {
      analysis.score += 5
    } else {
      analysis.recommendations.push('Add author information')
    }

    // Framework alignment (10 points)
    if (template.tags && template.rules) {
      const frameworks = ['react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt', 'flutter', 'django', 'express']
      const hasFramework = frameworks.some(fw => 
        template.tags.some(tag => tag.toLowerCase().includes(fw)) ||
        template.name.toLowerCase().includes(fw)
      )
      
      if (hasFramework) {
        analysis.score += 10
      } else {
        analysis.score += 5
        analysis.recommendations.push('Specify target framework in tags')
      }
    }

    return analysis
  }

  calculateGrade(score) {
    if (score >= 90) return 'A+'
    if (score >= 85) return 'A'
    if (score >= 80) return 'A-'
    if (score >= 75) return 'B+'
    if (score >= 70) return 'B'
    if (score >= 65) return 'B-'
    if (score >= 60) return 'C+'
    if (score >= 55) return 'C'
    if (score >= 50) return 'C-'
    if (score >= 40) return 'D'
    return 'F'
  }

  async analyzeAllTemplates() {
    console.log(chalk.cyan('🎯 Analyzing template quality...\n'))

    const results = []
    const templateDirs = await fs.readdir(TEMPLATES_DIR)

    for (const dir of templateDirs) {
      const templatePath = path.join(TEMPLATES_DIR, dir, 'template.json')
      
      if (await fs.pathExists(templatePath)) {
        console.log(chalk.gray(`Analyzing: ${dir}`))
        const metrics = await this.analyzeTemplate(templatePath, dir)
        results.push(metrics)
        
        const gradeColor = this.getGradeColor(metrics.grade)
        console.log(`  Score: ${metrics.score}/100 (${gradeColor(metrics.grade)})`)
        
        if (metrics.issues.length > 0) {
          console.log(chalk.red(`  Issues: ${metrics.issues.length}`))
        }
        if (metrics.recommendations.length > 0) {
          console.log(chalk.yellow(`  Recommendations: ${metrics.recommendations.length}`))
        }
        console.log()
      }
    }

    // Save results
    await fs.writeJson(this.metricsPath, {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(results),
      templates: results
    }, { spaces: 2 })

    this.displaySummary(results)
    console.log(chalk.gray(`\nDetailed metrics saved to: ${this.metricsPath}`))

    return results
  }

  generateSummary(results) {
    const validResults = results.filter(r => !r.error)
    
    return {
      total: results.length,
      analyzed: validResults.length,
      averageScore: validResults.length > 0 ? 
        Math.round(validResults.reduce((sum, r) => sum + r.score, 0) / validResults.length) : 0,
      gradeDistribution: this.getGradeDistribution(validResults),
      topIssues: this.getTopIssues(validResults),
      topRecommendations: this.getTopRecommendations(validResults)
    }
  }

  getGradeDistribution(results) {
    const distribution = {}
    results.forEach(r => {
      distribution[r.grade] = (distribution[r.grade] || 0) + 1
    })
    return distribution
  }

  getTopIssues(results) {
    const issueCount = {}
    results.forEach(r => {
      r.issues?.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1
      })
    })
    
    return Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }))
  }

  getTopRecommendations(results) {
    const recCount = {}
    results.forEach(r => {
      r.recommendations?.forEach(rec => {
        recCount[rec] = (recCount[rec] || 0) + 1
      })
    })
    
    return Object.entries(recCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([recommendation, count]) => ({ recommendation, count }))
  }

  displaySummary(results) {
    const summary = this.generateSummary(results)
    
    console.log(chalk.cyan('📊 Quality Summary:'))
    console.log(`  Templates analyzed: ${summary.analyzed}/${summary.total}`)
    console.log(`  Average score: ${summary.averageScore}/100`)
    
    console.log(chalk.cyan('\n🎓 Grade Distribution:'))
    Object.entries(summary.gradeDistribution)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([grade, count]) => {
        const color = this.getGradeColor(grade)
        console.log(`  ${color(grade)}: ${count}`)
      })

    if (summary.topIssues.length > 0) {
      console.log(chalk.cyan('\n⚠️  Top Issues:'))
      summary.topIssues.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.issue} (${item.count} templates)`)
      })
    }

    if (summary.topRecommendations.length > 0) {
      console.log(chalk.cyan('\n💡 Top Recommendations:'))
      summary.topRecommendations.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.recommendation} (${item.count} templates)`)
      })
    }
  }

  getGradeColor(grade) {
    if (grade.startsWith('A')) return chalk.green
    if (grade.startsWith('B')) return chalk.blue
    if (grade.startsWith('C')) return chalk.yellow
    if (grade.startsWith('D')) return chalk.orange
    return chalk.red
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const metrics = new QualityMetrics()
  await metrics.analyzeAllTemplates()
}

export { QualityMetrics }