import axios, { AxiosInstance } from "axios";
import https from "https";
import { DeviceInformationResponse } from "./types/DeviceInformationResponse";
import { ApiError } from "./types/ApiError";

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

	getDeviceInfos = async () : Promise<DeviceInformationResponse | ApiError> => {
		try {
			const { data } = await this.instance.get<DeviceInformationResponse>("/");

			return data;
		} catch (error: any) {
			return {
				message: error.message,
				status: error.response.status
			}
		}
	}
}