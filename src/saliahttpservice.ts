import { ping } from "@network-utils/tcp-ping";
import axios, { AxiosInstance } from "axios";
import EventEmitter from "events";
import https from "https";
import { DeviceInformation } from "./types/DeviceInformation";
import { Cp2, Meter, Metering, Salia } from "./types/Root";

interface CancellableSleep {
    promise: Promise<void>;
    cancel(reason?: any): void;
}

export class SaliaHttpService {
    private readonly instance: AxiosInstance;

    private readonly log: ioBroker.Logger;
    private readonly eventEmitter: EventEmitter;

    private timeout?: CancellableSleep;

    private deviceUrl!: URL;
    private devicePort!: number;

    private deviceStatus: boolean;
    private deviceMeterAvailable: boolean;
    private deviceCPState!: string;

    public constructor(options: { baseURL: string; log: ioBroker.Logger; eventEmitter: EventEmitter }) {
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
        try {
            setInterval(async () => {
                // try to connect somethere
                this.log.debug("Connection attempt");

                await this.onlineCheck();

                if (this.deviceStatus) {
                    await this.getDeviceInfos();
                    await this.getDeviceCPInformation();

                    await this.getDeviceChargeData();

                    await this.getDeviceMetering();
                }
            }, 10000);
        } catch (e) {
            if (e instanceof Error) {
                this.log.error(e.message);
            }

            this.timeout = this.cancellableSleep(1000);
            await this.timeout.promise;
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
        await this.instance
            .get<DeviceInformation>("/api/device")
            .then((resp) => {
                // this.log.debug(JSON.stringify(resp.data));

                this.eventEmitter.emit("onDeviceInformationRefreshed", resp.data);
            })
            .catch((error: any) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);

                this.deviceStatus = false;
            });
    };

    private getDeviceCPInformation = async (): Promise<void> => {
        await this.instance
            .get<Cp2>("/api/secc/port0/cp")
            .then((resp) => {
                // this.log.debug(JSON.stringify(resp.data));

                // Zustand A (12V): Fahrzeug nicht angeschlossen und nicht ladebereit
                // Zustand B (9V/-12V): Fahrzeug angeschlossen, aber nicht ladebereit
                // Zustand C (6V/-12V): Fahrzeug angeschlossen und ladebereit
                // Zustand D (3V/-12V): Lüftungsanforderung
                // Zustand E (0V): Fehlerzustand “Kurzschluss” (CP-PE über Diode)
                // Zustand F (-): Fehlerzustand “Wallbox-Ausfall, keine Verbindung”

                this.deviceCPState = resp.data.state;
                this.eventEmitter.emit("onDeviceCPInformationRefreshed", resp.data);
            })
            .catch((error: any) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);

                this.deviceStatus = false;
            });
    };

    private getDeviceChargeData = async (): Promise<void> => {
        await this.instance
            .get<Salia>("/api/secc/port0/salia")
            .then((resp) => {
                //this.log.debug(JSON.stringify(resp.data));

                this.eventEmitter.emit("onDeviceChargeDataRefreshed", resp.data);
            })
            .catch((error: any) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);

                this.deviceStatus = false;
            });
    };

    private getDeviceMeterData = async (): Promise<boolean> => {
        await this.instance
            .get<Meter>("/api/secc/port0/metering/meter")
            .then((resp) => {
                this.log.debug(JSON.stringify(resp.data));

                this.eventEmitter.emit("onDeviceMeterRefreshed", resp.data);

                return resp.data.available;
            })
            .catch((error: any) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);

                this.deviceStatus = false;
            });

        return false;
    };

    private getDeviceMetering = async (): Promise<void> => {
        await this.instance
            .get<Metering>("/api/secc/port0/metering")
            .then((resp) => {
                this.log.debug(JSON.stringify(resp.data));

                this.deviceMeterAvailable = resp.data.meter.available;

                this.eventEmitter.emit("onDeviceMeteringRefreshed", resp.data);
            })
            .catch((error: any) => {
                this.log.error(`[onReady] error: ${error.message}, stack: ${error.stack}`);

                this.deviceStatus = false;
            });
    };
}
