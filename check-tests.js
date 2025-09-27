#!/usr/bin/env node

const { spawn } = require('child_process');

const testFiles = [
    'test/models.test.js',
    'test/controllers.test.js',
    'test/fileController.test.js',
    'test/backend.test.js',
    'test/middleware.test.js',
    'test/middlewareEnhanced.test.js',
    'test/profileEnhanced.test.js',
    'test/security.test.js',
    'test/utils.test.js'
];

async function runTest(testFile) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing ${testFile}...`);
        
        const child = spawn('npx', ['mocha', testFile, '--timeout', '10000'], {
            env: { ...process.env, NODE_ENV: 'test' },
            stdio: 'pipe'
        });
        
        let output = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        const timeout = setTimeout(() => {
            child.kill('SIGTERM');
            resolve({ testFile, status: 'TIMEOUT', passing: 0, failing: 0, output: 'Test timed out' });
        }, 30000);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            
            const passingMatch = output.match(/(\d+) passing/);
            const failingMatch = output.match(/(\d+) failing/);
            
            const passing = passingMatch ? parseInt(passingMatch[1]) : 0;
            const failing = failingMatch ? parseInt(failingMatch[1]) : 0;
            
            resolve({
                testFile,
                status: code === 0 ? 'PASS' : 'FAIL',
                passing,
                failing,
                output: output.slice(-500) // Last 500 chars
            });
        });
    });
}

async function main() {
    console.log('🚀 Checking test status across all test files...\n');
    
    const results = [];
    let totalPassing = 0;
    let totalFailing = 0;
    
    for (const testFile of testFiles) {
        const result = await runTest(testFile);
        results.push(result);
        totalPassing += result.passing;
        totalFailing += result.failing;
        
        const emoji = result.status === 'PASS' ? '✅' : result.status === 'TIMEOUT' ? '⏱️' : '❌';
        console.log(`${emoji} ${testFile}: ${result.passing} passing, ${result.failing} failing`);
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Total Passing: ${totalPassing}`);
    console.log(`Total Failing: ${totalFailing}`);
    console.log(`Success Rate: ${((totalPassing / (totalPassing + totalFailing)) * 100).toFixed(1)}%`);
    
    console.log('\n🔍 DETAILED RESULTS:');
    results.forEach(result => {
        if (result.status !== 'PASS') {
            console.log(`\n--- ${result.testFile} (${result.status}) ---`);
            console.log(result.output);
        }
    });
}

main().catch(console.error);