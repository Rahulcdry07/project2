#!/usr/bin/env node

/**
 * Generate TypeScript interfaces from Sequelize models
 * This script creates TypeScript interfaces for frontend use based on backend models
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MODELS_DIR = path.join(__dirname, '../src/models');
const OUTPUT_DIR = path.join(__dirname, '../public/dashboard-app/src/types');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Start the output file content
let outputContent = `/**
 * TypeScript interfaces generated from backend models
 * DO NOT EDIT DIRECTLY - This file is auto-generated
 * Generated on: ${new Date().toISOString()}
 */

`;

// Process each model file
console.log('Generating TypeScript interfaces from models...');

// Make sure the output directory exists
try {
  execSync(`mkdir -p ${OUTPUT_DIR}`);
} catch (error) {
  console.error('Error creating output directory:', error.message);
}

// Read all model files except index.js
const modelFiles = fs.readdirSync(MODELS_DIR)
  .filter(file => file !== 'index.js' && file.endsWith('.js'));

// Process each model
modelFiles.forEach(file => {
  const modelPath = path.join(MODELS_DIR, file);
  const modelName = path.basename(file, '.js');
  
  console.log(`Processing model: ${modelName}`);
  
  // Read the model file
  const modelContent = fs.readFileSync(modelPath, 'utf8');
  
  // Extract attributes using a regex (this is a simplification)
  const attributeMatches = modelContent.match(/sequelize\.define\(['"](\w+)['"],\s*{([^}]*)}/s);
  
  if (!attributeMatches) {
    console.warn(`Could not extract attributes from ${file}, skipping`);
    return;
  }
  
  const definedModelName = attributeMatches[1];
  const attributesBlock = attributeMatches[2];
  
  // Start generating the interface
  outputContent += `export interface I${definedModelName} {\n`;
  
  // Extract individual attributes
  const attributeLines = attributesBlock.split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('//') && line.includes(':'));
  
  // Process each attribute
  attributeLines.forEach(line => {
    // Get attribute name
    const nameMatch = line.match(/(\w+):/);
    if (!nameMatch) return;
    
    const attrName = nameMatch[1];
    
    // Determine TypeScript type based on Sequelize type
    let tsType = 'any';
    
    if (line.includes('STRING') || line.includes('TEXT') || line.includes('ENUM')) {
      tsType = 'string';
    } else if (line.includes('INTEGER') || line.includes('FLOAT') || line.includes('DECIMAL')) {
      tsType = 'number';
    } else if (line.includes('BOOLEAN')) {
      tsType = 'boolean';
    } else if (line.includes('DATE')) {
      tsType = 'Date';
    } else if (line.includes('JSON') || line.includes('JSONB')) {
      tsType = 'Record<string, any>';
    }
    
    // Add nullable indicator if allowNull: true is found
    const isNullable = line.includes('allowNull: true');
    const nullableSuffix = isNullable ? ' | null' : '';
    
    // Add the property to the interface
    outputContent += `  ${attrName}: ${tsType}${nullableSuffix};\n`;
  });
  
  // Add common fields that Sequelize adds
  outputContent += `  id?: number;\n`;
  outputContent += `  createdAt?: Date;\n`;
  outputContent += `  updatedAt?: Date;\n`;
  
  // Close the interface
  outputContent += `}\n\n`;
});

// Write the output file
const outputFile = path.join(OUTPUT_DIR, 'models.ts');
fs.writeFileSync(outputFile, outputContent);

console.log(`TypeScript interfaces written to: ${outputFile}`);