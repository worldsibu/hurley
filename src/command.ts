#!/usr/bin/env node
import * as program from 'commander';
import { CLI } from './cli';
import { resolve } from 'path';
import * as updateNotifier from 'update-notifier';
import { l } from './utils/logs';

const pkg = require('../package.json');

function collect(val, memo) {
    memo.push(val);
    return memo;
}

const tasks = {
    async createNetwork(network?: any, organizations?: string, users?: string, channels?: string,
        path?: string, explorer?:boolean, inside?: boolean, skipDownload?: boolean, skipCleanUp?: boolean) {
        return await CLI.createNetwork(network, organizations, users, channels, path, explorer, inside, skipDownload, skipCleanUp);
    },
    async startupExplorer(port: string){
        return CLI.startupExplorer(port);
    },
    async cleanNetwork(rmi: boolean, path?: string) {
        return await CLI.cleanNetwork(rmi, path);
    },
    async installChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string,
        colConfig?: string, inside?: boolean, debug?: boolean) {
        return await CLI.installChaincode(chaincode, language, orgs, channel, version,
            params, path, ccPath, colConfig, inside, debug);
    },
    async upgradeChaincode(chaincode: string, language: string, orgs?: string[], channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, inside?: boolean) {
        return await CLI.upgradeChaincode(chaincode, language, orgs, channel,
            version, params, path, ccPath, colConfig, inside);
    },
    async invokeChaincode(chaincode: string, fn: string, channel?: string, path?: string,
        user?: string, organization?: string, inside?: boolean, transientData?: string, ...args: any[]) {
        return await CLI.invokeChaincode(chaincode, fn, channel, path, user, organization,
            inside, transientData, ...args);
    },
};

program
    .command('new')
    // .option('-v, --version <version>', 'Hyperledger Fabric version')
    .option('-n, --network <path>', 'Path to the network definition file')
    .option('-c, --channels <channels>', 'Channels in the network')
    .option('-o, --organizations <organizations>', 'Amount of organizations')
    .option('-u, --users <users>', 'Users per organization')
    .option('-p, --path <path>', 'Path to deploy the network')
    .option('-e, --explorer', 'Uses hyperledger explorer')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .option('--skip-download', 'Skip downloading the Fabric Binaries and Docker images')
    .option('--skip-cleanup', 'Skip deleting the <path>/data directory')
    // .option('-p, --peers <peers>', 'Peers per organization')
    .action(async (cmd: any) => {
        if (cmd) {
            await tasks.createNetwork(
                cmd.network,
                !cmd.organizations ? 2 : cmd.organizations < 1 ? 1 : cmd.organizations,
                !cmd.users || (cmd.users <= 1) ? 1 : cmd.users,
                !cmd.channels || (cmd.channels <= 1) ? 1 : cmd.channels,
                cmd.path, !!cmd.explorer ,!!cmd.inside, !!cmd.skipDownload, !!cmd.skipCleanUp
            );
        } else {
            await tasks.createNetwork();
        }
    });


program
    .command('explorer')
    .option('-p, --port <port>', 'Port where explorer will run','8080')
    .action(async (cmd: any) => {
        await tasks.startupExplorer(cmd.port); // if -R is not passed cmd.rmi is true
    });


program
    .command('clean')
    .option('-R, --no-rmi', 'Do not remove docker images')
    .option('-p, --path <path>', 'Path to deploy the network')
    .action(async (cmd: any) => {
        await tasks.cleanNetwork(cmd.rmi, cmd.path); // if -R is not passed cmd.rmi is true
    });

program
    .command('install <name> <language>')
    .option('-o, --org <organization>', 'Target organization.', collect, [])
    .option('-C, --channel <channel>', 'Channel to deploy the chaincode. Default to \'ch1\'', collect, [])
    .option('-c, --ctor <constructor>', 'Smart contract constructor params')
    .option('-x, --collections-config <collections-config>', 'Collections config file path (private data)')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .option('-D, --debug', 'Run in debug mode, no container (NodeJS chaincodes only)')
    .action(async (name: string, language: string, cmd: any) => {
        cmd.channel = (!cmd.channel || cmd.channel.length === 0) ? ['ch1'] : cmd.channel;
        await Promise.all(cmd.channel.map(channel => {
            return tasks.installChaincode(
                name,
                language,
                JSON.parse(cmd.org),
                channel,
                '1.0',
                cmd.ctor,
                cmd.path,
                cmd.chaincodePath,
                cmd.collectionsConfig,
                !!cmd.inside,
                !!cmd.debug);
        }));
    });

//chaincode: string, language: string, channel?: string,
// version?: string, params?: string, path?: string 
program
    .command('upgrade <name> <language> <ver>')
    .option('-o, --org <organization>', 'Organisation name', collect, [])
    .option('-C, --channel <channel>', 'Channel name', collect, [])
    .option('-c, --ctor <constructor>', 'Smart contract constructor params')
    .option('-x, --collections-config <collections-config>', 'Collections config file path (private data)')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .action(async (name: string, language: string, ver: string, cmd: any) => {
        cmd.channel = (!cmd.channel || cmd.channel.length === 0) ? ['ch1'] : cmd.channel;
        await Promise.all(cmd.channel.map(channel => {
            return tasks.upgradeChaincode(
                name,
                language,
                JSON.parse(cmd.org),
                channel,
                ver,
                cmd.ctor,
                cmd.path,
                cmd.chaincodePath,
                cmd.collectionsConfig || '',
                !!cmd.inside);
        }));
    });
program
    .command('invoke <chaincode> <fn> [args...]')
    .option('-C, --channel <channel>', 'Select a specific channel to execute the command. Default \'ch1\'')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-t, --transient-data <transient-data>', 'Private data, must be BASE64')
    // .option('-c, --ctor <constructor>', 'Smart contract request params')
    .option('-u, --user <user>', 'Select an specific user to execute command. Default \'user1\'')
    .option('-o, --organization <organization>', 'Select an specific organization to execute command. Default \'org1\'')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .action(async (chaincode: string, fn: string, args: string[], cmd: any) => {
        args.forEach(arg => l(arg));
        await tasks.invokeChaincode(
            chaincode,
            fn,
            cmd.channel,
            cmd.path,
            cmd.user || 'user1',
            cmd.organization || 'org1',
            !!cmd.inside,
            cmd.transientData || '',
            ...args);
    });

updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60
}).notify();

program
    .version(pkg.version);

program.parse(process.argv);
