export interface GlobalOptions {
  transport?: string;
}

export interface SpaceOptions extends GlobalOptions {
  space?: string;
}

export interface DeviceOptions extends GlobalOptions {
  type?: string;
  homeId?: string;
}
