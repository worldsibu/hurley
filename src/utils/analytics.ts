import * as Insight from 'insight';
import * as fs from 'fs-extra';
import { join } from 'path';

/**
 * Intelligence for Convector CLI.
 */
export class Analytics {
    trackingCode = 'UA-131737083-1';
    insight: Insight;

    constructor() {
        let pkg = JSON.parse(fs.readFileSync(join(__dirname, '../../package.json')).toString());
        // console.log(pkg);
        this.insight = new Insight({
            // Google Analytics tracking code
            trackingCode: this.trackingCode,
            pkg,
            optOut: undefined
        });
        this.init();
    }

    /** Ask for permissions. */
    init() {
        // this.insight.optOut = undefined;
        // Ask for permission the first time
        if (this.insight.optOut === undefined) {
            // tslint:disable-next-line:max-line-length
            this.insight.askPermission('May Insitor anonymoysly report usage statistics to improve the tool over time?');
            if (this.insight.optOut) {
                this.permissionRejection();
            } else {
                this.permissionAcceptance();
            }
        } else {
            if (this.insight.optOut) {
                this.returnRejected();
            } else {
                this.returnAccepted();
            }
        }
    }

    /** Log a network creation */
    trackNetworkNew(label?: string) {
        this.track(CategoryEnum.NETWORK, ActionEnum.NEW, label);
    }
    /** Log a network creation */
    trackNetworkClean(label?: string) {
        this.track(CategoryEnum.NETWORK, ActionEnum.CLEAN, label);
    }
    /** Log a network creation */
    trackChaincodeInstall(label?: string) {
        this.track(CategoryEnum.CHAINCODE, ActionEnum.INSTALL, label);
    }
    /** Log a network creation */
    trackChaincodeUpgrade(label?: string) {
        this.track(CategoryEnum.CHAINCODE, ActionEnum.UPGRADE, label);
    }
    /** Log a network creation */
    trackChaincodeInvoke(label?: string) {
        this.track(CategoryEnum.CHAINCODE, ActionEnum.INVOKE, label);
    }
    

    /** Explicit logging. */
    track(category: CategoryEnum, action: ActionEnum, label?: string) {
        // console.log(!this.insight.optOut);
        if (!this.insight.optOut) {
            this.insight.trackEvent({
                category: category,
                action: action,
                label
            });
        }
    }

    /**
     * Accepted to anonymously share insights.
     */
    permissionAcceptance() {
        this.insight.trackEvent({
            category: CategoryEnum.TRACKING,
            action: 'accept',
        });
    }

    /**
     * Rejected to share insights.
     */
    permissionRejection() {
        this.insight.trackEvent({
            category: CategoryEnum.TRACKING,
            action: 'reject',
        });
    }

    /** Returning user who accepted. */
    returnAccepted() {
        this.insight.trackEvent({
            category: CategoryEnum.TRACKING,
            action: 'returning',
            label: 'accepted before'
        });
    }

    /** Returning user who rejected. */
    returnRejected() {
        this.insight.trackEvent({
            category: CategoryEnum.TRACKING,
            action: 'returning',
            label: 'rejected before'
        });
    }
}

export enum CategoryEnum {
    NETWORK = 'network',
    CHAINCODE = 'chaincode',
    TRACKING = 'tracking'
}
export enum ActionEnum {
    NEW = 'new',
    CLEAN = 'clean',
    INSTALL = 'install',
    UPGRADE = 'upgrade',
    INVOKE = 'invoke'
}