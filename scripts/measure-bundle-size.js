#!/usr/bin/env node

/**
 * Bundle Size Measurement Script
 * 
 * Measures bundle sizes before and after optimizations
 * Run: node scripts/measure-bundle-size.js
 */

import { readFileSync, statSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileSize = (filePath) => {
  try {
    const stats = statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

const analyzeBundle = () => {
  const distPath = join(__dirname, '..', 'dist');
  const assetsPath = join(distPath, 'assets');

  console.log('\n📦 Bundle Size Analysis\n');
  console.log('=' .repeat(60));

  try {
    // Check if dist folder exists
    const distExists = statSync(distPath);
    
    // Get all JS files
    const jsFiles = [];
    const cssFiles = [];
    let totalJS = 0;
    let totalCSS = 0;

    // Read index.html to find referenced files
    const indexHtmlPath = join(distPath, 'index.html');
    if (statSync(indexHtmlPath)) {
      const indexHtml = readFileSync(indexHtmlPath, 'utf-8');
      
      // Extract JS and CSS file references
      const jsMatches = indexHtml.match(/src="([^"]+\.js)"/g) || [];
      const cssMatches = indexHtml.match(/href="([^"]+\.css)"/g) || [];

      jsMatches.forEach(match => {
        const filePath = match.match(/src="([^"]+)"/)[1];
        const fullPath = join(distPath, filePath.replace(/^\//, ''));
        const size = getFileSize(fullPath);
        if (size > 0) {
          jsFiles.push({ name: filePath, size });
          totalJS += size;
        }
      });

      cssMatches.forEach(match => {
        const filePath = match.match(/href="([^"]+)"/)[1];
        const fullPath = join(distPath, filePath.replace(/^\//, ''));
        const size = getFileSize(fullPath);
        if (size > 0) {
          cssFiles.push({ name: filePath, size });
          totalCSS += size;
        }
      });
    }

    // Also check assets folder directly
    try {
      const assetsFiles = readdirSync(assetsPath);
      assetsFiles.forEach(file => {
        const fullPath = join(assetsPath, file);
        const size = getFileSize(fullPath);
        if (file.endsWith('.js') && size > 0) {
          const existing = jsFiles.find(f => f.name.includes(file));
          if (!existing) {
            jsFiles.push({ name: `assets/${file}`, size });
            totalJS += size;
          }
        } else if (file.endsWith('.css') && size > 0) {
          const existing = cssFiles.find(f => f.name.includes(file));
          if (!existing) {
            cssFiles.push({ name: `assets/${file}`, size });
            totalCSS += size;
          }
        }
      });
    } catch (error) {
      // Assets folder might not exist or be readable
    }

    // Sort by size
    jsFiles.sort((a, b) => b.size - a.size);
    cssFiles.sort((a, b) => b.size - a.size);

    console.log('\n📄 JavaScript Files:\n');
    jsFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${formatBytes(file.size)}`);
    });

    console.log('\n🎨 CSS Files:\n');
    cssFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${formatBytes(file.size)}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Summary:\n');
    console.log(`Total JavaScript: ${formatBytes(totalJS)}`);
    console.log(`Total CSS: ${formatBytes(totalCSS)}`);
    console.log(`Total Bundle: ${formatBytes(totalJS + totalCSS)}`);

    // Find initial bundle (usually the largest JS file)
    const initialBundle = jsFiles[0];
    if (initialBundle) {
      console.log(`\n🚀 Initial Bundle: ${formatBytes(initialBundle.size)}`);
      console.log(`   File: ${initialBundle.name}`);
      
      // Compare with target
      const targetSize = 200 * 1024; // 200KB
      if (initialBundle.size <= targetSize) {
        console.log(`\n✅ SUCCESS: Bundle size is below target (${formatBytes(targetSize)})`);
      } else {
        const reduction = ((initialBundle.size - targetSize) / initialBundle.size * 100).toFixed(1);
        console.log(`\n⚠️  WARNING: Bundle size is ${reduction}% above target`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n💡 Tips:');
    console.log('- Target initial bundle: < 200KB');
    console.log('- Use code splitting for larger bundles');
    console.log('- Check Network tab in DevTools for actual load sizes');
    console.log('- Consider lazy loading for route components\n');

  } catch (error) {
    console.error('\n❌ Error analyzing bundle:', error.message);
    console.log('\n💡 Make sure to run "npm run build" first!\n');
  }
};

analyzeBundle();
