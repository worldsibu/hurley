import { BaseGenerator } from './base';
import { join } from 'path';

export class ConfigJsonGenerator extends BaseGenerator {
    contents =`{
          "network-configs": {
            "hurley-network": {
              "name": "hurley-network",
              "profile": "./connection-profile/connection-profile.json"
            }
          },
          "license": "Apache-2.0"
        }
  `;

  constructor(filename: string, path: string) {
    super(filename, path);
    this.success = join(path, 'config.json.successful');
  }
}
