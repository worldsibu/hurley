import { resolve } from 'path';
import { InstallChaincodeShGenerator } from './installchaincode.sh';
import { UpgradeChaincodeShGenerator } from './upgradechaincode.sh';
import { l } from '../utils/logs';
import { InvokeChaincodeShGenerator } from './invokechaincode.sh';
import { Organization } from '../models/organization';
import { Channel } from '../models/channel';

export class ChaincodeInteractor {
    invokeScript: InvokeChaincodeShGenerator;

    constructor(public name: string, private fn: string, private options: {
        channel?: Channel;
        networkRootPath: string;
        hyperledgerVersion: string;
        insideDocker?: boolean;
        user?: string;
        transientData?: string;
        organization?: Organization;
    }, ...args: any[]) {
        this.invokeScript = new InvokeChaincodeShGenerator(options.networkRootPath, {
            channel: this.options.channel || new Channel('ch1'),
            name,
            function: fn,
            transientData: options.transientData,
            networkRootPath: options.networkRootPath,
            params: args || [],
            hyperledgerVersion: options.hyperledgerVersion,
            insideDocker: this.options.insideDocker,
            user: this.options.user, organization: this.options.organization
        });
    }

    async invoke() {
        return this.invokeScript.run();
    }
}