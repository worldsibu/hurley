
import { Channel } from './channel';
import { User } from './user';
import { Peer } from './peer';

export class OrganizationOptions {
  channels: Channel[];
  peers: Peer[];
  users: User[];
}

export class Organization {
  channels: Channel[];
  peers: Peer[];
  users: User[];

  constructor(public name: string, options: OrganizationOptions) {
    this.channels = options.channels;
    this.peers = options.peers;
    this.users = options.users;
  }
}

