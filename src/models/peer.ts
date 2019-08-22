export class PeerOptions {
  number: number;
  ports: string[];
  couchDbPort: string;
}
export class Peer {
  constructor(public name: string, public options: PeerOptions){}
}