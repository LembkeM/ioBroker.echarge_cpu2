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
var import_events = __toESM(require("events"));
var import_salia_helper = require("./salia-helper");
class EchargeCpu2 extends utils.Adapter {
  constructor(options = {}) {
    super({
      ...options,
      name: "echarge_cpu2"
    });
    this.on("ready", this.onReady.bind(this));
    this.on("unload", this.onUnload.bind(this));
    this.eventEmitter = new import_events.default();
  }
  async onReady() {
    if (!this.config.basicDeviceUrl) {
      this.log.error(`Device Url is empty - please check instance configuration of ${this.namespace}`);
      return;
    }
    try {
      this.eChargeClient = new import_salia_helper.SaliaHttpClient({
        baseURL: this.config.basicDeviceUrl,
        log: this.log,
        eventEmitter: this.eventEmitter
      });
      this.eventEmitter.on(
        "onisOnlineChanged",
        async (isOnline) => await this.connectionStateChanged(isOnline)
      );
      this.eventEmitter.on(
        "onDeviceInformationRefreshed",
        async (deviceInformation) => await this.DeviceInformationRefreshed(deviceInformation)
      );
      this.eventEmitter.on(
        "onDeviceCPInformationRefreshed",
        async (deviceCPInformation) => await this.deviceCPInformationCheck(deviceCPInformation)
      );
      this.eventEmitter.on(
        "onDeviceMeteringRefreshed",
        async (deviceMetering) => await this.deviceMeteringInformation(deviceMetering)
      );
      await this.setStateAsync("info.connection", false, true);
      this.eChargeClient.connect().then(() => {
        this.log.info("Connected");
      }).catch((reason) => {
        this.log.error(`Connection failure: ${reason}`);
      });
    } catch (error) {
      this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
    }
  }
  onUnload(callback) {
    try {
      this.eChargeClient.stop();
      callback();
    } catch (e) {
      callback();
    }
  }
  async connectionStateChanged(isOnline) {
    await this.setStateAsync("info.connection", isOnline, true);
  }
  async DeviceInformationRefreshed(deviceInfo) {
    await this.setStateAsync("deviceInfo.hardware_version", deviceInfo.hardware_version, true);
    await this.setStateAsync("deviceInfo.hostname", deviceInfo.hostname, true);
    await this.setStateAsync("deviceInfo.internal_id", deviceInfo.internal_id, true);
    await this.setStateAsync("deviceInfo.mac_address", deviceInfo.mac_address, true);
    await this.setStateAsync("deviceInfo.product", deviceInfo.product, true);
    await this.setStateAsync("deviceInfo.serial", deviceInfo.serial, true);
    await this.setStateAsync("deviceInfo.software_version", deviceInfo.software_version, true);
    await this.setStateAsync("deviceInfo.vcs_version", deviceInfo.vcs_version, true);
  }
  async deviceCPInformationCheck(deviceCPInformation) {
    await this.setStateAsync("deviceSecc.scc_cp_state", deviceCPInformation.state, true);
  }
  async deviceMeteringInformation(deviceMetering) {
    await this.setStateAsync("deviceSecc.metering.meter.available", deviceMetering.meter.available, true);
    await this.setStateAsync(
      "deviceSecc.metering.energy.active_total.actual",
      deviceMetering.energy.active_total.actual,
      true
    );
    await this.setStateAsync(
      "deviceSecc.metering.power.active_total.actual",
      deviceMetering.power.active_total.actual,
      true
    );
    await this.setStateAsync(
      "deviceSecc.metering.power.active.ac.l1_actual",
      deviceMetering.power.active.ac.l1.actual,
      true
    );
    await this.setStateAsync(
      "deviceSecc.metering.power.active.ac.l2_actual",
      deviceMetering.power.active.ac.l2.actual,
      true
    );
    await this.setStateAsync(
      "deviceSecc.metering.power.active.ac.l3_actual",
      deviceMetering.power.active.ac.l3.actual,
      true
    );
    await this.setStateAsync("deviceSecc.metering.current.ac.l1_actual", deviceMetering.current.ac.l1.actual, true);
    await this.setStateAsync("deviceSecc.metering.current.ac.l2_actual", deviceMetering.current.ac.l2.actual, true);
    await this.setStateAsync("deviceSecc.metering.current.ac.l3_actual", deviceMetering.current.ac.l3.actual, true);
  }
}
if (require.main !== module) {
  module.exports = (options) => new EchargeCpu2(options);
} else {
  (() => new EchargeCpu2())();
}
//# sourceMappingURL=main.js.map
