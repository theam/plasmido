import {IBrokerOptions} from 'src/interfaces/broker/IBrokerOptions'
import {IBroker} from 'src/interfaces/broker/IBroker'

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
  }
}


