// DHL Estonia API Integration Service
// API Documentation: https://developer.dhl.com/api-reference/
// Requires: DHL_API_KEY environment variable

import type { ParcelTerminal, TrackingInfo, TrackingEvent } from '../utils/shipping';

const DHL_API_BASE = 'https://api-eu.dhl.com';

interface DHLConfig {
  apiKey: string;
  testMode: boolean;
}

interface DHLServicePoint {
  id: string;
  name: string;
  address: {
    streetAddress: string;
    city: string;
    postalCode: string;
    countryCode: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string;
}

interface DHLShipmentRequest {
  shipper: {
    name: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    email: string;
  };
  receiver: {
    name: string;
    streetAddress: string;
    city: string;
    postalCode: string;
    countryCode: string;
    phone: string;
    email: string;
  };
  packages: {
    weight: number;
    dimensions?: { length: number; width: number; height: number };
    description: string;
  }[];
  product: 'express' | 'parcel';
  servicePointId?: string;
}

interface DHLShipmentResponse {
  shipmentId: string;
  trackingNumber: string;
  labelUrl: string;
}

class DHLService {
  private config: DHLConfig;

  constructor() {
    this.config = {
      apiKey: process.env.DHL_API_KEY || '',
      testMode: !process.env.DHL_API_KEY,
    };
  }

  private get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async getServicePoints(country: string = 'EE', city?: string): Promise<ParcelTerminal[]> {
    if (!this.isConfigured) {
      console.log('[DHL] API not configured, returning mock service points');
      return this.getMockServicePoints(country, city);
    }

    try {
      const params = new URLSearchParams({ countryCode: country });
      if (city) params.append('city', city);

      const response = await fetch(`${DHL_API_BASE}/location-finder/v1/find-by-address?${params}`, {
        headers: {
          'DHL-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status}`);
      }

      const data = await response.json() as { locations: DHLServicePoint[] };
      
      return data.locations.map((point): ParcelTerminal => ({
        id: point.id,
        name: point.name,
        address: point.address.streetAddress,
        city: point.address.city,
        postalCode: point.address.postalCode,
        country: point.address.countryCode,
        coordinates: point.geo 
          ? { lat: point.geo.latitude, lng: point.geo.longitude }
          : undefined,
        openingHours: point.openingHours,
      }));
    } catch (error) {
      console.error('[DHL] Failed to fetch service points:', error);
      return this.getMockServicePoints(country, city);
    }
  }

  async createShipment(order: any, servicePointId?: string): Promise<DHLShipmentResponse> {
    if (!this.isConfigured) {
      console.log('[DHL] API not configured, returning mock shipment');
      return {
        shipmentId: `MOCK-${Date.now()}`,
        trackingNumber: `DHL${Date.now()}`,
        labelUrl: '',
      };
    }

    const shipmentData: DHLShipmentRequest = {
      shipper: {
        name: 'EstZone OÜ',
        streetAddress: 'Rävala pst 8',
        city: 'Tallinn',
        postalCode: '10143',
        countryCode: 'EE',
        phone: '+372 5555 5555',
        email: 'orders@estzone.eu',
      },
      receiver: {
        name: `${order.shippingFirstName} ${order.shippingLastName}`,
        streetAddress: order.shippingStreet,
        city: order.shippingCity,
        postalCode: order.shippingPostalCode,
        countryCode: order.shippingCountry || 'EE',
        phone: order.shippingPhone,
        email: order.customerEmail,
      },
      packages: [{
        weight: 1.0,
        description: 'Gaming products',
      }],
      product: servicePointId ? 'parcel' : 'express',
    };

    if (servicePointId) {
      shipmentData.servicePointId = servicePointId;
    }

    try {
      const response = await fetch(`${DHL_API_BASE}/shipping/v1/shipments`, {
        method: 'POST',
        headers: {
          'DHL-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DHL] Failed to create shipment:', error);
      throw error;
    }
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    if (!this.isConfigured) {
      return {
        carrier: 'DHL',
        trackingNumber,
        status: 'In Transit',
        statusEt: 'Teel',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdate: new Date().toISOString(),
        events: [],
      };
    }

    try {
      const response = await fetch(`${DHL_API_BASE}/track/shipments?trackingNumber=${trackingNumber}`, {
        headers: {
          'DHL-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DHL API error: ${response.status}`);
      }

      const data = await response.json();
      const shipment = data.shipments?.[0];
      
      return {
        carrier: 'DHL',
        trackingNumber,
        status: shipment?.status?.description || 'Unknown',
        statusEt: this.translateStatus(shipment?.status?.description),
        estimatedDelivery: shipment?.estimatedTimeOfDelivery,
        lastUpdate: shipment?.status?.timestamp,
        events: (shipment?.events || []).map((e: any): TrackingEvent => ({
          timestamp: e.timestamp,
          location: e.location?.address?.addressLocality || '',
          status: e.description,
          statusEt: this.translateStatus(e.description),
        })),
      };
    } catch (error) {
      console.error('[DHL] Failed to get tracking:', error);
      throw error;
    }
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'Shipment picked up': 'Saadetis võetud vastu',
      'In transit': 'Teel',
      'Out for delivery': 'Kohaletoimetus',
      'Delivered': 'Kohale toimetatud',
      'At Service Point': 'Pakipunktis',
      'Returned': 'Tagastatud',
    };
    return translations[status] || status;
  }

  private getMockServicePoints(country: string, city?: string): ParcelTerminal[] {
    const mockPoints: ParcelTerminal[] = [
      {
        id: 'dhl-tallinn-1',
        name: 'DHL ServicePoint Kristiine',
        address: 'Endla 45',
        city: 'Tallinn',
        postalCode: '10615',
        country: 'EE',
        coordinates: { lat: 59.4289, lng: 24.7199 },
        openingHours: 'E-P 8:00-22:00',
      },
      {
        id: 'dhl-tallinn-2',
        name: 'DHL ServicePoint Ülemiste',
        address: 'Suur-Sõjamäe 4',
        city: 'Tallinn',
        postalCode: '11415',
        country: 'EE',
        coordinates: { lat: 59.4216, lng: 24.7980 },
        openingHours: 'E-P 10:00-21:00',
      },
      {
        id: 'dhl-tartu-1',
        name: 'DHL ServicePoint Tasku',
        address: 'Turu 2',
        city: 'Tartu',
        postalCode: '51004',
        country: 'EE',
        coordinates: { lat: 58.3781, lng: 26.7250 },
        openingHours: 'E-P 9:00-21:00',
      },
      {
        id: 'dhl-parnu-1',
        name: 'DHL ServicePoint Port Artur',
        address: 'Lai 8',
        city: 'Pärnu',
        postalCode: '80010',
        country: 'EE',
        coordinates: { lat: 58.3858, lng: 24.5024 },
        openingHours: 'E-P 9:00-21:00',
      },
    ];

    if (city) {
      return mockPoints.filter(p => p.city.toLowerCase() === city.toLowerCase());
    }
    return mockPoints.filter(p => p.country === country);
  }
}

export const dhlService = new DHLService();
export default dhlService;
