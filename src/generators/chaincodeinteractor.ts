import { resolve } from 'path';
import { InstallChaincodeShGenerator } from './installchaincode.sh';
import { UpgradeChaincodeShGenerator } from './upgradechaincode.sh';
import { l } from '../utils/logs';
import { InvokeChaincodeShGenerator } from './invokechaincode.sh';

export class ChaincodeInteractor {
    invokeScript: InvokeChaincodeShGenerator;

    constructor(public name: string, private options: {
        channel?: string;
        networkRootPath: string;
        params: string;
        hyperledgerVersion: string;
        insideDocker?: boolean;
    }) {
        this.invokeScript = new InvokeChaincodeShGenerator('invokescript.sh', options.networkRootPath, {
            channel: this.options.channel || 'ch1',
            name,
            networkRootPath: options.networkRootPath,
            params: options.params || '{"Args":["init",""]}',
            hyperledgerVersion: options.hyperledgerVersion,
            insideDocker: this.options.insideDocker
        });
    }

    async save() {
        await this.invokeScript.save();
    }
    
    async invoke(){
        return this.invokeScript.run();
    }
}