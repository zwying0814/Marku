#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-publish validation...');

// 检查必要文件是否存在
const requiredFiles = [
    'dist/marku.es.js',
    'dist/marku.umd.js', 
    'dist/marku.d.ts',
    'README.md',
    'LICENSE',
    'package.json'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, '..', file))) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing!`);
        allFilesExist = false;
    }
});

// 检查 package.json 配置
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

console.log('\n📦 Package.json validation:');

const requiredFields = ['name', 'version', 'description', 'main', 'module', 'types', 'author', 'license'];
requiredFields.forEach(field => {
    if (packageJson[field]) {
        console.log(`✅ ${field}: ${packageJson[field]}`);
    } else {
        console.log(`❌ ${field} - Missing!`);
        allFilesExist = false;
    }
});

// 检查文件大小
const distFiles = ['dist/marku.es.js', 'dist/marku.umd.js'];
console.log('\n📊 File sizes:');

distFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📄 ${file}: ${sizeKB} KB`);
    }
});

if (allFilesExist) {
    console.log('\n🎉 All checks passed! Ready to publish.');
    process.exit(0);
} else {
    console.log('\n❌ Some checks failed. Please fix the issues before publishing.');
    process.exit(1);
}