export interface IRequestOptions {
  pagination: {
    sortBy: string,
    descending: boolean,
    page: number,
    rowsPerPage: number,
    rowsNumber: number
  },
  filter: string
}
