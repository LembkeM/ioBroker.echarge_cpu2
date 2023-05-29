export interface Root {
    salia: Salia;
    ci: Ci;
    session: Session;
    contactor: Contactor2;
    metering: Metering;
    emergency_shutdown: string;
    rcd: Rcd;
    plug_lock: PlugLock;
    availability: Availability;
    cp: Cp2;
    diode_present: string;
    ev_present: string;
    charging: string;
    cable_current_limit: string;
    rfid: Rfid;
    ready_for_slac: string;
    ventilation: Ventilation;
    grid_current_limit: string;
    charging_stop: string;
}

export interface Salia {
    chargemode: string;
    keyswitch: string;
    mem: string;
    uptime: string;
    load: string;
    mains: string;
    mains_l1_current: string;
    mains_l2_current: string;
    mains_l3_current: string;
    mains_l1_power: string;
    mains_l2_power: string;
    mains_l3_power: string;
    chargedata: string;
    ecoplus: string;
    mains_type: string;
    authmode: string;
    firmwareprogress: string;
    firmwarestate: string;
    firmwaremessage: string;
    firmwareresult: string;
    status: string;
    tc_enabled: string;
    thermal: string;
    limit_tc: string;
    pausecharging: string;
}

export interface Ci {
    evse: Evse;
    charge: Charge;
}

export interface Evse {
    basic: Basic;
    phase: Phase;
}

export interface Basic {
    grid_current_limit: GridCurrentLimit;
    phase_count: string;
    physical_current_limit: string;
    offered_current_limit: string;
    current: Current;
    power: Power;
}

export interface GridCurrentLimit {
    actual: string;
}

export interface Current {
    offered: string;
    l1: L1;
    l2: L2;
    l3: L3;
}

export interface L1 {
    offered: number;
}

export interface L2 {
    offered: number;
}

export interface L3 {
    offered: number;
}

export interface Power {
    offered: number;
}

export interface Phase {
    actual: string;
}

export interface Charge {
    cp: Cp;
    plug: Plug;
    contactor: Contactor;
    pwm: Pwm;
}

export interface Cp {
    status: string;
}

export interface Plug {
    status: string;
}

export interface Contactor {
    status: string;
}

export interface Pwm {
    status: string;
}

export interface Session {
    authorization_status: string;
    authorization_method: string;
}

export interface Contactor2 {
    state: State;
    error: string;
}

export interface State {
    hlc_target: string;
    actual: string;
    target: string;
}

export interface Metering {
    meter: Meter;
    energy: Energy;
    power: Power2;
    current: Current2;
}

export interface Meter {
    available: boolean;
}

export interface Energy {
    active_total: ActiveTotal;
}

export interface ActiveTotal {
    actual: number;
}

export interface Power2 {
    active_total: ActiveTotal2;
    active: Active;
}

export interface ActiveTotal2 {
    actual: number;
}

export interface Active {
    ac: Ac;
}

export interface Ac {
    l1: L12;
    l2: L22;
    l3: L32;
}

export interface L12 {
    actual: number;
}

export interface L22 {
    actual: number;
}

export interface L32 {
    actual: number;
}

export interface Current2 {
    ac: Ac2;
}

export interface Ac2 {
    l1: L13;
    l2: L23;
    l3: L33;
}

export interface L13 {
    actual: number;
}

export interface L23 {
    actual: number;
}

export interface L33 {
    actual: number;
}

export interface Rcd {
    feedback: Feedback;
    state: State2;
    recloser: Recloser;
}

export interface Feedback {
    available: string;
}

export interface State2 {
    actual: string;
}

export interface Recloser {
    available: string;
}

export interface PlugLock {
    state: State3;
    error: string;
}

export interface State3 {
    actual: string;
    target: string;
}

export interface Availability {
    actual: string;
}

export interface Cp2 {
    pwm_state: PwmState;
    state: string;
    duty_cycle: string;
}

export interface PwmState {
    actual: string;
}

export interface Rfid {
    type: string;
    available: string;
    authorizereq: string;
    authorization_request: string;
}

export interface Ventilation {
    state: State4;
    available: string;
}

export interface State4 {
    actual: string;
}
