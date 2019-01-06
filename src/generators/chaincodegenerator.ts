import { BaseGenerator } from './base';
import { InstallChaincodeShGenerator } from './installchaincode.sh';
import { UpgradeChaincodeShGenerator } from './upgradechaincode.sh';
import { l } from '../utils/logs';

export class ChaincodeGenerator {
    installScript: InstallChaincodeShGenerator;
    upgradeScript: UpgradeChaincodeShGenerator;
    currentPath = process.cwd();

    constructor(public name: string, private options: {
        organizations: string[];
        channel?: string;
        networkRootPath: string;
        language: string;
        params: string;
        version?: string;
        hyperledgerVersion: string;
    }) {
        this.installScript = new InstallChaincodeShGenerator('installscript.sh', options.networkRootPath, {
            channel: this.options.channel || 'ch1',
            currentPath: this.currentPath,
            language: options.language,
            name,
            networkRootPath: options.networkRootPath,
            orgs: options.organizations,
            params: options.params || '{"Args":["init",""]}',
            version: options.version || '1.0',
            hyperledgerVersion: options.hyperledgerVersion
        });
        this.upgradeScript = new UpgradeChaincodeShGenerator('upgradescript.sh', options.networkRootPath, {
            channel: this.options.channel || 'ch1',
            currentPath: this.currentPath,
            language: options.language,
            name,
            networkRootPath: options.networkRootPath,
            orgs: options.organizations,
            params: options.params || '{"Args":["init",""]}',
            version: options.version,
            hyperledgerVersion: options.hyperledgerVersion
        });
    }

    async save() {
        await this.installScript.save();
        await this.upgradeScript.save();
    }
    install() {
        l(`installing smart contract located at ${this.currentPath}`);
        return this.installScript.run();
    }
    upgrade() {
        return this.upgradeScript.run();
    }
}