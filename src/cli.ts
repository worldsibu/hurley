import { SysWrapper } from './utils/sysWrapper';
import { join } from 'path';
import { Analytics } from './utils/analytics';
import * as Insight from 'insight';
import { ConfigTxYamlGenerator } from './generators/configtx.yaml';
import { CryptoConfigYamlGenerator } from './generators/cryptoconfig.yaml';
import { CryptoGeneratorShGenerator } from './generators/cryptofilesgenerator.sh';
import { DockerComposeYamlGenerator } from './generators/dockercompose.yaml';
import { NetworkRestartShGenerator } from './generators/networkRestart.sh';
import { NetworkCleanShGenerator } from './generators/networkClean.sh';
import { l } from './utils/logs';

export class CLI {
    static async createNetwork(organizations?: string, users?: string, channels?: string,
        path?: string) {
        const cli = new NetworkCLI();
        await cli.init(Number.parseInt(organizations), Number.parseInt(users),
            Number.parseInt(channels), path);
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
    networkRootPath = './hyperledger-fabric-network';
    analytics: Analytics;
    constructor() {
        this.analytics = new Analytics();
    }

    public async init(organizations?: number, users?: number, channels?: number, path?: string) {
        const homedir = require('os').homedir();
        path = path ? join(homedir, path) : join(homedir, this.networkRootPath);
        let orgs = [];
        for (let i = 0; i < organizations; i++) {
            orgs.push(`org${i}`);
        }
        let chs = [];
        for (let i = 0; i < channels; i++) {
            chs.push(`ch${i}`);
        }

        let config = new ConfigTxYamlGenerator('configtx.yaml', path, {
            orgs,
            channels: 1
        });
        let cryptoConfig = new CryptoConfigYamlGenerator('crypto-config.yaml', path, {
            orgs,
            users
        });
        let dockerComposer = new DockerComposeYamlGenerator('docker-compose.yaml',
            path, {
                orgs,
                networkRootPath: path,
                envVars: {
                    FABRIC_VERSION: 'x86_64-1.1.0',
                    THIRDPARTY_VERSION: 'x86_64-0.4.6'
                }
            });
        let cryptoGenerator = new CryptoGeneratorShGenerator('generator.sh', path, {
            orgs,
            networkRootPath: path,
            channels: chs
        });
        let networkRestart = new NetworkRestartShGenerator('restart.sh', path, {
            organizations: orgs,
            networkRootPath: path,
            channels: chs,
            users
        });

        await config.save();
        await cryptoConfig.save();
        await cryptoGenerator.run();

        await dockerComposer.build();
        await dockerComposer.save();

        await networkRestart.run();

        this.analytics.trackNetworkNew(JSON.stringify({ organizations, users, channels, path }));
       l('************ Success!');
       l(`Complete network deployed at ${path}`);
       l(`Setup:
        - Organizations: ${organizations}${orgs.map(org => `
            * ${org}`).join('')}
        - Users per organization: ${users+1} 
            * admin ${Array.apply(null, { length: users }).map((user, index) => `
            * user${index}`).join('')}
        - Channels deployed: ${channels}${chs.map(ch => `
            * ${ch}`).join('')}
        `);
       l(`You can find the network topology (ports, names) here: ${join(path, 'docker-compose.yaml')}`);
    }
    public async clean() {
        let networkClean = new NetworkCleanShGenerator('clean.sh', 'na', null);
        await networkClean.run();
        this.analytics.trackNetworkClean();
       l('************ Success!');
       l('Environment cleaned!');
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