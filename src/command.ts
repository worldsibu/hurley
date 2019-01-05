#!/usr/bin/env node
import * as program from 'commander';
import { CLI } from './cli';
import { resolve } from 'path';

const fixPath = p => resolve(process.cwd(), p);

const tasks = {
    async createNetwork(organizations?: string, users?: string, channels?: string,
        path?: string) {
        return await CLI.createNetwork(organizations, users, channels, path);
    },
    async cleanNetwork() {
        return await CLI.cleanNetwork();
    },
    async installChaincode(chaincode: string, path: string) {
        chaincode = chaincode.replace(/[^a-zA-Z ]/g, '');
        return await CLI.installChaincode(chaincode, path);
    },
    async upgradeChaincode(chaincode: string, path: string) {
        chaincode = chaincode.replace(/[^a-zA-Z ]/g, '');
        return await CLI.upgradeChaincode(chaincode, path);
    },
    async invokeChaincode(chaincode: string, fn: string) {
        chaincode = chaincode.replace(/[^a-zA-Z ]/g, '');
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
    // .option('-p, --peers <peers>', 'Peers per organization')
    .action(async (name: string, cmd: any) => {
        await tasks.createNetwork(
            cmd.organizations || 2,
            cmd.users || 2,
            cmd.channels || 3,
            cmd.path
        );
    });
program
    .command('clean')
    .action(async (name: string, cmd: any) => {
        await tasks.cleanNetwork(
        );
    });

program
    .command('install <chaincode> <path>')
    // .option('-c, --chaincode <chaincode>', 'Default Chaincode Name')
    .action(async (chaincode: string, path: string, cmd: any) => {
        await tasks.installChaincode(
            chaincode,
            path);
    });
program
    .command('upgrade <chaincode> <path>')
    // .option('-c, --chaincode <chaincode>', 'Default Chaincode Name')
    .action(async (chaincode: string, path: string, cmd: any) => {
        await tasks.upgradeChaincode(
            chaincode,
            path);
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
