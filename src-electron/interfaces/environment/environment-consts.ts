import {v4} from 'uuid';
import randomWords from 'random-words';

const WORDS_PER_STRING = Math.floor(Math.random() * 3) + 1

// todo use an enum
export const variables = ['$p_index'];

export const dynamicVariables = {
  '$p_date': () => new Date().toDateString(),
  '$p_time': () => new Date().getTime().toString(),
  '$p_timestamp': () => Math.floor(Date.now() / 1000).toString(),
  '$p_guid': () => v4(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  '$p_words': () => randomWords({
    exactly: 1, wordsPerString: WORDS_PER_STRING, maxLength: 6, formatter: (word: string, index?: number) => {
      return index === 0 ? word.slice(0, 1).toUpperCase().concat(word.slice(1)) : word;
    }
  })
}
