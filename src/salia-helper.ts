import { ping } from "@network-utils/tcp-ping";
import axios, { AxiosInstance } from "axios";
import EventEmitter from "events";
import https from "https";
import { DeviceCPInformation } from "./types/DeviceCPInformation";
import { DeviceInformation } from "./types/DeviceInformation";
import { DeviceMetering } from "./types/DeviceMetering";

interface CancellableSleep {
    promise: Promise<void>;
    cancel(reason?: any): void;
}

export class SaliaHttpClient {
    private readonly instance: AxiosInstance;
    private readonly log: ioBroker.Logger;
    private readonly eventEmitter: EventEmitter;

    private timeout?: CancellableSleep;

    private deviceUrl!: URL;
    private devicePort!: number;

    private deviceStatus: boolean;

    public constructor(options: { baseURL: string; log: ioBroker.Logger; eventEmitter: EventEmitter }) {
        this.log = options.log;

        this.eventEmitter = options.eventEmitter;

        this.deviceUrl = new URL(options.baseURL);

        this.deviceStatus = false;

        if (this.deviceUrl.port == "") {
            this.devicePort = 443;
        } else {
            this.devicePort = parseInt(this.deviceUrl.port);
        }

        const baseURL: string = options.baseURL;

        this.instance = axios.create({
            baseURL,
            timeout: 1000,
            responseType: "json",
            responseEncoding: "utf8",
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
            }),
        });
    }

    public async connect(): Promise<void> {
        while (true) {
            try {
                // try to connect somethere
                this.log.debug("Connection attempt");

                await this.onlineCheck();

                if (this.deviceStatus) {
                    await this.getDeviceInfos();
                    await this.getDeviceCPInformation();

                    await this.getDeviceMetering();
                }
                return Promise.resolve();
            } catch (e) {
                if (e instanceof Error) {
                    this.log.error(e.message);
                }

                this.timeout = this.cancellableSleep(1000);
                await this.timeout.promise;
            }
        }
    }

    public stop(): void {
        this.timeout?.cancel("Connection is no longer needed.");
        this.timeout = undefined;
    }

    private cancellableSleep(ms: number): CancellableSleep {
        let timer: NodeJS.Timeout;
        let rejectPromise: (reason?: unknown) => void;

        const promise = new Promise<void>((resolve, reject) => {
            timer = global.setTimeout(() => resolve(), ms);
            rejectPromise = reject;
        });

        return {
            cancel: (reason?: unknown) => {
                global.clearTimeout(timer);
                rejectPromise(reason || new Error("Timeout cancelled"));
            },
            promise,
        };
    }

    private async onlineCheck(): Promise<void> {
        let deviceStatus = false;
        try {
            const hostReachable = await ping({ address: this.deviceUrl.hostname, port: this.devicePort, timeout: 500 });

            if (hostReachable.errors.length == 0) {
                deviceStatus = true;
            }
        } catch (error: any) {
            this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        }

        if (this.deviceStatus != deviceStatus) {
            this.deviceStatus = deviceStatus;
            this.eventEmitter.emit("onisOnlineChanged", this.deviceStatus);
        }
    }

    private getDeviceInfos = async (): Promise<void> => {
        try {
            const { data } = await this.instance.get<DeviceInformation>("/api/device");

            this.eventEmitter.emit("onDeviceInformationRefreshed", data);
        } catch (error: any) {
            this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        }
    };

    private getDeviceCPInformation = async (): Promise<void> => {
        try {
            const { data } = await this.instance.get<DeviceCPInformation>("/api/secc/port0/cp");

            // Zustand A (12V): Fahrzeug nicht angeschlossen und nicht ladebereit
            // Zustand B (9V/-12V): Fahrzeug angeschlossen, aber nicht ladebereit
            // Zustand C (6V/-12V): Fahrzeug angeschlossen und ladebereit
            // Zustand D (3V/-12V): Lüftungsanforderung
            // Zustand E (0V): Fehlerzustand “Kurzschluss” (CP-PE über Diode)
            // Zustand F (-): Fehlerzustand “Wallbox-Ausfall, keine Verbindung”

            this.eventEmitter.emit("onDeviceCPInformationRefreshed", data);
        } catch (error: any) {
            this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
        }
    };

    private getDeviceMetering = async (): Promise<void> => {
        await this.instance
            .get<DeviceMetering>("/api/secc/port0/metering/power/active_total")
            .then((resp) => {
                this.log.debug(JSON.stringify(resp.data));

                this.eventEmitter.emit("onDeviceMeteringRefreshed", resp.data);
            })
            .catch((error) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);
            });
    };
}
