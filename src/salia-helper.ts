import axios, { AxiosInstance } from "axios";
import https from "https";
import { ApiError } from "./types/ApiError";
import { DeviceInformation } from "./types/DeviceInformation";
import { DeviceCPInformation } from "./types/DeviceCPInformation";

export class SaliaHttpClient {
	protected readonly instance: AxiosInstance;

	public constructor(baseURL: string) {
		this.instance = axios.create({
			baseURL,
			timeout: 1000,
			responseType: "json",
			responseEncoding: "utf8",
			httpsAgent: new https.Agent({
				rejectUnauthorized: false
			})
		});
	}

	getDeviceInfos = async () : Promise<DeviceInformation | ApiError> => {
		try {
			const { data } = await this.instance.get<DeviceInformation>("/api/device");

			return data;
		} catch (error: any) {
			return {
				message: error.message,
				status: error.response.status
			}
		}
	}

	getDeviceCPInformation = async () : Promise<DeviceCPInformation | ApiError> => {
		try {
			const { data } = await this.instance.get<DeviceCPInformation>("/api/secc/port0/cp");

			return data;
		} catch (error: any) {
			return {
				message: error.message,
				status: error.response.status
			}
		}
	}
}