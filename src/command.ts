#!/usr/bin/env node
import * as program from 'commander';
import { CLI } from './cli';
import { resolve } from 'path';
import * as updateNotifier from 'update-notifier';
import { l } from './utils/logs';

const pkg = require('../package.json');

const tasks = {
    async createNetwork(organizations?: string, users?: string, channels?: string,
        path?: string, inside?: boolean) {
        return await CLI.createNetwork(organizations, users, channels, path, inside);
    },
    async cleanNetwork() {
        return await CLI.cleanNetwork();
    },
    async installChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, colConfig?: string, inside?: boolean) {
        return await CLI.installChaincode(chaincode, language, channel, version,
            params, path, ccPath, colConfig, inside);
    },
    async upgradeChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string, inside?: boolean) {
        return await CLI.upgradeChaincode(chaincode, language, channel, version, params, path, ccPath, inside);
    },
    async invokeChaincode(chaincode: string, fn: string, channel?: string, path?: string,
        user?: string, organization?: string, inside?: boolean, ...args: any[]) {
        return await CLI.invokeChaincode(chaincode, fn, channel, path, user, organization, inside, ...args);
    },
};

program
    .command('new')
    // .option('-v, --version <version>', 'Hyperledger Fabric version')
    .option('-c, --channels <channels>', 'Channels in the network')
    .option('-o, --organizations <organizations>', 'Amount of organizations')
    .option('-u, --users <users>', 'Users per organization')
    .option('-p, --path <path>', 'Path to deploy the network')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    // .option('-p, --peers <peers>', 'Peers per organization')
    .action(async (cmd: any) => {
        if (cmd) {
            await tasks.createNetwork(
                !cmd.organizations || (cmd.organizations <= 2) ? 2 : cmd.organizations,
                !cmd.users || (cmd.users <= 1) ? 1 : cmd.users,
                !cmd.channels || (cmd.channels <= 1) ? 1 : cmd.channels,
                cmd.path, !!cmd.inside
            );
        } else {
            await tasks.createNetwork();
        }
    });
program
    .command('clean')
    .action(async () => {
        await tasks.cleanNetwork(
        );
    });

program
    .command('install <name> <language>')
    .option('-C, --channel <channel>', 'Channel name')
    .option('-c, --ctor <constructor>', 'Smart contract constructor params')
    .option('-x, --collections-config <collections-config>', 'Collections config file path')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .action(async (name: string, language: string, cmd: any) => {
        await tasks.installChaincode(
            name,
            language,
            cmd.channel,
            '1.0',
            cmd.ctor,
            cmd.path,
            cmd.chaincodePath,
            cmd.collectionsConfig,
            !!cmd.inside);
    });

//chaincode: string, language: string, channel?: string,
// version?: string, params?: string, path?: string 
program
    .command('upgrade <name> <language> <ver>')
    .option('-C, --channel <channel>', 'Channel name')
    .option('-c, --ctor <constructor>', 'Smart contract constructor params')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .option('-i, --inside', 'Optimized for running inside the docker compose network')
    .action(async (name: string, language: string, ver: string, cmd: any) => {
        await tasks.upgradeChaincode(
            name,
            language,
            cmd.channel,
            ver,
            cmd.ctor,
            cmd.path,
            cmd.chaincodePath,
            !!cmd.inside);
    });
program
    .command('invoke <chaincode> <fn> [args...]')
    .option('-C, --channel <channel>', 'Channel name')
    .option('-p, --path <path>', 'Path to deploy the network folder')
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
            ...args);
    });

updateNotifier({
    pkg,
    updateCheckInterval: 1000 * 60
}).notify();

program
    .version(pkg.version);

program.parse(process.argv);