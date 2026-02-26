const FMCSA_BASE_URL = 'https://mobile.fmcsa.dot.gov/qc/services';
const WEB_KEY = process.env.NEXT_PUBLIC_FMCSA_WEB_KEY || 'd6037fd9d684ef028874dd9e14b69ca3e0d0b9bd';

export interface FMCSACarrier {
    legalName: string;
    dotNumber: string;
    mcNumber?: string;
    phoneNumber?: string;
    emailAddress?: string;
    carrierOperationDesc?: string;
    phyCity?: string;
    phyState?: string;
    phyZipcode?: string;
    phyStreet?: string;
    statusCode?: string;
    allowedToOperate?: string;
    commonAuthorityStatus?: string;
    contractAuthorityStatus?: string;
    brokerAuthorityStatus?: string;
    vehicleOosRate?: number;
    vehicleOosRateNationalAverage?: string | number;
    driverOosRate?: number;
    driverOosRateNationalAverage?: string | number;
    carrierOperation?: {
        carrierOperationCode?: string;
        carrierOperationDesc?: string;
    };
}

export async function getCarrierByDot(dotNumber: string): Promise<FMCSACarrier | null> {
    try {
        const response = await fetch(`${FMCSA_BASE_URL}/carriers/${dotNumber}?webKey=${WEB_KEY}`);

        if (response.status === 403) {
            console.error('FMCSA API Access Denied (403). Ensure your VPN is connected to a supported region (e.g., USA).');
            throw new Error('Verification access denied.');
        }

        if (!response.ok) {
            console.error(`FMCSA API Error: ${response.status} ${response.statusText}`);
            throw new Error('Failed to fetch from FMCSA');
        }

        const data = await response.json();
        console.log('[FMCSA RAW DOT RESPONSE]', data);

        if (data.record) {
            return data.record;
        }
        if (data.content && data.content.carrier) {
            return data.content.carrier;
        }
        if (Array.isArray(data.content) && data.content.length > 0) {
            return data.content[0];
        }
        return null;
    } catch (error) {
        console.error('FMCSA API Error:', error);
        throw error;
    }
}

export async function getCarrierByMc(mcNumber: string): Promise<FMCSACarrier | null> {
    try {
        // Remove MC- prefix if present
        const cleanMc = mcNumber.toUpperCase().replace('MC-', '').replace('MC', '').trim();
        const response = await fetch(`${FMCSA_BASE_URL}/carriers/docket-number/${cleanMc}?webKey=${WEB_KEY}`);

        if (response.status === 403) {
            console.error('FMCSA API Access Denied (403). Ensure your VPN is connected to a supported region (e.g., USA).');
            throw new Error('Verification access denied. Please ensure your VPN is connected.');
        }

        if (!response.ok) {
            console.error(`FMCSA API Error: ${response.status} ${response.statusText}`);
            throw new Error('Failed to fetch from FMCSA');
        }

        const data = await response.json();
        // The API might return multiple or wrapped in a list, based on the endpoint
        if (data.record) {
            return data.record;
        }
        if (Array.isArray(data.content) && data.content.length > 0) {
            return data.content[0];
        }
        return null;
    } catch (error) {
        console.error('FMCSA API Error:', error);
        throw error;
    }
}

export async function getCarrierByName(name: string): Promise<FMCSACarrier[]> {
    try {
        const response = await fetch(`${FMCSA_BASE_URL}/carriers/name/${encodeURIComponent(name)}?webKey=${WEB_KEY}`);
        if (!response.ok) throw new Error('Failed to fetch from FMCSA');

        const data = await response.json();
        return Array.isArray(data.content) ? data.content : [];
    } catch (error) {
        console.error('FMCSA API Error:', error);
        throw error;
    }
}
