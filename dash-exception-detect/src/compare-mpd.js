'use strict';

import axios from 'axios';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const MPD_URL = 'https://dash.plaza.red/TVD0002/index.mpd';
const INTERVAL_MS = 3000; // 3 seconds
const MAX_SAMPLES = 5; // Get 10 samples

async function fetchAndSaveMpd(index) {
  try {
    const response = await axios.get(MPD_URL);
    const filename = `mpd_sample_${index}.xml`;
    await fs.writeFile(filename, response.data);
    console.log(`[${new Date().toISOString()}] Saved sample ${index} to ${filename}`);
    return filename;
  } catch (error) {
    console.error(`Error fetching MPD (sample ${index}):`, error.message);
    return null;
  }
}

async function compareFiles(file1, file2) {
  try {
    const { stdout } = await execAsync(`diff ${file1} ${file2}`);
    if (stdout) {
      console.log(`\nDifferences between ${file1} and ${file2}:`);
      console.log(stdout);
    } else {
      console.log(`\nNo differences found between ${file1} and ${file2}`);
    }
  } catch (error) {
    // diff returns exit code 1 if files are different, which causes exec to throw
    if (error.stdout) {
      console.log(`\nDifferences between ${file1} and ${file2}:`);
      console.log(error.stdout);
    }
  }
}

async function main() {
  console.log('Starting MPD comparison...');
  console.log(`Will fetch ${MAX_SAMPLES} samples at ${INTERVAL_MS}ms intervals`);
  
  const files = [];
  
  // Fetch samples
  for (let i = 0; i < MAX_SAMPLES; i++) {
    const file = await fetchAndSaveMpd(i);
    if (file) {
      files.push(file);
    }
    if (i < MAX_SAMPLES - 1) {
      await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
    }
  }
  
  // Compare consecutive samples
  console.log('\nComparing consecutive samples...');
  for (let i = 0; i < files.length - 1; i++) {
    await compareFiles(files[i], files[i + 1]);
  }
  
  // Cleanup
  console.log('\nCleaning up files...');
  for (const file of files) {
    try {
      await fs.unlink(file);
      console.log(`Deleted ${file}`);
    } catch (error) {
      console.error(`Error deleting ${file}:`, error.message);
    }
  }
}

main().catch(console.error);
