/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-unsafe-call */
import Nedb from 'nedb'
import path from 'path'
// @ts-ignore
import { remote } from 'electron'

const DATABASE_FOLDER = '/db/'

export const getDatabasePath = (fileName: string) => {
  const filePath = DATABASE_FOLDER + fileName
  if (process.env.DEV) {
    return '.' + filePath
  }
  const userData = remote.app.getPath('userData')
  return path.join(userData, filePath)
}

export const asyncFindFirstBy = (db: Nedb, query: any, sort: any) => {
  return new Promise((resolve, reject) => {
    db.find(query).sort(sort).limit(1).exec((error, result) => {
      if (error == null) {
        resolve(result.pop())
      } else {
        reject(error)
      }
    })
  })
}

export const asyncInsert = (db: Nedb, row: unknown) => {
  // @ts-ignore
  if (row.hasOwnProperty('_id')) {
    // @ts-ignore
    row._id = undefined
  }
  return new Promise((resolve, reject) => {
    db.insert(row, (error, result) => {
      error == null ? resolve(result) : reject(error)
    })
  })
}

export const asyncUpdate = (db: Nedb, query: any, updateQuery: any) => {
  return new Promise((resolve, reject) => {
    db.update(query, updateQuery, {returnUpdatedDocs: true},
      (error, affected, result) => {
        error == null ? resolve(result) : reject(error)
      })
  })
}

export const asyncFindOne = (db: Nedb, query: any) => {
  return new Promise((resolve, reject) => {
    db.findOne(query, (error, result) => {
      error == null ? resolve(result) : reject(error)
    })
  })
}

export const asyncFindAllBy = (db: Nedb, query: any, sort: any) => {
  return new Promise((resolve, reject) => {
    db.find(query).sort(sort).exec((error, result) => {
      error == null ? resolve(result) : reject(error)
    })
  })
}

export const asyncFindAllByPaginate = (db: Nedb, query: any, sort: any, skip: number, limit: number) => {
  return new Promise((resolve, reject) => {
    db.find(query).sort(sort).skip(skip).limit(limit).exec((error, result) => {
      error == null ? resolve(result) : reject(error)
    })
  })
}

export const asyncCountBy = (db: Nedb, query: any) => {
  return new Promise((resolve, reject) => {
    db.count(query).exec((error, result) => {
      error == null ? resolve(result) : reject(error)
    })
  })
}


export const asyncRemove = (db: Nedb, query: any) => new Promise((resolve, reject) => {
  db.remove(query, {multi: true}, (error, result) => {
    error == null ? resolve(result) : reject(error)
  })
})

export const compact = (db: Nedb) => {
  db.persistence.compactDatafile()
}


