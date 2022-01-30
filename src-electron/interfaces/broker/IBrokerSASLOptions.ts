import {BrokerProtocol} from 'app/src-electron/enums/BrokerProtocol'

export interface IBrokerSASLOptions {
    protocol: BrokerProtocol,
    username?: string,
    password?: string,
    authorizationIdentity?: string,
    accessKeyId?: string,
    secretAccessKey?: string,
    sessionToken?: string
}
