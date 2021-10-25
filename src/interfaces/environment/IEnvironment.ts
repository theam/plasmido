import {IEnvironmentVariable} from 'src/interfaces/environment/IEnvironmentVariable';

export interface IEnvironment {
  _id: string,
  uuid: string,
  name: string,
  isDefault: boolean,
  variables: Array<IEnvironmentVariable>
}

