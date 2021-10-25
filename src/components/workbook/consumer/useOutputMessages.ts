import {IConsumedEvent} from 'src/interfaces/IConsumedEvent';
import {IHeaders} from 'kafkajs';
import {IOutputMessageRow} from 'src/interfaces/IOutputMessageRow';

export default function useOutputMessages() {

  const toObject = (event: IConsumedEvent) => {
    const {
      partition: partition,
      topic: topic,
      message: {
        offset: offset,
        timestamp: timestampPayload,
      },
    } = event.eachMessagePayload;

    return {
      partition: partition,
      topic: topic,
      key: '',
      time: timeStampToDate(timestampPayload),
      offset: offset,
      header: headerToString(event.plainHeaders),
      value: event.plainMessage
    } as IOutputMessageRow;
  };

  const sleep = (ms?:number) => new Promise(resolve => setTimeout(resolve, ms || 1000));

  const timeStampToDate = (timestamp: string | number | Date) => {
    const date = new Date(Number(timestamp)).toLocaleDateString('en-US');
    const time = new Date(Number(timestamp)).toLocaleTimeString('en-US');
    return `${date} - ${time}`;
  }

  const headerToString = (headers: IHeaders | undefined) => {
    let result = '[';
    if (headers) {
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          const value = headers[key] as string;
          result += `${key}: ${value} `;
        }
      }
    }
    result = result + ']';
    return result;
  }

  return {
    toObject,
    sleep
  }
}
