import { SysWrapper } from './utils/sysWrapper';
import { join } from 'path';
import { Analytics } from './utils/analytics';
import * as Insight from 'insight';

export class CLI {
    static async createNetwork(name: string, organizations?: string, users?: string) {
        const cli = new NetworkCLI();
        await cli.init(name, organizations, users);
        return cli;
    }
    static async cleanNetwork() {
        const cli = new NetworkCLI();
        await cli.clean();
        return cli;
    }

    static async installChaincode(chaincode: string, path: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.installChaincode(chaincode, path);
        return cli;
    }
    static async upgradeChaincode(chaincode: string, path: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.upgradeChaincode(chaincode, path);
        return cli;
    }
    static async invokeChaincode(chaincode: string, fn: string) {
        const cli = new ChaincodeCLI(chaincode);
        await cli.invokeChaincode(chaincode, fn);
        return cli;
    }
}

export class NetworkCLI {
    analytics: Analytics;
    constructor() {
        this.analytics = new Analytics();
    }

    public async init(name: string, organizations?: string, users?: string) {
        console.log(__dirname);
        SysWrapper.execFile(join(__dirname, '../scripts/restart.sh'), {
            path: join(__dirname,'../')
        });
        this.analytics.trackNetworkNew(`NETWORK=${name}`);
    }
    public async clean() {
        SysWrapper.execFile(join(__dirname, '../scripts/clean.sh'), {
            path: join(__dirname,'../')
        });
        this.analytics.trackNetworkClean();
    }
}
export class ChaincodeCLI {
    analytics: Analytics;
    constructor(private name: string) {
        this.analytics = new Analytics();
    }
    public async installChaincode(chaincode: string, path: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeInstall(`CHAINCODE=${chaincode}`);
    }
    public async upgradeChaincode(chaincode: string, path: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeUpgrade(`CHAINCODE=${chaincode}`);
    }
    public async invokeChaincode(chaincode: string, fn: string) {
        // let model = new ModelModel(this.chaincode, this.name, true);
        // await model.save();
        this.analytics.trackChaincodeInvoke(`CHAINCODE=${this.installChaincode} fn=${fn}`);
    }
}