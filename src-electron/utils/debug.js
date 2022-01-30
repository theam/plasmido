if (process.env.NODE_ENV === 'production' || typeof process.env.DEBUG === 'undefined') {
  global.DEBUG = false
} else {
    global.DEBUG = process.env.DEBUG
}

export const debugEnabled = () => {
  return global.DEBUG === 'PLASMIDO'
}
