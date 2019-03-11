// tslint:disable:max-line-length
import { ClientConfig, ClientHelper, TxResult } from '@worldsibu/convector-common-fabric-helper';
import { join, resolve } from 'path';
import { l } from '../utils/logs';

export class InvokeChaincodeShOptions {
    networkRootPath: string;
    channel: string;
    name: string;
    params: string[];
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
            txTimeout: 30000
        });

        l('Sending transaction...');
        await helper.init();
        let res: TxResult;
        try {
            res = await helper.invoke(this.options.function, this.options.name, this.options.user, ...this.options.params);

            l(`Transaction sent! ${res.code} ${res.info} ${res.status} ${res.txId}`);
            l(`Result: ${JSON.stringify(res.result)}`);
        } catch (ex) {
            l(`Transaction failed!`);
            l(ex);
        }
    }
}