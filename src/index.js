#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');
const fs = require('fs-extra');
const translate = require('google-translate-api');
const path = require('path');
const { input, select, confirm } = require('@inquirer/prompts');

// Define the data directory
const dataDir = path.join(require('os').homedir(), '.aniracetam');
const sentencesFile = path.join(dataDir, 'sentences.json');
const configDir = path.join(dataDir, 'config.json');

// Ensure data directory exists
fs.ensureDirSync(dataDir);

// Display the styled header
function displayHeader() {
  console.log(
    chalk.blue(
      figlet.textSync('aniracetam', {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default'
      })
    )
  );
  console.log(chalk.blue('Terminal Language Learning Program\n'));
}

// Load sentences from file
function loadSentences() {
  try {
    return fs.readJsonSync(sentencesFile);
  } catch (error) {
    return [];
  }
}

// Save sentences to file
function saveSentences(sentences) {
  fs.writeJsonSync(sentencesFile, sentences, { spaces: 2 });
}

// Load configuration
function loadConfig() {
  try {
    return fs.readJsonSync(configDir);
  } catch (error) {
    return {};
  }
}

// Save configuration
function saveConfig(config) {
  fs.writeJsonSync(configDir, config, { spaces: 2 });
}

// Set up language preference
async function setupLanguage() {
  const config = loadConfig();
  
  if (!config.targetLanguage) {
    const language = await input({
      message: 'Enter the language code you want to learn (e.g., es for Spanish, fr for French):',
      validate: (input) => input.length > 0 || 'Please enter a language code'
    });
    
    config.targetLanguage = language;
    saveConfig(config);
    console.log(chalk.green(`\nLanguage set to: ${language}\n`));
  }
  
  return config.targetLanguage;
}

// Add a new sentence
async function addSentence(targetLanguage) {
  const sentence = await input({
    message: 'Enter a sentence in English to translate:',
    validate: (input) => input.length > 0 || 'Please enter a sentence'
  });
  
  try {
    const res = await translate(sentence, { to: targetLanguage });
    
    const sentences = loadSentences();
    const newSentence = {
      id: sentences.length + 1,
      original: sentence,
      translated: res.text,
      language: targetLanguage,
      nextReview: new Date(),
      interval: 1, // days until next review
      ease: 2.5, // ease factor
      repetitions: 0 // number of times reviewed
    };
    
    sentences.push(newSentence);
    saveSentences(sentences);
    
    console.log(chalk.green('\nSentence added successfully!'));
    console.log(chalk.cyan(`English: ${sentence}`));
    console.log(chalk.cyan(`${targetLanguage}: ${res.text}\n`));
  } catch (error) {
    console.log(chalk.red('Translation failed:', error.message));
  }
}

// Review sentences using spaced repetition
async function reviewSentences() {
  const sentences = loadSentences();
  
  if (sentences.length === 0) {
    console.log(chalk.yellow('No sentences to review. Add some sentences first!\n'));
    return;
  }
  
  // Filter sentences that are due for review
  const now = new Date();
  const dueSentences = sentences.filter(sentence => new Date(sentence.nextReview) <= now);
  
  if (dueSentences.length === 0) {
    console.log(chalk.yellow('No sentences are due for review right now.\n'));
    return;
  }
  
  // Sort by next review date (oldest first)
  dueSentences.sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview));
  
  for (const sentence of dueSentences) {
    console.log(chalk.cyan(`\n${sentence.original}`));
    
    const recall = await input({
      message: 'Translate this sentence (press Enter to see answer):'
    });
    
    const quality = await select({
      message: 'How well did you know this?',
      choices: [
        { name: 'Again (0) - Incorrect response', value: 0 },
        { name: 'Hard (1) - Correct response after difficulty', value: 1 },
        { name: 'Good (2) - Correct response after hesitation', value: 2 },
        { name: 'Easy (3) - Perfect response', value: 3 }
      ]
    });
    
    console.log(chalk.cyan(`Correct translation: ${sentence.translated}\n`));
    
    // Update spaced repetition values based on quality response
    updateSpacedRepetition(sentence, quality);
  }
  
  saveSentences(sentences);
  console.log(chalk.green('Review session completed!\n'));
}

// Update spaced repetition algorithm
function updateSpacedRepetition(sentence, quality) {
  // Simplified SM-2 algorithm
  if (quality < 3) {
    sentence.interval = 1;
  } else if (sentence.repetitions === 0) {
    sentence.interval = 1;
  } else if (sentence.repetitions === 1) {
    sentence.interval = 6;
  } else {
    sentence.interval = Math.round(sentence.interval * sentence.ease);
  }
  
  sentence.repetitions++;
  
  // Update ease factor
  sentence.ease = sentence.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (sentence.ease < 1.3) sentence.ease = 1.3;
  
  // Set next review date
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + sentence.interval);
  sentence.nextReview = nextReview;
}

// Main application function
async function main() {
  displayHeader();
  
  const targetLanguage = await setupLanguage();
  
  while (true) {
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: 'Add a new sentence', value: 'add' },
        { name: 'Review sentences', value: 'review' },
        { name: 'Exit', value: 'exit' }
      ]
    });
    
    switch (action) {
      case 'add':
        await addSentence(targetLanguage);
        break;
      case 'review':
        await reviewSentences();
        break;
      case 'exit':
        console.log(chalk.blue('Goodbye!'));
        process.exit(0);
    }
  }
}

// Run the application
main().catch(console.error);