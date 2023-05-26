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
var salia_helper_exports = {};
__export(salia_helper_exports, {
  SaliaHttpClient: () => SaliaHttpClient
});
module.exports = __toCommonJS(salia_helper_exports);
var import_tcp_ping = require("@network-utils/tcp-ping");
var import_axios = __toESM(require("axios"));
var import_https = __toESM(require("https"));
class SaliaHttpClient {
  constructor(options) {
    this.getDeviceInfos = async () => {
      try {
        const { data } = await this.instance.get("/api/device");
        this.eventEmitter.emit("onDeviceInformationRefreshed", data);
      } catch (error) {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
      }
    };
    this.getDeviceCPInformation = async () => {
      try {
        const { data } = await this.instance.get("/api/secc/port0/cp");
        return data;
      } catch (error) {
        this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        return {
          message: error.message,
          status: error.response.status
        };
      }
    };
    this.log = options.log;
    this.eventEmitter = options.eventEmitter;
    this.deviceUrl = new URL(options.baseURL);
    this.deviceStatus = false;
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
    while (true) {
      try {
        this.log.debug("Connection attempt");
        await this.onlineCheck();
        if (this.deviceStatus) {
          await this.getDeviceInfos();
          await this.getDeviceCPInformation();
        }
        return Promise.resolve();
      } catch (e) {
        if (e instanceof Error) {
          this.log.error(e.message);
        }
        this.timeout = this.cancellableSleep(1e3);
        await this.timeout.promise;
      }
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
  SaliaHttpClient
});
//# sourceMappingURL=salia-helper.js.map
