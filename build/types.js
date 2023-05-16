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
var types_exports = {};
__export(types_exports, {
  HttpClient: () => HttpClient
});
module.exports = __toCommonJS(types_exports);
var import_axios = __toESM(require("axios"));
var import_https = __toESM(require("https"));
class HttpClient {
  constructor(baseURL) {
    this.getDeviceInfos = async () => {
      try {
        const { data } = await this.instance.get("/api/device");
        return data;
      } catch (error) {
        return {
          message: error.message,
          status: error.response.status
        };
      }
    };
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HttpClient
});
//# sourceMappingURL=types.js.map
