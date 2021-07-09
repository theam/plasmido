import {IBrokerOptions} from 'src/interfaces/broker/IBrokerOptions';
import {IBroker} from 'src/interfaces/broker/IBroker';
import {ISchemaRegistry} from 'src/interfaces/schemaRegistry/ISchemaRegistry';

// todo rename
export const buildConnectionOptions = (broker:IBroker):IBrokerOptions => {
  return {
    ssl: {
      enabled: broker.ssl_enabled,
      rejectUnauthorized: broker.rejectUnauthorized
    },
    sasl: {
      protocol: broker.protocol,
      username: broker.username,
      password: broker.password,
      authorizationIdentity: broker.authorizationIdentity,
      accessKeyId: broker.accessKeyId,
      secretAccessKey: broker.secretAccessKey,
      sessionToken: broker.sessionToken,
    }
  };
}

export const buildSchemaConnectionOptions = (schemaRegistry: ISchemaRegistry) => {
  return {};
}

