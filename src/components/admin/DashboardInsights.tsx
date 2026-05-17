import React from 'react';
import { TrendingUp, AlertTriangle, CircleDollarSign, Building2 } from 'lucide-react';
import Card from '../shared/Card';
import { FinancialSummary } from '../../types';

type DashboardInsightsProps = {
  financialSummary: FinancialSummary;
  pendingComplaints: number;
  overduePaymentCount: number;
  highPriorityOpenComplaints: number;
  vacantRooms: number;
  maintenanceRooms: number;
};

function bullet(icon: React.ReactNode, text: string, key: number) {
  return (
    <div key={key} className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-slate-100">
      <div className="mt-0.5 mr-3 text-slate-500">{icon}</div>
      <p className="text-gray-800 text-sm leading-relaxed">{text}</p>
    </div>
  );
}

const DashboardInsights: React.FC<DashboardInsightsProps> = ({
  financialSummary,
  pendingComplaints,
  overduePaymentCount,
  highPriorityOpenComplaints,
  vacantRooms,
  maintenanceRooms,
}) => {
  const lines: Array<{ icon: React.ReactNode; text: string }> = [];

  lines.push({
    icon: <Building2 className="h-5 w-5" />,
    text: `Occupancy is ${financialSummary.occupancyRate.toFixed(1)}% across your portfolio${
      vacantRooms > 0 ? `; ${vacantRooms} room(s) are vacant` : ''
    }${maintenanceRooms > 0 ? ` and ${maintenanceRooms} in maintenance` : ''}.`,
  });

  lines.push({
    icon: <CircleDollarSign className="h-5 w-5" />,
    text: `Collection rate is ${financialSummary.collectionRate.toFixed(1)}% with ${financialSummary.pendingAmount.toLocaleString()} still pending${
      financialSummary.overdueAmount > 0
        ? ` and ${financialSummary.overdueAmount.toLocaleString()} overdue`
        : ''
    }.`,
  });

  if (overduePaymentCount > 0) {
    lines.push({
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      text: `${overduePaymentCount} payment record(s) are overdue — follow up from the Payments page.`,
    });
  }

  if (pendingComplaints > 0) {
    lines.push({
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      text: `${pendingComplaints} complaint(s) need attention (new or in progress).`,
    });
  } else {
    lines.push({
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      text: 'No open complaints in the new / in-progress queue.',
    });
  }

  if (highPriorityOpenComplaints > 0) {
    lines.push({
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      text: `${highPriorityOpenComplaints} high-priority complaint(s) are still open — review on the Complaints page.`,
    });
  }

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200">
      <div className="flex items-center mb-4">
        <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">Insights</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Generated from your live dashboard metrics and payment records.
      </p>
      <div className="space-y-3">{lines.map((l, i) => bullet(l.icon, l.text, i))}</div>
    </Card>
  );
};

export default DashboardInsights;
