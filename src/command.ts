#!/usr/bin/env node
import * as program from 'commander';
import { CLI } from './cli';
import { resolve } from 'path';

const fixPath = p => resolve(process.cwd(), p);

const tasks = {
    async createNetwork(organizations?: string, users?: string, channels?: string,
        path?: string, inside?: boolean) {
        return await CLI.createNetwork(organizations, users, channels, path, inside);
    },
    async cleanNetwork() {
        return await CLI.cleanNetwork();
    },
    async installChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string) {
        return await CLI.installChaincode(chaincode, language, channel, version, params, path, ccPath);
    },
    async upgradeChaincode(chaincode: string, language: string, channel?: string,
        version?: string, params?: string, path?: string, ccPath?: string) {
        return await CLI.upgradeChaincode(chaincode, language, channel, version, params, path, ccPath);
    },
    async invokeChaincode(chaincode: string, fn: string) {
        return await CLI.invokeChaincode(chaincode, fn);
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
                !cmd.organizations || (cmd.organizations <= 2 || cmd.organizations >= 7) ? 2 : cmd.organizations,
                !cmd.users || (cmd.users <= 1 || cmd.users >= 10) ? 1 : cmd.users,
                !cmd.channels || (cmd.channels <= 1 || cmd.channels >= 7) ? 1 : cmd.channels,
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
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .action(async (name: string, language: string, cmd: any) => {
        await tasks.installChaincode(
            name,
            language,
            cmd.channel,
            '1.0',
            cmd.ctor,
            cmd.path,
            cmd.chaincodePath);
    });

//chaincode: string, language: string, channel?: string,
// version?: string, params?: string, path?: string 
program
    .command('upgrade <name> <language> <ver>')
    .option('-C, --channel <channel>', 'Channel name')
    .option('-c, --ctor <constructor>', 'Smart contract constructor params')
    .option('-p, --path <path>', 'Path to deploy the network folder')
    .option('-P, --chaincode-path <path>', 'Path to chaincode package. Default to ./<name>')
    .action(async (name: string, language: string, ver: string, cmd: any) => {
        await tasks.upgradeChaincode(
            name,
            language,
            cmd.channel,
            ver,
            cmd.ctor,
            cmd.path,
            cmd.chaincodePath);
    });
program
    .command('invoke <chaincode>')
    .option('-f, --fn <fn>', 'Default function')
    .action(async (chaincode: string, cmd: any) => {
        await tasks.invokeChaincode(
            chaincode,
            cmd.fn);
    });

program.parse(process.argv);
