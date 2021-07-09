import {BrokerProtocol} from 'app/src/enums/BrokerProtocol';

export default interface IClusterTreeItem {
  to: string,
  name: string,
  url: string,
  protocol: BrokerProtocol
}
