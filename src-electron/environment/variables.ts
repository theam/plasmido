import {Replaceable} from '../interfaces/environment/Replaceable'
import {dynamicVariables, variables} from '../interfaces/environment/environment-consts'
import * as userCatalog from '../nedb/user-catalog'
import * as environmentCatalog from '../nedb/environment-catalog'

const escapeRegExp = (variable: string) => variable.replace(/[-\/\\^$*+?.()|[\]{}]|\s/g, '\\$&')
const duplicateString = (payload: string) => (' ' + payload).slice(1)

export const defaultUserVariables = async () => {
  const defaultUser = await userCatalog.findDefaultUser()
  const userEnvironment = await environmentCatalog.findOneByUUID(defaultUser.selectedEnvironmentUUID || '')
  if (!userEnvironment.isDefault) {
    return userEnvironment.variables.map(variable => ({
      variable: '$' + variable.name,
      value: variable.value
    } as Replaceable))
  }
  return []
}

/**
 * Example:
 *  payload: Hello {{ one }}. {{ other}}
 *  replace: <'one': 'Gonzalo'>, <'other': 'How are you?'>
 *  return: Hello Gonzalo. How are you
 * @param payload
 * @param replace
 */
export const replaceUserVariables = (payload: string, replace: Array<Replaceable>) => {
  let replaced = duplicateString(payload)
  replace.forEach(item => {
    const replaceBy = escapeRegExp(item.variable.trim())
    const regex = new RegExp('{{\\s*' + replaceBy + '\\s*}}', 'g')
    replaced = replaced.replace(regex, item.value)
  })
  return replaced
}

/**
 * Example:
 *  payload: Hello {{ $p_index }}
 *  replace: <'p_index': 1>
 *  return: Hello 1, 2, 3....
 *  note: p_index should exists
 * @param payload
 * @param replace
 */
export const replaceInternalVariables = (payload: string, replace: Array<Replaceable>) => {
  let replaced = duplicateString(payload)
  replace.forEach(item => {
    if (variables.includes(item.variable)) {
      const replaceBy = escapeRegExp(item.variable.trim())
      const regex = new RegExp('{{\\s*' + replaceBy + '\\s*}}', 'g')
      replaced = replaced.replace(regex, item.value)
    }
  })
  return replaced
}

/**
 * Example:
 *  payload: Hello {{ $p_date }}, {{ $p_time }}
 *  return: Hello 10-20-2021, 23:59:59
 *  note: p_date, p_time should exists
 * @param payload
 */
export const replaceDynamicVariables = (payload: string) => {
  let replaced = duplicateString(payload)
  const methods = Object.keys(dynamicVariables)
  methods.forEach(method => {
    const replaceBy = escapeRegExp(method)
    const regex = new RegExp('{{\\s*' + replaceBy + '\\s*}}', 'g')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    replaced = replaced.replace(regex, dynamicVariables[method]())
  })
  return replaced
}
