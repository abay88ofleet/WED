import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/useDocumentStore';
import { useDocumentInit } from '../hooks/useDocumentInit';
import { Loader2, FileText, Upload, Search, Settings, FileStack, Printer, Home, Scan, File as FileEdit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AdvancedSearchModal } from '../components/AdvancedSearchModal';
import { UploadModal } from '../components/UploadModal';
import { PerformanceWidget } from '../components/dashboard/PerformanceWidget';

export const DashboardPage: React.FC = () => {
  useDocumentInit();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    documents,
    isLoading,
    isUploadModalOpen,
    setUploadModalOpen,
    setSearchQuery,
  } = useDocumentStore();
  const [isSoftCopyMode, setIsSoftCopyMode] = useState(false);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  const totalDocuments = documents.length;

  const scannedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return documents.filter(doc => {
      const docDate = new Date(doc.uploadedAt);
      docDate.setHours(0, 0, 0, 0);
      return docDate.getTime() === today.getTime();
    }).length;
  }, [documents]);

  const storageUsed = useMemo(() => {
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    const maxStorage = 100 * 1024 * 1024 * 1024;
    return Math.round((totalSize / maxStorage) * 100);
  }, [documents]);

  const recentActivity = useMemo(() => {
    return documents
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 3)
      .map(doc => ({
        id: doc.id,
        time: new Date(doc.uploadedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        description: `${doc.fileName} uploaded by ${user?.email?.split('@')[0] || 'User'}`,
      }));
  }, [documents, user]);

  const dailyScansData = useMemo(() => {
    const data = [];
    for (let i = 49; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const count = documents.filter(doc => {
        const docDate = new Date(doc.uploadedAt);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === date.getTime();
      }).length;

      data.push(count);
    }
    return data;
  }, [documents]);

  const documentAnalytics = useMemo(() => {
    const last6Days = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const count = documents.filter(doc => {
        const docDate = new Date(doc.uploadedAt);
        docDate.setHours(0, 0, 0, 0);
        return docDate.getTime() === date.getTime();
      }).length;

      last6Days.push(count);
    }
    return last6Days;
  }, [documents]);

  const maxAnalyticsValue = Math.max(...documentAnalytics, 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24">
      <div className="max-w-[1600px] mx-auto px-4 py-4 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">System Status</h2>

            <div className="flex items-center justify-between gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (1 - storageUsed / 100)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-xl font-bold text-gray-900">{storageUsed}%</div>
                  <div className="text-[10px] text-gray-600">Storage Used</div>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{totalDocuments.toLocaleString()}</div>
                  <div className="text-xs text-gray-600">Documents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{scannedToday}</div>
                  <div className="text-xs text-gray-600">Scanned Today</div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => navigate('/upload')}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Scan physical documents and upload them to your archive"
              >
                <Printer className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Scan & Upload</span>
              </button>

              <button
                onClick={() => {
                  setIsSoftCopyMode(true);
                  setUploadModalOpen(true);
                }}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Upload editable document templates (Word, Excel, etc.) for download only"
              >
                <FileEdit className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Upload (Soft Copy)</span>
              </button>

              <button
                onClick={() => {
                  setIsSoftCopyMode(false);
                  setUploadModalOpen(true);
                }}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Upload digital documents from your computer or cloud storage"
              >
                <Upload className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Upload Files</span>
              </button>

              <button
                onClick={() => setIsAdvancedSearchOpen(true)}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Search documents with advanced filters and fuzzy matching"
              >
                <Search className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Search</span>
              </button>

              <button
                onClick={() => navigate('/upload')}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Scan documents with edge detection and auto-cropping"
              >
                <Scan className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Scan</span>
              </button>

              <button
                onClick={() => navigate('/settings')}
                className="group relative flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configure application settings and preferences"
              >
                <Settings className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-normal text-gray-900">Settings</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Activity</h2>

            <div className="space-y-2.5">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-900 min-w-[45px]">
                      {activity.time}
                    </span>
                    <span className="text-xs text-gray-700">{activity.description}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500">No recent activity</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              DAILY SCANS (LAST 50 DAYS)
            </h2>

            <div className="h-32 flex items-end justify-center">
              <svg width="100%" height="100%" viewBox="0 0 400 128" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  points={dailyScansData.map((value, index) => {
                    const x = (index / (dailyScansData.length - 1)) * 400;
                    const maxValue = Math.max(...dailyScansData, 1);
                    const y = 128 - (value / maxValue) * 108;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Document Analytics</h2>

            <div className="h-36 flex items-end justify-between gap-2 mb-4">
              {documentAnalytics.map((value, index) => (
                <div
                  key={index}
                  className="flex-1 bg-blue-600 rounded-t"
                  style={{
                    height: `${(value / maxAnalyticsValue) * 100}%`,
                    minHeight: value > 0 ? '16px' : '0px',
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-900">Approve</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-900">Assign</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-900">Reject</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Pending Workflows</h2>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Approve Client Onboardeling Docs</span>
              </div>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">Categorize Old Blueprints</span>
              </div>
            </div>
          </div>

          <PerformanceWidget />
        </div>

        <AdvancedSearchModal
          isOpen={isAdvancedSearchOpen}
          onClose={() => setIsAdvancedSearchOpen(false)}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setIsSoftCopyMode(false);
          }}
          initialSoftCopyMode={isSoftCopyMode}
        />
      </div>
    </div>
  );
};
