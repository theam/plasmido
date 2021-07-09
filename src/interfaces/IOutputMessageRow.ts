export interface IOutputMessageRow {
  topic?: string,
  value: string,
  header: string,
  partition: number,
  key: string,
  time: string,
  offset: string,
}

