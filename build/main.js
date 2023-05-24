"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_salia_helper = require("./salia-helper");
var import_tcp_ping = require("@network-utils/tcp-ping");
class EchargeCpu2 extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "echarge_cpu2"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  async onReady() {
    if (!this.config.basicDeviceUrl) {
      this.log.error(`Device Url is empty - please check instance configuration of ${this.namespace}`);
      return;
    }
    try {
      this.deviceUrl = new URL(this.config.basicDeviceUrl);
      this.log.debug(`Device Url is - ${this.config.basicDeviceUrl}`);
      if (this.deviceUrl.port == "") {
        this.devicePort = 443;
      } else {
        this.devicePort = parseInt(this.deviceUrl.port);
      }
      this.eChargeClient = new import_salia_helper.SaliaHttpClient(this.config.basicDeviceUrl);
      await this.setStateAsync("info.connection", false);
      this.subscribeStates("info.connection");
      this.subscribeStates("deviceSecc.scc_cp_state");
      this.onlineCheck();
    } catch (error) {
      this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
    }
  }
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  async onStateChange(id, state) {
    if (state && !state.ack) {
      const stateId = id.replace(this.namespace + ".", "");
      this.log.info(`state ${stateId} changed: ${state.val} (ack = ${state.ack})`);
      if (stateId === "info.connection") {
        this.log.debug(`[onStateChange] ${stateId} state changed - get device infos again`);
        if (state.val) {
          await this.getDeviceInformation();
          await this.deviceCPInformationCheck();
        }
      } else if (stateId === "deviceSecc.scc_cp_state") {
        this.log.debug(`[onStateChange] ${stateId} state changed - get device infos again`);
      }
      await this.setStateAsync(stateId, state.val, true);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
  async onlineCheck() {
    if (this.isOnlineCheckTimeout) {
      this.clearTimeout(this.isOnlineCheckTimeout);
      this.isOnlineCheckTimeout = null;
    }
    try {
      const hostReachable = await (0, import_tcp_ping.ping)({ address: this.deviceUrl.hostname, port: this.devicePort, timeout: 500 });
      if (hostReachable.errors.length == 0) {
        await this.setStateAsync("info.connection", true);
      } else {
        await this.setStateAsync("info.connection", false);
      }
    } catch (error) {
      this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
    }
    this.isOnlineCheckTimeout = this.setTimeout(() => {
      this.isOnlineCheckTimeout = null;
      this.onlineCheck();
    }, 60 * 1e3);
  }
  async getDeviceInformation() {
    try {
      const deviceInfoResponse = await this.eChargeClient.getDeviceInfos();
      if (deviceInfoResponse != null) {
        const response = deviceInfoResponse;
        this.log.debug("deviceInfoResponse: " + response.hardware_version);
        await this.setStateAsync("deviceInfo.hardware_version", response.hardware_version, true);
        await this.setStateAsync("deviceInfo.hostname", response.hostname, true);
        await this.setStateAsync("deviceInfo.internal_id", response.internal_id, true);
        await this.setStateAsync("deviceInfo.mac_address", response.mac_address, true);
        await this.setStateAsync("deviceInfo.product", response.product, true);
        await this.setStateAsync("deviceInfo.serial", response.serial, true);
        await this.setStateAsync("deviceInfo.software_version", response.software_version, true);
        await this.setStateAsync("deviceInfo.vcs_version", response.vcs_version, true);
      } else {
        const response = deviceInfoResponse;
        this.log.error(response.message);
      }
    } catch (error) {
      this.log.error(`[getDeviceInformation] error: ${error.message}, stack: ${error.stack}`);
    }
  }
  async deviceCPInformationCheck() {
    if (this.isCPStateCheckTimeout) {
      this.clearTimeout(this.isCPStateCheckTimeout);
      this.isCPStateCheckTimeout = null;
    }
    try {
      const deviceInfoResponse = await this.eChargeClient.getDeviceCPInformation();
      if (deviceInfoResponse != null) {
        const response = deviceInfoResponse;
        this.log.debug("deviceInfoResponse: " + response.state);
        await this.setStateAsync("deviceSecc.scc_cp_state", response.state);
      } else {
        const response = deviceInfoResponse;
        this.log.error(response.message);
      }
    } catch (error) {
      this.log.error(`[deviceCPInformationCheck] error: ${error.message}, stack: ${error.stack}`);
    }
    this.isCPStateCheckTimeout = this.setTimeout(() => {
      this.isCPStateCheckTimeout = null;
      this.deviceCPInformationCheck();
    }, 60 * 1e3);
  }
}
if (require.main !== module) {
  module.exports = (options) => new EchargeCpu2(options);
} else {
  (() => new EchargeCpu2())();
}
//# sourceMappingURL=main.js.map
