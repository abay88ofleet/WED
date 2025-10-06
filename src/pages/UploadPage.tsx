import React, { useState } from 'react';
import { Upload, Scan, File, FolderPlus, Search, Settings as SettingsIcon, Printer, Check, X } from 'lucide-react';
import { useDocumentStore } from '../store/useDocumentStore';
import { UploadModal } from '../components/UploadModal';
import { processScannedImage, dataUrlToFile, getScanSettings, saveScanSettings, ScanSettings } from '../services/scanService';

export const UploadPage: React.FC = () => {
  const { setUploadModalOpen, isUploadModalOpen } = useDocumentStore();
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scannedFile, setScannedFile] = useState<File | null>(null);
  const [scanSettings, setScanSettingsState] = useState<ScanSettings>(getScanSettings());
  const [showSettings, setShowSettings] = useState(false);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(async () => {
      const simulatedScanUrl = 'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800';

      try {
        const processedImage = await processScannedImage(simulatedScanUrl, scanSettings);
        setScanPreview(processedImage);
        setIsScanning(false);
      } catch (error) {
        console.error('Error processing scanned image:', error);
        setScanPreview(simulatedScanUrl);
        setIsScanning(false);
      }
    }, 3000);
  };

  const handleSaveScan = async () => {
    if (scanPreview) {
      try {
        const fileName = `scanned-document-${Date.now()}.jpg`;
        const file = await dataUrlToFile(scanPreview, fileName);
        setScannedFile(file);
        setScanPreview(null);
        setScanProgress(0);
        setIsScanModalOpen(false);
        setUploadModalOpen(true);
      } catch (error) {
        console.error('Error converting scan to file:', error);
      }
    }
  };

  const handleCancelScan = () => {
    setScanPreview(null);
    setScanProgress(0);
    setIsScanModalOpen(false);
    setScannedFile(null);
    setShowSettings(false);
  };

  const handleSettingsChange = (key: keyof ScanSettings, value: any) => {
    const newSettings = { ...scanSettings, [key]: value };
    setScanSettingsState(newSettings);
    saveScanSettings(newSettings);
  };

  return (
    <div className="h-full bg-gray-50 overflow-y-auto pb-24 px-4 py-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Scan & Upload</h1>
          <p className="text-sm text-gray-600">
            Upload documents to your archive or scan new documents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg transition-all"
            aria-label="Open document scanner"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg group-hover:bg-blue-600 transition-colors">
                <Scan className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Scan Documents</h3>
                <p className="text-sm text-gray-600">
                  Scan physical documents using a connected scanner or printer
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-lg p-5 hover:border-blue-500 hover:shadow-lg transition-all"
            aria-label="Open file upload modal"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg group-hover:bg-green-600 transition-colors">
                <Upload className="w-6 h-6 text-green-600 group-hover:text-white transition-colors" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Upload Files</h3>
                <p className="text-sm text-gray-600">
                  Upload digital documents from your computer or cloud storage
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all group"
            aria-label="Open document scanner"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 group-hover:bg-blue-600 transition-colors">
              <Scan className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-gray-900">Scan</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg transition-all group"
            aria-label="Open file upload modal"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 group-hover:bg-green-600 transition-colors">
              <Upload className="w-5 h-5 text-green-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-gray-900">Upload</span>
          </button>

          <button 
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all group"
            aria-label="Open printer settings"
            title="Printer Settings"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 group-hover:bg-gray-600 transition-colors">
              <Printer className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-gray-900">Printer Settings</span>
          </button>

          <button
            onClick={() => { setIsScanModalOpen(true); setShowSettings(true); }}
            className="flex flex-col items-center justify-center p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all group"
            aria-label="Open scan settings"
            title="Scan Settings"
          >
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-2 group-hover:bg-gray-600 transition-colors">
              <SettingsIcon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
            </div>
            <span className="text-xs font-medium text-gray-900">Scan Settings</span>
          </button>
        </div>
      </div>

      {isScanModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Document Scanner</h2>
                <button
                  onClick={handleCancelScan}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close scanner modal"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {!scanPreview && !isScanning && !showSettings && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Printer className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Scan</h3>
                  <p className="text-gray-600 mb-6">
                    Place your document on the scanner and click Start Scan
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Scanner</span>
                      <span className="text-sm font-medium text-gray-900">HP LaserJet Pro (Simulated)</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Color Mode</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{scanSettings.colorMode}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Resolution</span>
                      <span className="text-sm font-medium text-gray-900">{scanSettings.resolution} DPI</span>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={handleStartScan}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Start Scan
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center gap-2"
                      aria-label="Open scan settings"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      Settings
                    </button>
                  </div>
                </div>
              )}

              {showSettings && !isScanning && !scanPreview && (
                <div className="py-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Settings</h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color Mode</label>
                      <select
                        value={scanSettings.colorMode}
                        onChange={(e) => handleSettingsChange('colorMode', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="color">Color</option>
                        <option value="grayscale">Grayscale</option>
                        <option value="blackwhite">Black & White</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Resolution</label>
                      <select
                        value={scanSettings.resolution}
                        onChange={(e) => handleSettingsChange('resolution', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="150">150 DPI (Fast)</option>
                        <option value="300">300 DPI (Standard)</option>
                        <option value="600">600 DPI (High Quality)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scanSettings.autoDetectEdges}
                          onChange={(e) => handleSettingsChange('autoDetectEdges', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-detect document edges</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scanSettings.autoCrop}
                          onChange={(e) => handleSettingsChange('autoCrop', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Auto-crop document</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={scanSettings.enhanceImage}
                          onChange={(e) => handleSettingsChange('enhanceImage', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enhance image quality</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              )}

              {isScanning && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <Scan className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Scanning in Progress</h3>
                  <p className="text-gray-600 mb-6">Please wait while your document is being scanned</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{scanProgress}% Complete</p>
                </div>
              )}

              {scanPreview && (
                <div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Scan Preview</h3>
                    <p className="text-gray-600">Review your scanned document before saving</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                    <img
                      src={scanPreview}
                      alt="Scanned document preview"
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveScan}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <Check className="w-5 h-5" />
                      Save & Upload
                    </button>
                    <button
                      onClick={() => {
                        setScanPreview(null);
                        setScanProgress(0);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <Scan className="w-5 h-5" />
                      Scan Again
                    </button>
                    <button
                      onClick={handleCancelScan}
                      className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setUploadModalOpen(false);
          setScannedFile(null);
        }}
        scannedFile={scannedFile}
      />
    </div>
  );
};
