/*
 * Created with @iobroker/create-adapter v2.4.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { SaliaHttpClient } from "./salia-helper";
import { ApiError } from "./types/ApiError";
import { DeviceInformation } from "./types/DeviceInformation";
import { ping } from "@network-utils/tcp-ping";
import { DeviceCPInformation } from "./types/DeviceCPInformation";

// Load your modules here, e.g.:
// import * as fs from "fs";



class EchargeCpu2 extends utils.Adapter {

	isOnlineCheckTimeout: any;
	isCPStateCheckTimeout: any;

	deviceUrl!: URL;
	devicePort!: number;

	eChargeClient!: SaliaHttpClient;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "echarge_cpu2",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
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
			this.deviceUrl = new URL(this.config.basicDeviceUrl);
			this.log.debug(`Device Url is - ${this.config.basicDeviceUrl}`);

			if (this.deviceUrl.port == "") {
				this.devicePort = 443;
			}
			else {
				this.devicePort = parseInt(this.deviceUrl.port);
			}

			this.eChargeClient = new HttpClient(this.config.basicDeviceUrl);

			await this.setStateAsync("info.connection", false);

			// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
			// this.subscribeStates("testVariable");
			// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
			// this.subscribeStates("lights.*");
			// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
			// this.subscribeStates("*");

			this.subscribeStates("info.connection");
			this.subscribeStates("deviceSecc.scc_cp_state");

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
			this.onlineCheck();

			// if (deviceInfoResponse.status == 200) {
			// 	await this.setStateAsync("info.connection", true, true);

			// 	this.log.debug("deviceInfoResponse: " + JSON.stringify(deviceInfoResponse.data));

			// 	// deviceInfoResponse: {"product":"2310007","modelname":"Salia PLCC Slave","hardware_version":"1.0","software_version":"1.84.50","vcs_version":"V0R5e","hostname":"salia","mac_address":"00:01:87:13:bc:1e","serial":"101293342","uuid":"5491ad62-022a-4356-a32c-00018713bc1e","internal_id":"998539","ip_lo":"127.0.0.1","ip_br0:fallback":"169.254.12.53","ip_br0":"172.31.1.95"}
			// }
			// else {
			// 	await this.setStateAsync("info.connection", false, true);
			// }

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

			callback();
		} catch (e) {
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
	private async onStateChange(id: string, state: ioBroker.State | null | undefined): Promise<void> {
		if (state && !state.ack) {
			const stateId = id.replace(this.namespace + ".", "");

			// The state was changed
			this.log.info(`state ${stateId} changed: ${state.val} (ack = ${state.ack})`);

			if (stateId === "info.connection") {
				this.log.debug(`[onStateChange] ${stateId} state changed - get device infos again`);

				if (state.val) {
					await this.getDeviceInformation();

					await this.deviceCPInformationCheck();
				}
			}
			else if (stateId === "deviceSecc.scc_cp_state") {
				this.log.debug(`[onStateChange] ${stateId} state changed - get device infos again`);
			}

			await this.setStateAsync(stateId, state.val, true);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

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

	private async onlineCheck(): Promise<void> {
		if (this.isOnlineCheckTimeout) {
			this.clearTimeout(this.isOnlineCheckTimeout);
			this.isOnlineCheckTimeout = null;
		}

		try {
			const hostReachable = await ping({address:this.deviceUrl.hostname, port: this.devicePort, timeout: 500} );

			if (hostReachable.errors.length == 0) {
				await this.setStateAsync("info.connection", true);
			}
			else {
				await this.setStateAsync("info.connection", false);
			}

		} catch (error: any) {
			this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
		}

		this.isOnlineCheckTimeout = this.setTimeout(() => {
			this.isOnlineCheckTimeout = null;
			this.onlineCheck();
		}, 60 * 1000); // Restart online check in 60 seconds
	}

	private async getDeviceInformation(): Promise<void> {
		try {
			const deviceInfoResponse = await this.eChargeClient.getDeviceInfos();

			if ((deviceInfoResponse as DeviceInformation) != null) {

				const response = deviceInfoResponse as DeviceInformation;
				this.log.debug("deviceInfoResponse: " + response.hardware_version);

				await this.setStateAsync("deviceInfo.hardware_version", response.hardware_version, true);
				await this.setStateAsync("deviceInfo.hostname", response.hostname, true);
				await this.setStateAsync("deviceInfo.internal_id", response.internal_id, true);
				await this.setStateAsync("deviceInfo.mac_address", response.mac_address, true);
				await this.setStateAsync("deviceInfo.product", response.product, true);
				await this.setStateAsync("deviceInfo.serial", response.serial, true);
				await this.setStateAsync("deviceInfo.software_version", response.software_version, true);
				await this.setStateAsync("deviceInfo.vcs_version", response.vcs_version, true);
			}
			else {
				const response = deviceInfoResponse as ApiError

				this.log.error(response.message);
			}

		} catch (error: any) {
			this.log.error(`[getDeviceInformation] error: ${error.message}, stack: ${error.stack}`);
		}
	}

	private async deviceCPInformationCheck(): Promise<void> {
		if (this.isCPStateCheckTimeout) {
			this.clearTimeout(this.isCPStateCheckTimeout);
			this.isCPStateCheckTimeout = null;
		}

		try {
			const deviceInfoResponse = await this.eChargeClient.getDeviceCPInformation();

			if ((deviceInfoResponse as DeviceCPInformation) != null) {

				const response = deviceInfoResponse as DeviceCPInformation;
				this.log.debug("deviceInfoResponse: " + response.state);

				await this.setStateAsync("deviceSecc.scc_cp_state", response.state);
			}
			else {
				const response = deviceInfoResponse as ApiError

				// await this.setStateAsync("deviceInfo.scc.cp.state", false, true);

				this.log.error(response.message);
			}

		} catch (error: any) {
			this.log.error(`[deviceCPInformationCheck] error: ${error.message}, stack: ${error.stack}`);
		}

		this.isCPStateCheckTimeout = this.setTimeout(() => {
			this.isCPStateCheckTimeout = null;
			this.deviceCPInformationCheck();
		}, 60 * 1000); // Restart online check in 60 seconds
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new EchargeCpu2(options);
} else {
	// otherwise start the instance directly
	(() => new EchargeCpu2())();
}