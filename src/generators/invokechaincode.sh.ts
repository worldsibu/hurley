// tslint:disable:max-line-length
import { ClientConfig, ClientHelper, TxResult } from '@worldsibu/convector-common-fabric-helper';
import { join, resolve } from 'path';
import { l } from '../utils/logs';
import { Organization } from '../models/organization';
import { Channel } from '../models/channel';
import { Peer } from '../models/peer';

export class InvokeChaincodeShOptions {
    networkRootPath: string;
    channel: Channel;
    name: string;
    params: string[];
    transientData?: string;
    function: string;
    hyperledgerVersion: string;
    insideDocker: boolean;
    user?= 'user1';
    organization?: Organization = new Organization('org1', {
        channels: [],
        peers: [new Peer(`peer0`, { number: 0, ports: ['7051', '7052', '7053'], couchDbPort: '5084' })],
        users: []
    });
}

export class InvokeChaincodeShGenerator {

    constructor(private path: string, private options: InvokeChaincodeShOptions) {
    }

    async run() {
        const homedir = require('os').homedir();
        let helper = new ClientHelper({
            channel: this.options.channel.name,
            skipInit: true,
            user: this.options.user,
            keyStore: resolve(this.path, `.hfc-${this.options.organization.name}`),
            networkProfile: resolve(this.path, `network-profiles/${this.options.organization.name}.network-profile.yaml`),
            txTimeout: 300000
        });

        l(`Sending transaction as ${this.options.user} in org ${this.options.organization.name}...`);
        await helper.init();
        let res: TxResult;
        try {
            await helper.useUser(this.options.user || 'user1' as string);

            const targets = this.options.organization.peers.map(peer => `${peer.name}.${this.options.organization.name}.hurley.lab`);

            const { proposalResponse } = await helper.sendTransactionProposal({
                targets: targets,
                fcn: this.options.function,
                chaincodeId: this.options.name,
                args: this.options.params,
                transientMap: JSON.parse(this.options.transientData || '{}')
            }, false);

            res = await helper.processProposal(proposalResponse);

            l(`Transaction sent! ${res.code} ${res.info} ${res.status} ${res.txId}`);
            l(`Result: ${JSON.stringify(res.result)}`);
            helper.close();
            // res = await helper.invoke(this.options.function, this.options.name, this.options.user, ...this.options.params);

        } catch (ex) {
            if (ex.responses) {
                if (ex.responses.filter(response => !response.isProposalResponse).length === 0) {
                    l(`No peer ran tx successfully!`);
                    l(ex);
                    return;
                }
                l(`At least one peer returned an error!`);
                l(`This may happen when a transaction queries private data that's not accessible to all peers`);
                ex.responses.map(response => {
                    l(`Response from ${response.peer.name}`);
                    if (response.isProposalResponse) {
                        l(JSON.stringify(response));
                    } else {
                        // Good response
                        l(response.response.payload.toString('utf8'));
                    }
                });
            } else {
                l(`Errors found!`);
                l(ex);
            }
        }
    }
}