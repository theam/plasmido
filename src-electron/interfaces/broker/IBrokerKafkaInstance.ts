import {IBrokerOptions} from '../../interfaces/broker/IBrokerOptions'

export interface IBrokerKafkaInstance {
  brokerList: string,
  options: IBrokerOptions,
  maxRetryTime?: number,
  retryTimes?: number
}
