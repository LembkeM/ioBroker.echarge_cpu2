/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import EventEmitter from "events";
import { SaliaHttpClient } from "./salia-helper";
import { DeviceCPInformation } from "./types/DeviceCPInformation";
import { DeviceInformation } from "./types/DeviceInformation";
import { Metering } from "./types/Root";

class EchargeCpu2 extends utils.Adapter {
    isOnlineCheckTimeout: any;
    isCPStateCheckTimeout: any;

    eventEmitter: EventEmitter;
    eChargeClient!: SaliaHttpClient;

    public constructor(options: Partial<utils.AdapterOptions> = {}) {
        super({
            ...options,
            name: "echarge_cpu2",
        });
        this.on("ready", this.onReady.bind(this));
        // this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));

        this.eventEmitter = new EventEmitter();
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    private async onReady(): Promise<void> {
        // Initialize your adapter here

        if (!this.config.basicDeviceUrl) {
            this.log.error(`Device Url is empty - please check instance configuration of ${this.namespace}`);
            return;
        }

        try {
            this.eChargeClient = new SaliaHttpClient({
                baseURL: this.config.basicDeviceUrl,
                log: this.log,
                eventEmitter: this.eventEmitter,
            });

            // Handle Device changes to the connectionstate
            this.eventEmitter.on(
                "onisOnlineChanged",
                async (isOnline: boolean) => await this.connectionStateChanged(isOnline),
            );

            // Handle Device changes to the connectionstate
            this.eventEmitter.on(
                "onDeviceInformationRefreshed",
                async (deviceInformation: DeviceInformation) =>
                    await this.DeviceInformationRefreshed(deviceInformation),
            );

            // Handle Device changes to the connectionstate
            this.eventEmitter.on(
                "onDeviceCPInformationRefreshed",
                async (deviceCPInformation: DeviceCPInformation) =>
                    await this.deviceCPInformationCheck(deviceCPInformation),
            );

            this.eventEmitter.on(
                "onDeviceChargeDataRefreshed",
                async (deviceChargeData: Salia) => await this.DeviceChargeDataRefreshed(deviceChargeData),
            );

            this.eventEmitter.on(
                "onDeviceMeteringRefreshed",
                async (deviceMetering: Metering) => await this.deviceMeteringInformation(deviceMetering),
            );

            // Reset the Connectionstate
            await this.setStateAsync("info.connection", false, true);

            // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
            // this.subscribeStates("testVariable");
            // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
            // this.subscribeStates("lights.*");
            // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
            // this.subscribeStates("*");

            /*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
            // the variable testVariable is set to true as command (ack=false)
            // await this.setStateAsync("testVariable", true);

            // same thing, but the value is flagged "ack"
            // ack should be always set to true if the value is received from or acknowledged from the target system
            // await this.setStateAsync("testVariable", { val: true, ack: true });

            // same thing, but the state is deleted after 30s (getState will return null afterwards)
            // await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

            // Start online check
            this.eChargeClient
                .connect()
                .then(() => {
                    this.log.info("Connected");
                })
                .catch((reason) => {
                    this.log.error(`Connection failure: ${reason}`);
                });
        } catch (error: any) {
            this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        }

        // examples for the checkPassword/checkGroup functions
        // let result = await this.checkPasswordAsync("admin", "iobroker");
        // this.log.info("check user admin pw iobroker: " + result);

        // result = await this.checkGroupAsync("admin", "admin");
        // this.log.info("check group user admin group admin: " + result);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    private onUnload(callback: () => void): void {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            this.eChargeClient.stop();

            callback();
        } catch (error: any) {
            this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    // 	if (obj) {
    // 		// The object was changed
    // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    // 	} else {
    // 		// The object was deleted
    // 		this.log.info(`object ${id} deleted`);
    // 	}
    // }

    /**
     * Is called if a subscribed state changes
     */
    // private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
    //     if (state && !state.ack) {
    //         const stateId = id.replace(this.namespace + ".", "");

    //         // The state was changed
    //         this.log.info(`state ${stateId} changed: ${state.val} (ack = ${state.ack})`);

    //         await this.setStateAsync(stateId, state.val, true);
    //     } else {
    //         // The state was deleted
    //         this.log.info(`state ${id} deleted`);
    //     }
    // }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  */
    // private onMessage(obj: ioBroker.Message): void {
    // 	if (typeof obj === "object" && obj.message) {
    // 		if (obj.command === "send") {
    // 			// e.g. send email or pushover or whatever
    // 			this.log.info("send command");

    // 			// Send response in callback if required
    // 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    // 		}
    // 	}
    // }

    private async connectionStateChanged(isOnline: boolean): Promise<void> {
        await this.setStateAsync("info.connection", isOnline, true);
    }

    private async DeviceChargeDataRefreshed(chargeData: Salia): Promise<void> {
        this.log.error(`${chargeData.chargedata}`);
    }

    private async DeviceInformationRefreshed(deviceInfo: DeviceInformation): Promise<void> {
        // if ((deviceInfoResponse as DeviceInformation) != null) {
        //     const response = deviceInfoResponse as DeviceInformation;
        //     this.log.debug("deviceInfoResponse: " + response.hardware_version);

        await this.setStateAsync("deviceInfo.hardware_version", deviceInfo.hardware_version, true);
        await this.setStateAsync("deviceInfo.hostname", deviceInfo.hostname, true);
        await this.setStateAsync("deviceInfo.internal_id", deviceInfo.internal_id, true);
        await this.setStateAsync("deviceInfo.mac_address", deviceInfo.mac_address, true);
        await this.setStateAsync("deviceInfo.product", deviceInfo.product, true);
        await this.setStateAsync("deviceInfo.serial", deviceInfo.serial, true);
        await this.setStateAsync("deviceInfo.software_version", deviceInfo.software_version, true);
        await this.setStateAsync("deviceInfo.vcs_version", deviceInfo.vcs_version, true);
        // } else {
        //     const response = deviceInfoResponse as ApiError;

        //     this.log.error(response.message);
        // }
    }

    private async deviceCPInformationCheck(deviceCPInformation: DeviceCPInformation): Promise<void> {
        await this.setStateAsync("deviceSecc.scc_cp_state", deviceCPInformation.state, true);
    }

    private async deviceMeteringInformation(deviceMetering: Metering): Promise<void> {
        await this.setStateAsync("deviceSecc.metering.meter.available", deviceMetering.meter.available, true);
        await this.setStateAsync(
            "deviceSecc.metering.energy.active_total.actual",
            deviceMetering.energy.active_total.actual,
            true,
        );

        await this.setStateAsync(
            "deviceSecc.metering.power.active_total.actual",
            deviceMetering.power.active_total.actual,
            true,
        );

        await this.setStateAsync(
            "deviceSecc.metering.power.active.ac.l1_actual",
            deviceMetering.power.active.ac.l1.actual,
            true,
        );
        await this.setStateAsync(
            "deviceSecc.metering.power.active.ac.l2_actual",
            deviceMetering.power.active.ac.l2.actual,
            true,
        );
        await this.setStateAsync(
            "deviceSecc.metering.power.active.ac.l3_actual",
            deviceMetering.power.active.ac.l3.actual,
            true,
        );

        await this.setStateAsync("deviceSecc.metering.current.ac.l1_actual", deviceMetering.current.ac.l1.actual, true);
        await this.setStateAsync("deviceSecc.metering.current.ac.l2_actual", deviceMetering.current.ac.l2.actual, true);
        await this.setStateAsync("deviceSecc.metering.current.ac.l3_actual", deviceMetering.current.ac.l3.actual, true);
    }
}

if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new EchargeCpu2(options);
} else {
    // otherwise start the instance directly
    (() => new EchargeCpu2())();
}
