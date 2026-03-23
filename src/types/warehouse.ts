/**
 * Warehouse & Logistics Types
 */

export interface Zone {
    id: string;
    name: string;
    icon: string;
    iconBg: string;
    iconColor: string;
    category: string;
    capacity: string;
    capacityPercent: number;
    status: 'available' | 'nearly-full' | 'full';
    time: string;
    items?: number;
}

export interface BinLocation {
    id: string;
    status: 'filled' | 'filled-high' | 'filled-medium' | 'filled-low' | 'warning' | 'selected' | 'empty';
    label: string;
    capacity?: number;
    items?: string[];
}

export interface ShipmentActivity {
    id: number;
    shipmentId: string;
    title: string;
    subtitle: string;
    status: 'received' | 'inspecting' | 'pending' | 'processing' | 'completed';
    statusLabel: string;
    statusColor: string;
    time: string;
    timestamp: Date;
}

export interface WarehouseMetrics {
    totalUnits: number;
    totalUnitsChange: number;
    activeBins: number;
    activeBinsChange: number;
    inspecting: number;
    inspectingChange: number;
    todayShipments: number;
    todayShipmentsChange: number;
}

export interface WarehouseStats {
    storageEfficiency: number;
    utilizationRate: number;
    activeZones: number;
    totalZones: number;
}
