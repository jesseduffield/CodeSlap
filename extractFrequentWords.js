const glob = require('glob-promise');
const fs = require('fs');

const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const minimumFrequency = 10;
const minimumLength = 7;

const extractFrequentWords = async globStr => {
  const wordFrequencies = {};

  const filenames = await glob(globStr, {});

  const wordsInFiles = await Promise.all(
    filenames.map(async filename => {
      const fileContent = await readFileAsync(filename, 'utf8');

      return fileContent.match(/\w+/g) || [];
    })
  );

  const validWord = word => {
    if (word.length < minimumLength) {
      return false;
    }

    if (/^\d+$/.test(word)) {
      // ignoring numbers
      return false;
    }

    if (word.startsWith('_')) {
      return false;
    }

    return true;
  };

  wordsInFiles.forEach(wordArray => {
    wordArray.forEach(word => {
      if (!validWord(word)) {
        return false;
      }
      if (word in wordFrequencies) {
        wordFrequencies[word]++;
      } else {
        wordFrequencies[word] = 1;
      }
    });
  });

  const wordsOrderedByFrequency = Object.entries(wordFrequencies)
    .filter(([key, value]) => value > minimumFrequency)
    .sort(([key1, value1], [key2, value2]) => {
      if (value1 !== value2) {
        return value1 < value2;
      }
      return key1.length > key2.length;
    })
    .map(([key, _]) => key);

  await writeFileAsync('./words.json', JSON.stringify(wordsOrderedByFrequency));

  return wordsOrderedByFrequency;
};

module.exports = extractFrequentWords;
