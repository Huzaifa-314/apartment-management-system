import React, { useState } from 'react';
import { Brain, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';
import Card from '../shared/Card';

const DashboardAI: React.FC = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis] = useState<string[]>([
    "Occupancy rate is at 92% - performing above market average",
    "Rent collection rate of 95% indicates strong financial health",
    "3 maintenance requests require immediate attention",
    "Revenue has increased by 15% compared to last quarter",
    "Suggested action: Schedule preventive maintenance for AC units"
  ]);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-6 w-6 text-purple-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">AI Dashboard Analysis</h2>
        </div>
        <button
          onClick={handleAnalyze}
          className={`px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors ${
            isAnalyzing ? 'opacity-75 cursor-wait' : ''
          }`}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
        </button>
      </div>

      <div className="space-y-4">
        {analysis.map((insight, index) => (
          <div
            key={index}
            className="flex items-start p-4 bg-white rounded-lg shadow-sm border border-purple-100"
          >
            {index === 0 ? (
              <BarChart2 className="h-5 w-5 text-purple-500 mt-0.5 mr-3" />
            ) : index === 1 ? (
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
            )}
            <p className="text-gray-800">{insight}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-purple-50 rounded-lg">
        <p className="text-sm text-purple-700">
          AI analysis is updated in real-time based on your dashboard metrics and historical data.
        </p>
      </div>
    </Card>
  );
};

export default DashboardAI;