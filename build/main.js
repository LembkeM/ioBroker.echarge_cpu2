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
var import_types = require("./types");
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
    this.log.debug(`Device Url is - ${this.config.basicDeviceUrl}`);
    const eChargeClient = new import_types.HttpClient(this.config.basicDeviceUrl);
    try {
      const deviceInfoResponse = await eChargeClient.getDeviceInfos();
      if (deviceInfoResponse != null) {
        const response = deviceInfoResponse;
        this.log.debug("deviceInfoResponse: " + response.hardware_version);
        await this.setStateAsync("info.connection", true, true);
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
        await this.setStateAsync("info.connection", false, true);
        this.log.error(response.message);
      }
    } catch (error) {
    }
    let result = await this.checkPasswordAsync("admin", "iobroker");
    this.log.info("check user admin pw iobroker: " + result);
    result = await this.checkGroupAsync("admin", "admin");
    this.log.info("check group user admin group admin: " + result);
  }
  onUnload(callback) {
    try {
      callback();
    } catch (e) {
      callback();
    }
  }
  onStateChange(id, state) {
    if (state) {
      this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
    } else {
      this.log.info(`state ${id} deleted`);
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new EchargeCpu2(options);
} else {
  (() => new EchargeCpu2())();
}
//# sourceMappingURL=main.js.map
