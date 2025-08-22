# aniracetam

A terminal-based language learning program with spaced repetition, similar to Anki flashcards but fully offline after initial setup.

## Features

- Terminal-based interface
- Automatic translation using Google Translate API
- Spaced repetition algorithm for efficient learning
- Fully offline functionality after initial setup
- Simple and intuitive command-line interface

## Installation

```bash
npm install -g aniracetam
```

## Usage

After installation, simply run:

```bash
aniracetam
```

On first run, you'll be prompted to enter the language code you want to learn (e.g., `es` for Spanish, `fr` for French).

### Adding Sentences

1. Select "Add a new sentence" from the main menu
2. Enter a sentence in English
3. The program will automatically translate it to your target language
4. The sentence pair is saved locally for review

### Reviewing Sentences

1. Select "Review sentences" from the main menu
2. Sentences due for review will be shown one by one
3. Try to translate the sentence from English to your target language
4. Rate how well you knew the sentence:
   - Again (0) - Incorrect response
   - Hard (1) - Correct response after difficulty
   - Good (2) - Correct response after hesitation
   - Easy (3) - Perfect response
5. The program uses spaced repetition to determine when to show each sentence again

## Data Storage

All data is stored in `~/.aniracetam/`:
- `sentences.json` - Contains all your sentence pairs and review data
- `config.json` - Contains your language preference

## License

ISC