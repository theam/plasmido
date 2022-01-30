import {BrokerProtocol} from 'app/src/enums/BrokerProtocol'

export interface IBrokerOptions {
    ssl: {
        enabled: boolean,
        rejectUnauthorized?: boolean
    },
    sasl: {
        protocol: BrokerProtocol,
        username?: string,
        password?: string,
        authorizationIdentity?: string,
        accessKeyId?: string,
        secretAccessKey?: string,
        sessionToken?: string
    }
}
