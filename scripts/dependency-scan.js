#!/usr/bin/env node

/**
 * Dependency scanning utility
 * This script runs npm audit and reports vulnerabilities in a structured format
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const REPORT_PATH = path.join(__dirname, 'audit-report.json');
const SUMMARY_PATH = path.join(__dirname, 'audit-summary.md');
const HIGH_SEVERITY_THRESHOLD = 'high'; // Fail on high or critical vulnerabilities

// Run npm audit
console.log('Running npm audit to check for vulnerabilities...');

try {
  // Run npm audit in JSON format
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
  
  // Parse the JSON output
  const auditResult = JSON.parse(auditOutput);
  
  // Save the full report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(auditResult, null, 2));
  
  // Count vulnerabilities by severity
  const vulnerabilityCounts = {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
    info: 0
  };
  
  // Count the vulnerabilities
  if (auditResult.vulnerabilities) {
    Object.values(auditResult.vulnerabilities).forEach(vuln => {
      if (vuln.severity) {
        vulnerabilityCounts[vuln.severity]++;
      }
    });
  }
  
  // Generate a summary
  const totalVulnerabilities = 
    vulnerabilityCounts.critical +
    vulnerabilityCounts.high + 
    vulnerabilityCounts.moderate + 
    vulnerabilityCounts.low +
    vulnerabilityCounts.info;
  
  const summary = `# Dependency Security Scan Results

Scan Date: ${new Date().toISOString()}

## Summary

- Total vulnerabilities found: ${totalVulnerabilities}
- Critical: ${vulnerabilityCounts.critical}
- High: ${vulnerabilityCounts.high}
- Moderate: ${vulnerabilityCounts.moderate}
- Low: ${vulnerabilityCounts.low}
- Info: ${vulnerabilityCounts.info}

${totalVulnerabilities > 0 ? '## Recommended Actions\n\nRun `npm audit fix` to attempt to automatically fix vulnerabilities. For more detailed information, review the full report in `audit-report.json`.' : '## No Vulnerabilities Found\n\nGreat job! Your dependencies are secure.'}
`;

  // Save the summary
  fs.writeFileSync(SUMMARY_PATH, summary);
  
  console.log(summary);
  
  // Check if we should fail the build
  if (vulnerabilityCounts.critical > 0 || vulnerabilityCounts.high > 0) {
    if (HIGH_SEVERITY_THRESHOLD === 'high') {
      console.error('FAILURE: High or critical severity vulnerabilities detected.');
      process.exit(1);
    }
  }
  
  console.log('Dependency check complete. See audit-report.json for details.');
  
} catch (error) {
  console.error('Error running dependency scan:', error.message);
  process.exit(1);
}