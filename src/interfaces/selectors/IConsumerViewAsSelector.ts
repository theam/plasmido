import {ConsumerViewType, ConsumerViewTypeDescription} from 'src/enums/ConsumerViewType'

export interface IConsumerViewAsSelector {
  label: string,
  value: ConsumerViewType,
}

export const consumerViewToConsumerViewAsSelector = (consumerView: string) => {
  return {
    label: ConsumerViewTypeDescription[consumerView as keyof typeof ConsumerViewTypeDescription],
    value: consumerView
  } as IConsumerViewAsSelector
}
