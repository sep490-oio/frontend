import { Outlet } from 'react-router-dom';
import './WarehouseLayout.scss';

export function WarehouseLayout() {
    return (
        <div className="warehouse-layout">
            <Outlet />
        </div>
    );
}
