// tslint:disable:max-line-length
import { ClientConfig, ClientHelper, TxResult } from '@worldsibu/convector-common-fabric-helper';
import { join, resolve } from 'path';
import { l } from '../utils/logs';

export class InvokeChaincodeShOptions {
    networkRootPath: string;
    channel: string;
    name: string;
    params: string[];
    transientData?: string;
    function: string;
    hyperledgerVersion: string;
    insideDocker: boolean;
    user?= 'user1';
    organization?= 'org1';
}

export class InvokeChaincodeShGenerator {

    constructor(private path: string, private options: InvokeChaincodeShOptions) {
    }

    async run() {
        const homedir = require('os').homedir();

        let helper = new ClientHelper({
            channel: this.options.channel,
            skipInit: true,
            user: this.options.user,
            keyStore: resolve(this.path, `.hfc-${this.options.organization}`),
            networkProfile: resolve(this.path, `network-profiles/${this.options.organization}.network-profile.yaml`),
            txTimeout: 300000
        });

        l('Sending transaction...');
        await helper.init();
        let res: TxResult;
        try {
            await helper.useUser(this.options.user || 'user1' as string);

            const { proposalResponse } = await helper.sendTransactionProposal({
                fcn: this.options.function,
                chaincodeId: this.options.name,
                args: this.options.params,
                transientMap: JSON.parse(this.options.transientData || '{}')
            }, true);

            res = await helper.processProposal(proposalResponse);

            l(`Transaction sent! ${res.code} ${res.info} ${res.status} ${res.txId}`);
            l(`Result: ${JSON.stringify(res.result)}`);

            // res = await helper.invoke(this.options.function, this.options.name, this.options.user, ...this.options.params);

        } catch (ex) {
            l(`Transaction failed!`);
            l(ex);
        }
    }
}