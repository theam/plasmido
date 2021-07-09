import {PartitionMetadata} from 'kafkajs';

export interface IDataTopic {
  name: string
  partitions?: PartitionMetadata[],
  offsets?: unknown
}
