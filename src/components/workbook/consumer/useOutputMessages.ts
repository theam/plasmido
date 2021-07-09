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
        key: keyPayload,
        headers: headersPayload,
        value: valuePayload,
      },
    } = event.eachMessagePayload;

    const avroDecodedMessage = event.avroDecodedMessage;

    const time = timeStampToDate(timestampPayload);
    const key = arrayBufferToString(keyPayload);
    const header = headerToString(headersPayload);
    const value = avroDecodedMessage !== '' && avroDecodedMessage !== undefined ? avroDecodedMessage : arrayBufferToString(valuePayload);

    return {
      partition: partition,
      topic: topic,
      key: key,
      time: time,
      offset: offset,
      header: header,
      value: value
    } as IOutputMessageRow;
  };

  const timeStampToDate = (timestamp: string | number | Date) => {
    const date = new Date(Number(timestamp)).toLocaleDateString('en-US'); // todo format
    const time = new Date(Number(timestamp)).toLocaleTimeString('en-US');
    return `${date} - ${time}`;
  }

  const headerToString = (headers: IHeaders | undefined) => {
    let result = '[';
    if (headers) {
      for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
          result += `${key}: ${arrayBufferToString(headers[key])} `;
        }
      }
    }
    result = result + ']';
    return result;
  }

  const arrayBufferToString = (value: any) => {
    if (value === null) {
      return '';
    }

    let result = '';
    try {
      result = new TextDecoder().decode(value);
    } catch (e) {
      result = '<Error reading value/>';
    }
    return result;
  }

  return {
    toObject
  }
}
