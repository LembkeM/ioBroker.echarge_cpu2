"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var saliahttpservice_exports = {};
__export(saliahttpservice_exports, {
  SaliaHttpService: () => SaliaHttpService
});
module.exports = __toCommonJS(saliahttpservice_exports);
var import_tcp_ping = require("@network-utils/tcp-ping");
var import_axios = __toESM(require("axios"));
var import_https = __toESM(require("https"));
class SaliaHttpService {
  constructor(options) {
    this.getDeviceInfos = async () => {
      await this.instance.get("/api/device").then((resp) => {
        this.eventEmitter.emit("onDeviceInformationRefreshed", resp.data);
      }).catch((error) => {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        this.deviceStatus = false;
      });
    };
    this.getDeviceCPInformation = async () => {
      await this.instance.get("/api/secc/port0/cp").then((resp) => {
        this.deviceCPState = resp.data.state;
        this.eventEmitter.emit("onDeviceCPInformationRefreshed", resp.data);
      }).catch((error) => {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        this.deviceStatus = false;
      });
    };
    this.getDeviceChargeData = async () => {
      await this.instance.get("/api/secc/port0/salia").then((resp) => {
        this.eventEmitter.emit("onDeviceChargeDataRefreshed", resp.data);
      }).catch((error) => {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        this.deviceStatus = false;
      });
    };
    this.getDeviceMeterData = async () => {
      await this.instance.get("/api/secc/port0/metering/meter").then((resp) => {
        this.log.debug(JSON.stringify(resp.data));
        this.eventEmitter.emit("onDeviceMeterRefreshed", resp.data);
        return resp.data.available;
      }).catch((error) => {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        this.deviceStatus = false;
      });
      return false;
    };
    this.getDeviceMetering = async () => {
      await this.instance.get("/api/secc/port0/metering").then((resp) => {
        this.log.debug(JSON.stringify(resp.data));
        this.deviceMeterAvailable = resp.data.meter.available;
        this.eventEmitter.emit("onDeviceMeteringRefreshed", resp.data);
      }).catch((error) => {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        this.deviceStatus = false;
      });
    };
    this.log = options.log;
    this.eventEmitter = options.eventEmitter;
    this.deviceUrl = new URL(options.baseURL);
    this.deviceStatus = false;
    this.deviceMeterAvailable = false;
    if (this.deviceUrl.port == "") {
      this.devicePort = 443;
    } else {
      this.devicePort = parseInt(this.deviceUrl.port);
    }
    const baseURL = options.baseURL;
    this.instance = import_axios.default.create({
      baseURL,
      timeout: 1e3,
      responseType: "json",
      responseEncoding: "utf8",
      httpsAgent: new import_https.default.Agent({
        rejectUnauthorized: false
      })
    });
  }
  async connect() {
    try {
      setInterval(async () => {
        this.log.debug("Connection attempt");
        await this.onlineCheck();
        if (this.deviceStatus) {
          await this.getDeviceInfos();
          await this.getDeviceCPInformation();
          await this.getDeviceChargeData();
          await this.getDeviceMetering();
        }
      }, 1e4);
    } catch (e) {
      if (e instanceof Error) {
        this.log.error(e.message);
      }
      this.timeout = this.cancellableSleep(1e3);
      await this.timeout.promise;
    }
  }
  stop() {
    var _a;
    (_a = this.timeout) == null ? void 0 : _a.cancel("Connection is no longer needed.");
    this.timeout = void 0;
  }
  cancellableSleep(ms) {
    let timer;
    let rejectPromise;
    const promise = new Promise((resolve, reject) => {
      timer = global.setTimeout(() => resolve(), ms);
      rejectPromise = reject;
    });
    return {
      cancel: (reason) => {
        global.clearTimeout(timer);
        rejectPromise(reason || new Error("Timeout cancelled"));
      },
      promise
    };
  }
  async onlineCheck() {
    let deviceStatus = false;
    try {
      const hostReachable = await (0, import_tcp_ping.ping)({ address: this.deviceUrl.hostname, port: this.devicePort, timeout: 500 });
      if (hostReachable.errors.length == 0) {
        deviceStatus = true;
      }
    } catch (error) {
      this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
    }
    if (this.deviceStatus != deviceStatus) {
      this.deviceStatus = deviceStatus;
      this.eventEmitter.emit("onisOnlineChanged", this.deviceStatus);
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SaliaHttpService
});
//# sourceMappingURL=saliahttpservice.js.map
