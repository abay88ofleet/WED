import React, { useState, useEffect } from 'react';
import { X, Upload, File, CheckCircle, AlertCircle, Loader2, CreditCard as Edit2 } from 'lucide-react';
import { uploadDocument, uploadDocumentCopy, getCategories } from '../services/documentService';
import { useDocumentStore } from '../store/useDocumentStore';
import { useNotification } from '../contexts/NotificationContext';
import { SuccessAnimation } from './ui/SuccessAnimation';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedCategoryId?: string | null;
  scannedFile?: File | null;
  initialSoftCopyMode?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, preSelectedCategoryId, scannedFile, initialSoftCopyMode = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [autoTags, setAutoTags] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate'}>({});
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [duplicateFiles, setDuplicateFiles] = useState<{[key: string]: { originalName: string, newName: string, existingDocId: string }}>({});
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [isSoftCopyTemplate, setIsSoftCopyTemplate] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const { refreshDocuments } = useDocumentStore();
  const { showNotification } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (preSelectedCategoryId) {
        setSelectedCategory(preSelectedCategoryId);
      }
      if (scannedFile) {
        setSelectedFiles([scannedFile]);
        processFilesForAutoTags([scannedFile]);
      }
      setIsSoftCopyTemplate(initialSoftCopyMode);
    }
  }, [isOpen, preSelectedCategoryId, scannedFile, initialSoftCopyMode]);

  const loadCategories = async () => {
    try {
      const { data, error } = await getCategories();
      if (error) {
        console.error('Error loading categories:', error);
        setErrorMessage(`Failed to load categories: ${error}`);
        return;
      }
      if (data) {
        setCategories(data);
        console.log('Categories loaded:', data.length);
      } else {
        console.warn('No categories returned');
        setCategories([]);
      }
    } catch (err) {
      console.error('Exception loading categories:', err);
      setErrorMessage(`Failed to load categories: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
    await processFilesForAutoTags(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      await processFilesForAutoTags(files);
    }
  };

  const processFilesForAutoTags = async (files: File[]) => {
    if (files.length === 0) return;

    try {
      const { extractMetadataAndTags } = await import('../services/uploadService');
      const firstFile = files[0];
      const { autoTags: generatedTags } = await extractMetadataAndTags(firstFile);
      setAutoTags(generatedTags);

      const existingTags = tags.split(',').map(t => t.trim()).filter(t => t);
      const combinedTags = [...new Set([...existingTags, ...generatedTags])];
      setTags(combinedTags.join(', '));
    } catch (error) {
      console.error('Error generating auto tags:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');
    const progress: {[key: string]: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate'} = {};
    selectedFiles.forEach(file => {
      progress[file.name] = 'pending';
    });
    setUploadProgress(progress);

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    let successCount = 0;
    let errorCount = 0;
    const duplicates: {[key: string]: { originalName: string, newName: string, existingDocId: string }} = {};

    for (const file of selectedFiles) {
      setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));

      const result = await uploadDocument({
        file,
        categoryId: selectedCategory,
        tags: tagArray,
        description,
        isSoftCopyTemplate,
      });

      if (result.success) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'success' }));
        successCount++;
      } else if (result.existingDocId) {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'duplicate' }));
        duplicates[file.name] = {
          originalName: file.name,
          newName: generateNewFileName(file.name),
          existingDocId: result.existingDocId
        };
      } else {
        setUploadProgress(prev => ({ ...prev, [file.name]: 'error' }));
        errorCount++;
        if (errorCount === 1) {
          setErrorMessage(result.error || 'Upload failed');
        }
      }
    }

    setDuplicateFiles(duplicates);
    setIsUploading(false);

    if (successCount > 0) {
      await refreshDocuments();

      showNotification({
        type: 'success',
        title: 'Upload Successful',
        message: `${successCount} ${successCount === 1 ? 'document' : 'documents'} uploaded successfully`,
        duration: 4000,
      });
    }

    if (errorCount > 0) {
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: `${errorCount} ${errorCount === 1 ? 'document' : 'documents'} failed to upload`,
        duration: 5000,
      });
    }

    if (Object.keys(duplicates).length > 0) {
      showNotification({
        type: 'warning',
        title: 'Duplicate Files Detected',
        message: `${Object.keys(duplicates).length} ${Object.keys(duplicates).length === 1 ? 'file' : 'files'} already exist. Please rename to upload.`,
        duration: 5000,
      });
    }

    if (errorCount === 0 && Object.keys(duplicates).length === 0) {
      setShowSuccessAnimation(true);
      setTimeout(() => {
        setShowSuccessAnimation(false);
        onClose();
        resetForm();
      }, 2000);
    }
  };

  const generateNewFileName = (originalName: string): string => {
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${nameWithoutExt}-copy-${timestamp}${extension}`;
  };

  const handleRenameAndUpload = async (originalFileName: string) => {
    const duplicateInfo = duplicateFiles[originalFileName];
    if (!duplicateInfo) return;

    const file = selectedFiles.find(f => f.name === originalFileName);
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [originalFileName]: 'uploading' }));

    const tagArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const result = await uploadDocumentCopy({
      file,
      categoryId: selectedCategory,
      tags: tagArray,
      description,
      newFileName: duplicateInfo.newName,
      isSoftCopyTemplate,
    });

    if (result.success) {
      setUploadProgress(prev => ({ ...prev, [originalFileName]: 'success' }));
      setDuplicateFiles(prev => {
        const newDuplicates = { ...prev };
        delete newDuplicates[originalFileName];
        return newDuplicates;
      });
      await refreshDocuments();

      showNotification({
        type: 'success',
        title: 'Document Uploaded',
        message: `"${duplicateInfo.newName}" uploaded successfully`,
        duration: 4000,
      });

      if (Object.keys(duplicateFiles).length === 1) {
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onClose();
          resetForm();
        }, 2000);
      }
    } else {
      setUploadProgress(prev => ({ ...prev, [originalFileName]: 'error' }));
      setErrorMessage(result.error || 'Upload failed');

      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: result.error || 'Failed to upload document',
        duration: 5000,
      });
    }
  };

  const handleUpdateFileName = (originalFileName: string, newName: string) => {
    setDuplicateFiles(prev => ({
      ...prev,
      [originalFileName]: {
        ...prev[originalFileName],
        newName,
      },
    }));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setSelectedCategory(preSelectedCategoryId || '');
    setTags('');
    setAutoTags([]);
    setDescription('');
    setUploadProgress({});
    setErrorMessage('');
    setDuplicateFiles({});
    setRenamingFile(null);
    setIsSoftCopyTemplate(false);
  };

  const handleClose = () => {
    if (!isUploading) {
      onClose();
      resetForm();
    }
  };

  const getStatusIcon = (status: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate', fileName: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
      case 'duplicate':
        return (
          <div className="flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-500" />
          </div>
        );
      default:
        return <CheckCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />;
    }
  };

  return (
    <>
      {showSuccessAnimation && <SuccessAnimation />}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
                <p className="text-sm text-gray-500">
                  Add files to your document library
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close upload modal"
              title="Close"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Upload
                className={`w-16 h-16 mx-auto mb-4 ${
                  isDragging ? 'text-blue-500' : 'text-gray-400'
                }`}
              />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Support for PDF, Word, Excel, PowerPoint, and more
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                name="fileUpload"
                aria-label="Select files to upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                Select Files
              </label>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Selected Files ({selectedFiles.length})
                </h3>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => {
                    const status = uploadProgress[file.name] || 'pending';
                    const isDuplicate = status === 'duplicate';
                    const duplicateInfo = duplicateFiles[file.name];
                    const isRenaming = renamingFile === file.name;

                    return (
                      <div key={index}>
                        <div
                          className={`flex items-center gap-3 p-3 rounded-lg ${
                            isDuplicate ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
                          }`}
                        >
                          <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          {getStatusIcon(status, file.name)}
                        </div>

                        {isDuplicate && duplicateInfo && (
                          <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-2 mb-3">
                              <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                              <p className="text-xs text-orange-800">
                                This file already exists. Rename it to create a copy.
                              </p>
                            </div>

                            {isRenaming ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={duplicateInfo.newName}
                                  onChange={(e) => handleUpdateFileName(file.name, e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-orange-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  placeholder="Enter new file name"
                                  id={`rename-${file.name}`}
                                  name="newFileName"
                                  aria-label="New file name"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      handleRenameAndUpload(file.name);
                                      setRenamingFile(null);
                                    }}
                                    className="flex-1 px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                                  >
                                    Upload as Copy
                                  </button>
                                  <button
                                    onClick={() => setRenamingFile(null)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setRenamingFile(file.name)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-white border border-orange-300 rounded hover:bg-orange-50 transition-colors"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Rename and Upload
                                </button>
                                <button
                                  onClick={() => handleRenameAndUpload(file.name)}
                                  className="px-3 py-1.5 text-xs font-medium bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                                >
                                  Use Suggested Name
                                </button>
                              </div>
                            )}
                            <p className="text-xs text-gray-600 mt-2">
                              Suggested: <span className="font-medium">{duplicateInfo.newName}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="document-category" className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      id="document-category"
                      name="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      disabled={isUploading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Select document category"
                    >
                      <option value="">Select a category...</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="document-tags" className="block text-sm font-medium text-gray-700 mb-2">
                      Tags {autoTags.length > 0 && <span className="text-xs text-green-600">(Auto-generated)</span>}
                    </label>
                    <input
                      type="text"
                      id="document-tags"
                      name="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      disabled={isUploading}
                      placeholder="Add tags separated by commas..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Document tags"
                    />
                    {autoTags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {autoTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="document-description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="document-description"
                      name="description"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isUploading}
                      placeholder="Add a description for these documents..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Document description"
                    />
                  </div>

                  <div>
                    <label htmlFor="soft-copy-template" className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="soft-copy-template"
                        name="isSoftCopyTemplate"
                        checked={isSoftCopyTemplate}
                        onChange={(e) => setIsSoftCopyTemplate(e.target.checked)}
                        disabled={isUploading}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Mark as soft copy template"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">Soft Copy Template</span>
                        <p className="text-xs text-gray-500">Mark as editable template (download only, no preview)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
