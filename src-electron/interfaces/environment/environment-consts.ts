import {v4} from 'uuid'
import randomWords from 'random-words'

const timeNow = () => {
  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  return (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes() + ':' + (now.getSeconds() < 10 ? '0' : '') + now.getSeconds()
}
const WORDS_PER_STRING = Math.floor(Math.random() * 3) + 1

export const variables = ['$p_index']

export const dynamicVariables = {
  '$p_date': () => new Date().toDateString(),
  '$p_time': () => timeNow(),
  '$p_timestamp': () => Math.floor(Date.now() / 1000).toString(),
  '$p_timestamp_millis': () => Math.floor(Date.now()).toString(),
  '$p_guid': () => v4(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
  '$p_words': () => randomWords({
    exactly: 1, wordsPerString: WORDS_PER_STRING, maxLength: 6, formatter: (word: string, index?: number) => {
      return index === 0 ? word.slice(0, 1).toUpperCase().concat(word.slice(1)) : word
    }
  })
}
