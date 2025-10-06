import React from 'react';
import { BarChart3, TrendingUp, FileText, Users, Calendar, Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const pendingWorkflows = [
    { id: 1, title: 'Approve Client Onboarding Docs', status: 'approve' },
    { id: 2, title: 'Categorize Old Blueprints', status: 'assign' },
    { id: 3, title: 'Review Q1 Financial Reports', status: 'approve' },
  ];

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24">
      <div className="max-w-[1600px] mx-auto px-4 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Workflow & Reports</h1>
          <p className="text-sm text-gray-600">
            Track document workflows and generate analytics reports
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-500">This Month</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-xs text-gray-600">Documents Processed</p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>12% increase</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-500">Active</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-gray-900">24</p>
              <p className="text-xs text-gray-600">Active Workflows</p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>8% increase</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs text-gray-500">Average</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-2xl font-bold text-gray-900">2.4</p>
              <p className="text-xs text-gray-600">Days to Process</p>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="w-3 h-3" />
                <span>15% faster</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Pending Workflows</h2>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                <span className="text-xs text-gray-600">Approve</span>
                <span className="w-2 h-2 bg-gray-400 rounded-full ml-2"></span>
                <span className="text-xs text-gray-600">Assign</span>
                <span className="w-2 h-2 bg-gray-300 rounded-full ml-2"></span>
                <span className="text-xs text-gray-600">Reject</span>
              </div>
            </div>

            <div className="space-y-2">
              {pendingWorkflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex-1 text-sm text-gray-900">{workflow.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Document Analytics</h2>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">PDF Documents</span>
                  <span className="font-semibold text-gray-900">45%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '45%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Word Documents</span>
                  <span className="font-semibold text-gray-900">30%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Spreadsheets</span>
                  <span className="font-semibold text-gray-900">15%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '15%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-600">Other</span>
                  <span className="font-semibold text-gray-900">10%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-400" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
