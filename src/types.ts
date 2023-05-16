import axios, { AxiosInstance } from "axios";
import https from "https";
import { ApiError } from "./types/ApiError";
import { DeviceInformation } from "./types/DeviceInformation";

export class HttpClient {
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
}