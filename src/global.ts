/* eslint-disable @typescript-eslint/restrict-plus-operands,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return,@typescript-eslint/ban-ts-comment */
import {io} from 'socket.io-client'

const socket = io('http://localhost:55150')

export const getSocket = () => {
  return socket
}

export const syncEmit = (event: string, args?: unknown) => {
  return new Promise((resolve, reject) => {
    if (args) {
      socket.emit(event, args, (error: Error | null, result: unknown) => {
        error == null ? resolve(result) : reject(error)
      })
    } else {
      socket.emit(event, (error: Error | null, result: unknown) => {
        error == null ? resolve(result) : reject(error)
      })
    }
  })
}

// @ts-ignore
export const syntaxHighlight = json => {
  if (typeof json == 'string') {
    json = JSON.stringify(secureParse(json), null, 4)
  } else {
    json = JSON.stringify(json, null, 4)
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') as string
  // @ts-ignore
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
    let cls = 'number'
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'key'
      } else {
        cls = 'string'
      }
    } else if (/true|false/.test(match)) {
      cls = 'boolean'
    } else if (/null/.test(match)) {
      cls = 'null'
    }
    return '<span class="' + cls + '">' + match + '</span>'
  })
}

const secureParse = (value: string) => {
  let result
  try {
    result = JSON.parse(value) as unknown
  } catch (e) {
    return value
  }
  return result
}

export const isJsonString = (value: string) => {
  try {
    const result = JSON.parse(value) as unknown
    return !!(result && typeof result === 'object')
  } catch (e) {
    return false
  }
}
