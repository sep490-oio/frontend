/**
 * Custom hook for warehouse data management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Zone, BinLocation, ShipmentActivity, WarehouseMetrics } from '@/types/warehouse';

export const useWarehouse = () => {
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<WarehouseMetrics>({
        totalUnits: 124802,
        totalUnitsChange: 12,
        activeBins: 8421,
        activeBinsChange: 3,
        inspecting: 432,
        inspectingChange: -5,
        todayShipments: 1205,
        todayShipmentsChange: 6,
    });

    const [zones, setZones] = useState<Zone[]>([
        {
            id: 'Alpha-1',
            name: 'Sector Alpha-1',
            icon: '📦',
            iconBg: 'rgba(168, 85, 247, 0.2)',
            iconColor: '#A855F7',
            category: 'Hàng xa xỉ',
            capacity: '45%',
            capacityPercent: 45,
            status: 'available',
            time: '2 phút trước',
            items: 1250
        },
        {
            id: 'Vault-X',
            name: 'Sector Vault-X',
            icon: '🔒',
            iconBg: 'rgba(59, 130, 246, 0.2)',
            iconColor: '#3B82F6',
            category: 'Lưu trữ sâu',
            capacity: '92%',
            capacityPercent: 92,
            status: 'nearly-full',
            time: '12 phút trước',
            items: 3840
        },
        {
            id: 'Tech-9',
            name: 'Tech-Hangar 9',
            icon: '💻',
            iconBg: 'rgba(16, 185, 129, 0.2)',
            iconColor: '#10B981',
            category: 'Đã vỗ',
            capacity: '78%',
            capacityPercent: 78,
            status: 'available',
            time: 'Vừa xong',
            items: 2890
        }
    ]);

    const [binLocations, setBinLocations] = useState<BinLocation[]>([
        { id: 'A1', status: 'filled-high', label: 'A1', capacity: 95 },
        { id: 'A2', status: 'filled-medium', label: 'A2', capacity: 70 },
        { id: 'A3', status: 'empty', label: 'A3', capacity: 0 },
        { id: 'A4', status: 'filled', label: 'A4', capacity: 100 },
        { id: 'A5', status: 'filled-low', label: 'A5', capacity: 40 },
        { id: 'B1', status: 'warning', label: 'B1', capacity: 98 },
        { id: 'B2', status: 'empty', label: 'B2', capacity: 0 },
        { id: 'B3', status: 'filled', label: 'B3', capacity: 85 },
        { id: 'B4', status: 'filled', label: 'B4', capacity: 90 },
        { id: 'B5', status: 'empty', label: 'B5', capacity: 0 },
        { id: 'C1', status: 'filled', label: 'C1', capacity: 88 },
        { id: 'C2', status: 'filled', label: 'C2', capacity: 92 },
        { id: 'C3', status: 'filled', label: 'C3', capacity: 87 },
        { id: 'C4', status: 'empty', label: 'C4', capacity: 0 },
        { id: 'C5', status: 'filled', label: 'C5', capacity: 91 },
        { id: 'D1', status: 'selected', label: 'D1', capacity: 75 },
        { id: 'D2', status: 'filled', label: 'D2', capacity: 83 },
        { id: 'D3', status: 'filled', label: 'D3', capacity: 89 },
        { id: 'D4', status: 'filled', label: 'D4', capacity: 94 },
        { id: 'D5', status: 'filled', label: 'D5', capacity: 86 }
    ]);

    const [recentActivities, setRecentActivities] = useState<ShipmentActivity[]>([
        {
            id: 1,
            shipmentId: 'TR-9421',
            title: 'Shipment #TR-9421',
            subtitle: 'Nhà kho Cao',
            status: 'received',
            statusLabel: 'Đã nhập',
            statusColor: '#10B981',
            time: '5 phút trước',
            timestamp: new Date(Date.now() - 5 * 60 * 1000)
        },
        {
            id: 2,
            shipmentId: 'TR-9433',
            title: 'Shipment #TR-9433',
            subtitle: 'Nhà kho Cao',
            status: 'inspecting',
            statusLabel: 'ĐANG KIỂM TRA',
            statusColor: '#3B82F6',
            time: '12 phút trước',
            timestamp: new Date(Date.now() - 12 * 60 * 1000)
        },
        {
            id: 3,
            shipmentId: 'TR-9501',
            title: 'Shipment #TR-9501',
            subtitle: 'Nhà kho Cao',
            status: 'pending',
            statusLabel: 'CHỜ XỬ LÝ',
            statusColor: '#F59E0B',
            time: '25 phút trước',
            timestamp: new Date(Date.now() - 25 * 60 * 1000)
        }
    ]);

    const [selectedBin, setSelectedBin] = useState<string | null>('D1');
    const [viewMode, setViewMode] = useState<'filled' | 'empty'>('filled');

    const handleBinClick = (binId: string) => {
        setSelectedBin(binId === selectedBin ? null : binId);
    };

    const handleExportReport = () => {
        console.log('Exporting warehouse report...');
        // Implement export logic
    };

    const handleNewShipment = () => {
        navigate('/warehouse-logistics/new-shipment');
    };

    const filteredBins = viewMode === 'filled'
        ? binLocations.filter(bin => bin.status !== 'empty')
        : binLocations.filter(bin => bin.status === 'empty');

    return {
        metrics,
        zones,
        binLocations,
        recentActivities,
        selectedBin,
        viewMode,
        filteredBins,
        handleBinClick,
        handleExportReport,
        handleNewShipment,
        setViewMode,
    };
};
