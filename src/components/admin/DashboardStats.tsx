import React from 'react';
import Card from '../shared/Card';
import { Building2, Users, CircleDollarSign, AlertCircle } from 'lucide-react';
import { FinancialSummary } from '../../types';

interface DashboardStatsProps {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  maintenanceRooms: number;
  totalTenants: number;
  financialSummary: FinancialSummary;
  pendingComplaints: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalRooms,
  occupiedRooms,
  vacantRooms,
  maintenanceRooms,
  totalTenants,
  financialSummary,
  pendingComplaints,
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Room Statistics */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-start">
          <div className="p-3 bg-blue-500 rounded-lg">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Rooms</h3>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-blue-600">{totalRooms}</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-gray-500">Occupied</p>
                  <p className="font-medium">{occupiedRooms}</p>
                </div>
                <div>
                  <p className="text-gray-500">Vacant</p>
                  <p className="font-medium">{vacantRooms}</p>
                </div>
                <div>
                  <p className="text-gray-500">Maintenance</p>
                  <p className="font-medium">{maintenanceRooms}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tenant Statistics */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <div className="flex items-start">
          <div className="p-3 bg-amber-500 rounded-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Tenants</h3>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-amber-600">{totalTenants}</p>
              <div className="mt-2 text-sm">
                <p className="text-gray-500">Occupancy Rate</p>
                <p className="font-medium">{financialSummary.occupancyRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Financial Statistics */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-start">
          <div className="p-3 bg-green-500 rounded-lg">
            <CircleDollarSign className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Revenue</h3>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-green-600">{formatCurrency(financialSummary.totalRevenue)}</p>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <p className="text-gray-500">Pending</p>
                  <p className="font-medium">{formatCurrency(financialSummary.pendingAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Collection Rate</p>
                  <p className="font-medium">{financialSummary.collectionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Complaint Statistics */}
      <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
        <div className="flex items-start">
          <div className="p-3 bg-red-500 rounded-lg">
            <AlertCircle className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-800">Complaints</h3>
            <div className="flex flex-col mt-2">
              <p className="text-3xl font-bold text-red-600">{pendingComplaints}</p>
              <div className="mt-2 text-sm">
                <p className="text-gray-500">Pending Resolution</p>
                <p className="font-medium">Requires Attention</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DashboardStats;