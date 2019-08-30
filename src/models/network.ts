
import { SysWrapper } from '../utils/sysWrapper';
import { Organization } from './organization';
import { Channel } from './channel';
import { User } from './user';
import { Peer } from './peer';

const HL_VERSION = '1.4.0';
const HL_EXT_VERSION = '0.4.14';

export class NetworkOptions {
  hyperledgerVersion?: string;
  externalHyperledgerVersion?: string;
  channels?: number = 1;
  organizations?: number = 1;
  users?: number = 1;
  inside?: boolean = false;
  networkConfigPath?: string;
};

export class Network {

  organizations: Organization[];
  channels: Channel[];

  constructor(public path: string, public options: NetworkOptions) {
    this.options.hyperledgerVersion = HL_VERSION;
    this.options.externalHyperledgerVersion = HL_EXT_VERSION;
  }
  
  async init() {
    if (this.options.networkConfigPath) {
      await this.buildNetworkFromFile(this.options.networkConfigPath)
      return;
    }
    this.buildNetwork(this.options.organizations, this.options.channels, this.options.users);
  }

  buildNetwork(organizations: number, channels: number, users: number) {
    const { orgs, chs } = buildNetworkConfig({ organizations, channels, users });
    this.organizations = orgs;
    this.channels = chs;
  }

  buildFromSave(organizations: Organization[] = [], channels: Channel[] = [], users: User[]) {
    this.organizations = organizations;
    this.channels = channels;
  }

  async buildNetworkFromFile(networkConfigPath: string) {
    const networkConfig = await SysWrapper.getJSON(networkConfigPath);
    this.initChannels(networkConfig);
    this.initOrgs(networkConfig);
  }

  initChannels(config: any) {
    this.channels = config.channels.map(channelName => new Channel(channelName));
  }

  initOrgs(config: any) {
    if (!config.topology) {
      throw new Error('Config must have a topology field');
    }
    const orgs = config.topology;
    const keys = Object.keys(orgs);
    this.organizations = keys.map((key, i) => {
      const org = orgs[key];
      const channels = org.channels
        .filter(ch => this.channels.find(availableChannels => availableChannels.name === ch))
        .map(ch => this.channels.find(availableChannels => availableChannels.name === ch));

      const users = org.users ?
        org.users.map(username => new User(username))
        : [];

      const peers = org.peers || org.peers && org.peers > 0 ?
        [...Array(org.peers).keys()].map(j => new Peer(`peer${j}`, {
          number: j,
          ports: [`7${i}5${j*3+1}`, `7${i}5${j*3+2}`, `7${i}5${j*3+3}`],
          couchDbPort: `5${i}8${j+4}`
        }))
        : [ new Peer(`peer0`, {
          number: 0,
          ports: [`7${i}51`, `7${i}52`, `7${i}53`],
          couchDbPort: `5${i}84`
        })];

      const model = new Organization(key, {channels, peers, users});
      return model;
    });
  }
}

let buildNetworkConfig = function (params: {
  organizations: number;
  channels: number;
  users: number;
}) {
  let chs = [];
  for (let i = 0; i < params.channels; i++) {
    chs.push(new Channel(`ch${i + 1}`));
  }

  let orgs = [];
  for (let i = 0; i < params.organizations; i++) {
    let usrs = [];
    params.users = params.users++;
    for (let i = 0; i < params.users; i++) {
      usrs.push(new User(`user${i + 1}`));
    }

    let TMP_PEER_NUMBER = 1;
    let peers = [];
    for (let j = 0; j < TMP_PEER_NUMBER; j++) {
      peers.push(new Peer(`peer${j}`, {
        number: j,
        ports: [`7${i}51`, `7${i}52`, `7${i}53`],
        couchDbPort: `5${i}84`
      }))
    }

    orgs.push(new Organization(`org${i + 1}`, {
      channels: chs, 
      peers: peers,
      users: usrs
    }));
  }
  return { orgs, chs };
};
