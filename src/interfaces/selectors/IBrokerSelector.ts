import {IBroker} from 'src/interfaces/broker/IBroker';

export interface IBrokerSelector {
  label: string,
  value: string,
  broker: IBroker
}

export const brokerToBrokerSelector = (broker: IBroker | null) => {
  if (broker === null || broker._id === undefined) return null;
  return {
    label: broker?.name,
    value: broker?._id,
    broker: broker
  } as IBrokerSelector
}
