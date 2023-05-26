export interface DeviceInformation {
    product: number;
    modelname: string;
    hardware_version: string;
    software_version: string;
    vcs_version: string;
    hostname: string;
    mac_address: string;
    serial: string;
    uuid: string;
    internal_id: string;
    ip_lo: string;
    ip_br0fallback: string;
    ip_br0: string;
}
