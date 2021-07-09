import tls from 'tls';
import {Kafka, KafkaConfig, SASLOptions} from 'kafkajs';
import {BrokerProtocol} from '../enums/BrokerProtocol';
import {IBrokerSSLOptions} from 'app/src-electron/interfaces/broker/IBrokerSSLOptions';
import {IBrokerSASLOptions} from 'app/src-electron/interfaces/broker/IBrokerSASLOptions';
import {IBrokerKafkaInstance} from 'app/src-electron/interfaces/broker/IBrokerKafkaInstance';

// TODO move it to configuration
export const DEFAULT_REQUEST_TIME_OUT = 25000;
export const DEFAULT_CONNECTION_TIME_OUT = 3000;
export const DEFAULT_MAX_RETRY_TIME = 30000;
export const DEFAULT_RETRY_TIMES = 5;

const PLASMIDO_NODE_KAFKA_INSTANCE = 'PLASMIDO_NODE:kafka_instance';

const brokerStringListToArray = (brokerList:string):Array<string> => {
  return brokerList?.split(',').map(broker => broker.trim());
}

const sslBrokerOptionsToKafkaSSLOptions = (sslBrokerOptions: IBrokerSSLOptions) => {
  let sslKafkaConfig = false as tls.ConnectionOptions | boolean;

  if (sslBrokerOptions && sslBrokerOptions.enabled) {
    sslKafkaConfig = sslBrokerOptions.enabled;
    if (sslBrokerOptions.rejectUnauthorized !== undefined) {
      sslKafkaConfig = {rejectUnauthorized: sslBrokerOptions.rejectUnauthorized};
    }
  }

  return sslKafkaConfig;
};

const saslBrokerOptionsToKafkaSASLOptions = (saslOptions: IBrokerSASLOptions, kafkaInstance: IBrokerKafkaInstance): SASLOptions | undefined => {
  let saslOptionsKafkaConfig: SASLOptions | undefined;

  // TODO probar con el certificado: ca: [fs.readFileSync('./testHelpers/certs/cert-signed', 'utf-8')]
  switch (saslOptions && saslOptions.protocol) {
    case BrokerProtocol.NONE:
      saslOptionsKafkaConfig = undefined;
      break;
    case BrokerProtocol.SASL_PLAIN:
      saslOptionsKafkaConfig = {
        mechanism: 'plain',
        username: saslOptions.username as string,
        password: saslOptions.password as string,

      };
      break;
    case BrokerProtocol.SASL_SCRAM_256:
      saslOptionsKafkaConfig = {
        mechanism: 'scram-sha-256',
        username: saslOptions.username as string,
        password: saslOptions.password as string,
      };
      break;
    case BrokerProtocol.SASL_SCRAM_512:
      saslOptionsKafkaConfig = {
        mechanism: 'scram-sha-512',
        username: saslOptions.username as string,
        password: saslOptions.password as string,
      };
      break;
    case BrokerProtocol.SASL_AWS_IAM:
      saslOptionsKafkaConfig = {
        mechanism: 'aws',
        authorizationIdentity: saslOptions.authorizationIdentity as string,
        accessKeyId: saslOptions.accessKeyId as string,
        secretAccessKey: saslOptions.secretAccessKey as string,
        sessionToken: saslOptions.sessionToken
      }
      break;
    default:
      console.error(PLASMIDO_NODE_KAFKA_INSTANCE, ':saslBrokerOptionsToKafkaSASLOptions:ERROR:Unexpected protocol', kafkaInstance);
      throw new Error('Unexpected protocol');
  }

  return saslOptionsKafkaConfig;
};

const brokerKafkaInstanceToKafkaConfig = (brokerKafkaInstance: IBrokerKafkaInstance) => {
  const brokers = brokerStringListToArray(brokerKafkaInstance.brokerList)
  const sslKafkaConfig = sslBrokerOptionsToKafkaSSLOptions(brokerKafkaInstance.options.ssl);
  const saslKafkaConfig = saslBrokerOptionsToKafkaSASLOptions(brokerKafkaInstance.options.sasl, brokerKafkaInstance);

  return {
    clientId: 'PLASMIDO',
    brokers: brokers,
    ssl: sslKafkaConfig,
    sasl: saslKafkaConfig,
    retry: {
      maxRetryTime: brokerKafkaInstance.maxRetryTime ?? DEFAULT_MAX_RETRY_TIME,
      retries: brokerKafkaInstance.retryTimes ?? DEFAULT_RETRY_TIMES
    },
    requestTimeout: DEFAULT_REQUEST_TIME_OUT,
    connectionTimeout: DEFAULT_CONNECTION_TIME_OUT
  } as KafkaConfig;
}

export const getInstance = (brokerKafkaInstance: IBrokerKafkaInstance) => {
  return new Kafka(brokerKafkaInstanceToKafkaConfig(brokerKafkaInstance));
};

export const discoverBroker = () => {
  throw new Error('DiscoverBroker');
};
