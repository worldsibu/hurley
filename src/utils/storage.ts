import { join, resolve } from 'path';
import { SysWrapper } from './sysWrapper';
import { Network } from '../models/network';

export const ExistNetworkConfig = async function (path: string): Promise<boolean> {
  return SysWrapper.existsPath(join(path, 'hurley.networkConfig.json'));
};
export const LoadNetworkConfig = async function (path: string): Promise<Network> {
    const config = await SysWrapper.getJSON(join(path, 'hurley.networkConfig.json'));
    const network = new Network(path, {});
    network.buildFromSave(config.organizations, config.channels, config.users);
    return network;
};
export const SaveNetworkConfig = async function (path: string, config: Network) {
    return SysWrapper.createJSON(join(path, 'hurley.networkConfig.json'), config);
};
