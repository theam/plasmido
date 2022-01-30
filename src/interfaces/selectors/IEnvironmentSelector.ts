import {IEnvironment} from 'src/interfaces/environment/IEnvironment'

export interface IEnvironmentSelector {
  label: string,
  value: string,
  environment: IEnvironment
}

export const environmentToEnvironmentSelector = (environment: IEnvironment) => {
  if (environment === undefined || environment.uuid === '') return null
  return {
    label: environment.name,
    value: environment.uuid,
    environment: environment
  } as IEnvironmentSelector
}


