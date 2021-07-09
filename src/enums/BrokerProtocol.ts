export enum BrokerProtocol {
    NONE = 'None',
    SASL_PLAIN = 'SASL/PLAIN',
    SASL_SCRAM_256 = 'SASL/SCRAM-SHA-256',
    SASL_SCRAM_512 = 'SASL/SCRAM-SHA-512',
    SASL_AWS_IAM = 'SASL/AWS/IAM',
}
