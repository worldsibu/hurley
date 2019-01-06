import { SysWrapper } from './sysWrapper';
import { join } from 'path';

export const ExistNetworkConfig = async function (path: string): Promise<boolean> {
    return SysWrapper.existsPath(join(path, 'hurley.networkConfig.json'));
};
export const LoadNetworkConfig = async function (path: string): Promise<NetworkConfig> {
    return SysWrapper.getJSON(join(path, 'hurley.networkConfig.json'));
};
export const SaveNetworkConfig = async function (path: string, config: NetworkConfig) {
    return SysWrapper.createJSON(join(path, 'hurley.networkConfig.json'), config);
};

export class NetworkConfig {
    organizations: number;
    users: number;
    channels: number;
    path: string;
    hyperledgerVersion: string;
    externalHyperledgerVersion: string;
}