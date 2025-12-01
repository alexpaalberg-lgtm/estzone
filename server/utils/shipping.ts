// Shipping provider integrations for EstZone

export type ShippingCarrier = 'omniva' | 'dpd' | 'dhl';
export type ShippingMethodId = 'omniva_terminal' | 'omniva_courier' | 'dpd_pickup' | 'dpd_courier';

export interface ShippingOption {
  id: ShippingMethodId;
  carrier: ShippingCarrier;
  name: string;
  nameEn: string;
  cost: number;
  estimatedDays: string;
  type: 'terminal' | 'pickup' | 'courier';
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  statusEt?: string;
  estimatedDelivery?: string;
  lastUpdate?: string;
  events?: TrackingEvent[];
}

export interface TrackingEvent {
  timestamp: string;
  location: string;
  status: string;
  statusEt?: string;
}

export interface ParcelTerminal {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  openingHours?: string;
}

export const shippingOptions: ShippingOption[] = [
  {
    id: 'omniva_terminal',
    carrier: 'omniva',
    name: 'Omniva Pakiautomaat',
    nameEn: 'Omniva Parcel Terminal',
    cost: 2.99,
    estimatedDays: '2-4',
    type: 'terminal',
  },
  {
    id: 'omniva_courier',
    carrier: 'omniva',
    name: 'Omniva Kuller',
    nameEn: 'Omniva Courier',
    cost: 4.99,
    estimatedDays: '1-2',
    type: 'courier',
  },
  {
    id: 'dpd_pickup',
    carrier: 'dpd',
    name: 'DPD Pakipunkt',
    nameEn: 'DPD Pickup Point',
    cost: 3.49,
    estimatedDays: '2-3',
    type: 'pickup',
  },
  {
    id: 'dpd_courier',
    carrier: 'dpd',
    name: 'DPD Kuller',
    nameEn: 'DPD Home Delivery',
    cost: 5.99,
    estimatedDays: '1-2',
    type: 'courier',
  },
];

export function getShippingOptions(): ShippingOption[] {
  return shippingOptions;
}

export function getShippingOptionById(id: string): ShippingOption | undefined {
  return shippingOptions.find(opt => opt.id === id);
}

export function getCarrierFromMethod(methodId: string): ShippingCarrier {
  if (methodId.startsWith('omniva')) return 'omniva';
  if (methodId.startsWith('dpd')) return 'dpd';
  if (methodId.startsWith('dhl')) return 'dhl';
  return 'dpd';
}

export function getShippingCost(methodId: string): number {
  const option = getShippingOptionById(methodId);
  return option?.cost ?? 5.99;
}

export async function createOmnivaShipment(order: any): Promise<string> {
  console.log('[OMNIVA] Creating shipment for order', order.id);
  return `OMN${Date.now()}`;
}

export async function createDPDShipment(order: any): Promise<string> {
  console.log('[DPD] Creating shipment for order', order.id);
  return `DPD${Date.now()}`;
}

export async function getTrackingInfo(carrier: string, trackingNumber: string): Promise<TrackingInfo> {
  return {
    carrier,
    trackingNumber,
    status: 'In Transit',
    statusEt: 'Teel',
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdate: new Date().toISOString(),
  };
}
