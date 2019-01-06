import { join } from 'path';
import { SysWrapper } from '../utils/sysWrapper';

export abstract class BaseGenerator {
    contents: string;
    /** Breadcrumb */
    success: string;

    constructor(public filename: string, public path: string) {
    }

    get filePath(): string {
        return join(this.path, this.filename);
    }
    run() {
        SysWrapper.execContent(this.contents);
    }
    check() {
        return SysWrapper.existsPath(this.success);
    }
    save() {
        return SysWrapper.createFile(this.filePath, this.contents);
    }
}
