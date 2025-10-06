import React from 'react';
import { PDFViewer } from './PDFViewer';
import { ImageViewer } from './viewers/ImageViewer';
import { VideoViewer } from './viewers/VideoViewer';
import { AudioViewer } from './viewers/AudioViewer';
import { WordViewer } from './viewers/WordViewer';
import { ExcelViewer } from './viewers/ExcelViewer';
import { TiffViewer } from './viewers/TiffViewer';
import { UnsupportedViewer } from './viewers/UnsupportedViewer';
import { detectFileFormat } from '../utils/fileFormatDetector';

interface UnifiedDocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  zoom: number;
}

export const UnifiedDocumentViewer: React.FC<UnifiedDocumentViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
  zoom,
}) => {
  const formatInfo = detectFileFormat(fileName, fileType);

  switch (formatInfo.format) {
    case 'pdf':
      return <PDFViewer fileUrl={fileUrl} fileName={fileName} zoom={zoom} />;

    case 'image':
      return <ImageViewer fileUrl={fileUrl} fileName={fileName} zoom={zoom} />;

    case 'tiff':
      return <TiffViewer fileUrl={fileUrl} fileName={fileName} zoom={zoom} />;

    case 'video':
      return <VideoViewer fileUrl={fileUrl} fileName={fileName} />;

    case 'audio':
      return <AudioViewer fileUrl={fileUrl} fileName={fileName} />;

    case 'word':
      return <WordViewer fileUrl={fileUrl} fileName={fileName} zoom={zoom} />;

    case 'excel':
      return <ExcelViewer fileUrl={fileUrl} fileName={fileName} zoom={zoom} />;

    case 'powerpoint':
    case 'cad':
    case 'unsupported':
    default:
      return (
        <UnsupportedViewer
          fileUrl={fileUrl}
          fileName={fileName}
          fileType={formatInfo.format}
        />
      );
  }
};
