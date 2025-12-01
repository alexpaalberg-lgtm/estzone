// DPD Estonia API Integration Service
// API Documentation: https://www.dpd.com/ee/en/business-customers/dpd-api/
// Requires: DPD_API_KEY environment variable

import type { ParcelTerminal, TrackingInfo, TrackingEvent } from '../utils/shipping';

const DPD_API_BASE = 'https://api.dpd.ee/v1';

interface DPDConfig {
  apiKey: string;
  testMode: boolean;
}

interface DPDParcelShop {
  parcelshop_id: string;
  name: string;
  street: string;
  city: string;
  pcode: string;
  country: string;
  latitude?: string;
  longitude?: string;
  opening_hours?: string;
}

interface DPDShipmentRequest {
  sender: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
    email: string;
  };
  receiver: {
    name: string;
    street: string;
    city: string;
    postal_code: string;
    country: string;
    phone: string;
    email: string;
  };
  parcels: {
    weight: number;
    content: string;
  }[];
  product: 'classic' | 'express' | 'pickup';
  parcelshop_id?: string;
}

interface DPDShipmentResponse {
  shipment_id: string;
  tracking_number: string;
  label_url: string;
}

class DPDService {
  private config: DPDConfig;

  constructor() {
    this.config = {
      apiKey: process.env.DPD_API_KEY || '',
      testMode: !process.env.DPD_API_KEY,
    };
  }

  private get isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  async getPickupPoints(country: string = 'EE', city?: string): Promise<ParcelTerminal[]> {
    if (!this.isConfigured) {
      console.log('[DPD] API not configured, returning mock pickup points');
      return this.getMockPickupPoints(country, city);
    }

    try {
      const params = new URLSearchParams({ country });
      if (city) params.append('city', city);

      const response = await fetch(`${DPD_API_BASE}/parcelshops?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DPD API error: ${response.status}`);
      }

      const data = await response.json() as { parcelshops: DPDParcelShop[] };
      
      return data.parcelshops.map((shop): ParcelTerminal => ({
        id: shop.parcelshop_id,
        name: shop.name,
        address: shop.street,
        city: shop.city,
        postalCode: shop.pcode,
        country: shop.country,
        coordinates: shop.latitude && shop.longitude 
          ? { lat: parseFloat(shop.latitude), lng: parseFloat(shop.longitude) }
          : undefined,
        openingHours: shop.opening_hours,
      }));
    } catch (error) {
      console.error('[DPD] Failed to fetch pickup points:', error);
      return this.getMockPickupPoints(country, city);
    }
  }

  async createShipment(order: any, pickupPointId?: string): Promise<DPDShipmentResponse> {
    if (!this.isConfigured) {
      console.log('[DPD] API not configured, returning mock shipment');
      return {
        shipment_id: `MOCK-${Date.now()}`,
        tracking_number: `DPD${Date.now()}`,
        label_url: '',
      };
    }

    const shipmentData: DPDShipmentRequest = {
      sender: {
        name: 'EstZone OÜ',
        street: 'Rävala pst 8',
        city: 'Tallinn',
        postal_code: '10143',
        country: 'EE',
        phone: '+372 5555 5555',
        email: 'orders@estzone.eu',
      },
      receiver: {
        name: `${order.shippingFirstName} ${order.shippingLastName}`,
        street: order.shippingStreet,
        city: order.shippingCity,
        postal_code: order.shippingPostalCode,
        country: order.shippingCountry || 'EE',
        phone: order.shippingPhone,
        email: order.customerEmail,
      },
      parcels: [{
        weight: 1.0,
        content: 'Gaming products',
      }],
      product: pickupPointId ? 'pickup' : 'classic',
    };

    if (pickupPointId) {
      shipmentData.parcelshop_id = pickupPointId;
    }

    try {
      const response = await fetch(`${DPD_API_BASE}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (!response.ok) {
        throw new Error(`DPD API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[DPD] Failed to create shipment:', error);
      throw error;
    }
  }

  async getTracking(trackingNumber: string): Promise<TrackingInfo> {
    if (!this.isConfigured) {
      return {
        carrier: 'DPD',
        trackingNumber,
        status: 'In Transit',
        statusEt: 'Teel',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        lastUpdate: new Date().toISOString(),
        events: [],
      };
    }

    try {
      const response = await fetch(`${DPD_API_BASE}/tracking/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`DPD API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        carrier: 'DPD',
        trackingNumber,
        status: data.status || 'Unknown',
        statusEt: this.translateStatus(data.status),
        estimatedDelivery: data.estimated_delivery,
        lastUpdate: data.last_update,
        events: (data.events || []).map((e: any): TrackingEvent => ({
          timestamp: e.timestamp,
          location: e.location,
          status: e.status,
          statusEt: this.translateStatus(e.status),
        })),
      };
    } catch (error) {
      console.error('[DPD] Failed to get tracking:', error);
      throw error;
    }
  }

  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'Collected': 'Korjatud',
      'In Transit': 'Teel',
      'Out for Delivery': 'Kohaletoimetus',
      'Delivered': 'Kohale toimetatud',
      'Ready for Pickup': 'Kättesaadav',
      'Returned': 'Tagastatud',
    };
    return translations[status] || status;
  }

  private getMockPickupPoints(country: string, city?: string): ParcelTerminal[] {
    const mockPoints: ParcelTerminal[] = [
      {
        id: 'dpd-tallinn-1',
        name: 'DPD Pakipunkt Kristiine',
        address: 'Endla 45',
        city: 'Tallinn',
        postalCode: '10615',
        country: 'EE',
        coordinates: { lat: 59.4289, lng: 24.7199 },
        openingHours: 'E-P 8:00-22:00',
      },
      {
        id: 'dpd-tallinn-2',
        name: 'DPD Pakipunkt Ülemiste',
        address: 'Suur-Sõjamäe 4',
        city: 'Tallinn',
        postalCode: '11415',
        country: 'EE',
        coordinates: { lat: 59.4216, lng: 24.7980 },
        openingHours: 'E-P 10:00-21:00',
      },
      {
        id: 'dpd-tartu-1',
        name: 'DPD Pakipunkt Tasku',
        address: 'Turu 2',
        city: 'Tartu',
        postalCode: '51004',
        country: 'EE',
        coordinates: { lat: 58.3781, lng: 26.7250 },
        openingHours: 'E-P 9:00-21:00',
      },
      {
        id: 'dpd-parnu-1',
        name: 'DPD Pakipunkt Port Artur 2',
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

export const dpdService = new DPDService();
export default dpdService;
