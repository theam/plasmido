
export interface IUser {
  _id?: string,
  uuid: string,
  name: string,
  isDefault: boolean,
  selectedEnvironmentUUID?: string,
  createdAt?: string,
  updatedAt?: string
}
