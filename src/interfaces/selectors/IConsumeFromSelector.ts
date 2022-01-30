import {ConsumeFromType, ConsumeFromTypeDescription} from 'src/enums/ConsumeFromType'

export interface IConsumeFromSelector {
  label: string,
  value: ConsumeFromType,
}

export const consumeFromToConsumeFromSelector = (consumeFrom: string) => {
  return {
    label: ConsumeFromTypeDescription[consumeFrom as keyof typeof ConsumeFromTypeDescription],
    value: consumeFrom
  } as IConsumeFromSelector
}
