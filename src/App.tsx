import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, X, FileText, Image as ImageIcon, File, FileArchive, 
  FileCode, FileSpreadsheet, FileVideo, FileAudio, AlertTriangle,
  CheckCircle, Trash2, Calendar, HardDrive, Maximize, Ratio,
  Clock, Wifi, Activity, Zap
} from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileInfo {
  id: string;
  file: File;
  name: string;
  type: string;
  size: number;
  lastModified: Date;
  preview?: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-purple-500" />;
  if (type.startsWith('video/')) return <FileVideo className="w-6 h-6 text-red-500" />;
  if (type.startsWith('audio/')) return <FileAudio className="w-6 h-6 text-yellow-500" />;
  if (type.includes('pdf')) return <FileText className="w-6 h-6 text-red-600" />;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return <FileArchive className="w-6 h-6 text-orange-500" />;
  if (type.includes('javascript') || type.includes('typescript') || type.includes('html') || type.includes('css')) return <FileCode className="w-6 h-6 text-blue-500" />;
  if (type.includes('excel') || type.includes('sheet') || type.includes('csv')) return <FileSpreadsheet className="w-6 h-6 text-green-500" />;
  return <File className="w-6 h-6 text-gray-500" />;
};

const getSizeWarning = (size: number): { title: string; message: string; color: string } | null => {
  const mb = size / (1024 * 1024);
  if (mb > 2000) return { title: 'File Ekstra Besar (> 2GB)', message: 'Hanya bisa dikirim via Telegram Premium atau penyimpanan cloud seperti Google Drive.', color: 'text-red-700 bg-red-50 border-red-200' };
  if (mb > 100) return { title: 'Batas Dokumen WhatsApp (> 100MB)', message: 'Tidak bisa dikirim langsung via WA biasa. Harus menggunakan link cloud storage.', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (mb > 64) return { title: 'Batas Media WhatsApp (> 64MB)', message: 'Terlalu besar untuk dikirim sebagai Video/Foto biasa di WA, tapi mungkin masih bisa sebagai Dokumen.', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (mb > 25) return { title: 'Batas Email / Discord (> 25MB)', message: 'Tidak bisa dilampirkan langsung di Gmail/Outlook, atau dikirim di Discord pengguna gratis.', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  if (mb > 8) return { title: 'Peringatan Ukuran Sedang (> 8MB)', message: 'Aman untuk WA dan Email, namun batas upload beberapa platform forum/web mungkin menolak.', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  return null;
};

const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
};

export default function App() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<FileInfo> => {
    const id = Math.random().toString(36).substring(7);
    const fileInfo: FileInfo = {
      id,
      file,
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      lastModified: new Date(file.lastModified),
    };

    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            fileInfo.preview = e.target?.result as string;
            fileInfo.dimensions = { width: img.width, height: img.height };
            fileInfo.aspectRatio = calculateAspectRatio(img.width, img.height);
            resolve(fileInfo);
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    }

    return fileInfo;
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    const newFiles: FileInfo[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
      const fileInfo = await processFile(fileList[i]);
      newFiles.push(fileInfo);
      const progressValue = Math.round(((i + 1) / fileList.length) * 100);
      setProgress(progressValue);
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 500);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  const calculateTime = (speedMbps: number) => {
    if (totalSize === 0) return '-';
    const bytesPerSec = (speedMbps * 1024 * 1024) / 8;
    const seconds = totalSize / bytesPerSec;
    
    if (seconds < 60) return `${Math.ceil(seconds)} dtk`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} mnt ${Math.floor(seconds % 60)} dtk`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} jam ${remainingMins} mnt`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">File Size Checker</h1>
          <p className="text-slate-600">Quickly inspect file details before uploading</p>
        </div>

        {/* Upload Zone */}
        <Card className={`mb-6 transition-all duration-300 ${isDragging ? 'ring-4 ring-blue-400 ring-opacity-50 scale-[1.02]' : ''}`}>
          <CardContent className="p-0">
            <div
              onClick={handleClick}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={clsx(
                'relative p-12 cursor-pointer transition-all duration-300 border-2 border-dashed',
                isDragging 
                  ? 'bg-blue-50 border-blue-400' 
                  : 'bg-white hover:bg-slate-50 border-slate-200'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="text-center">
                <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
                  isDragging ? 'bg-blue-100 scale-110' : 'bg-slate-100'
                }`}>
                  <Upload className={`w-10 h-10 transition-colors duration-300 ${
                    isDragging ? 'text-blue-600' : 'text-slate-400'
                  }`} />
                </div>
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {isDragging ? 'Drop files here' : 'Drag & drop files here'}
                </h3>
                <p className="text-slate-500 mb-4">or click to browse from your computer</p>
                <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                  <span className="px-3 py-1 bg-slate-100 rounded-full">Images</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">Documents</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">Videos</span>
                  <span className="px-3 py-1 bg-slate-100 rounded-full">Audio</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Progress */}
        {loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Analyzing files...</span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* File List Header */}
        {files.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">
              Files ({files.length})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFiles}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}

        {/* File Cards */}
        {files.length > 0 && (
          <ScrollArea className="h-auto max-h-[700px] md:max-h-screen">
            <div className="grid gap-4 pr-4">
              {files.map((fileInfo) => {
                const warning = getSizeWarning(fileInfo.size);
                
                return (
                  <Card key={fileInfo.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Preview Section (for images) */}
                        {fileInfo.preview && (
                          <div className="w-full md:w-48 h-40 md:h-auto bg-slate-100 flex items-center justify-center p-4">
                            <img
                              src={fileInfo.preview}
                              alt={fileInfo.name}
                              className="max-w-full max-h-full object-contain rounded-lg"
                            />
                          </div>
                        )}
                        
                        {/* File Info Section */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              {getFileIcon(fileInfo.type)}
                              <div>
                                <h3 className="font-semibold text-slate-800 break-all" title={fileInfo.name}>
                                  {fileInfo.name.length > 50 
                                    ? fileInfo.name.substring(0, 50) + '...' 
                                    : fileInfo.name}
                                </h3>
                                <p className="text-sm text-slate-500">{fileInfo.type}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(fileInfo.id)}
                              className="text-slate-400 hover:text-red-600"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>

                          {/* Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="flex items-center gap-2">
                              <HardDrive className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500">Size</p>
                                <p className="font-medium text-slate-700">{formatFileSize(fileInfo.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500">Modified</p>
                                <p className="font-medium text-slate-700">
                                  {fileInfo.lastModified.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {fileInfo.dimensions && (
                              <>
                                <div className="flex items-center gap-2">
                                  <Maximize className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-500">Resolution</p>
                                    <p className="font-medium text-slate-700">
                                      {fileInfo.dimensions.width} × {fileInfo.dimensions.height}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Ratio className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <p className="text-xs text-slate-500">Aspect Ratio</p>
                                    <p className="font-medium text-slate-700">{fileInfo.aspectRatio}</p>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Size Warning */}
                          {warning ? (
                            <Alert className={clsx('border', warning.color)}>
                              <AlertTriangle className="w-4 h-4" />
                              <AlertDescription>
                                <span className="font-bold block mb-1">{warning.title}</span>
                                <span className="opacity-90 leading-tight block">{warning.message}</span>
                              </AlertDescription>
                            </Alert>
                          ) : (
                            <Alert className="border text-green-700 bg-green-50 border-green-200">
                              <CheckCircle className="w-4 h-4" />
                              <AlertDescription>
                                <span className="font-bold block mb-1">Ukuran File Aman</span>
                                <span className="opacity-90 leading-tight block">File ini cukup kecil dan sangat aman dikirim ke hampir semua platform populer (termasuk Email dan WhatsApp).</span>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Empty State */}
        {files.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-lg font-medium text-slate-600 mb-2">No files yet</h3>
            <p className="text-slate-400">Upload files to see their details</p>
          </div>
        )}

        {/* Upload Time Estimator */}
        {files.length > 0 && (
          <Card className="mt-8 bg-white border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Estimasi Waktu Upload ({formatFileSize(totalSize)})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col p-5 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:shadow-md">
                  <div className="flex items-center gap-2 text-slate-600 mb-4">
                    <Activity className="w-5 h-5" />
                    <span className="font-medium">Jaringan Biasa (4G/3G)</span>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-2xl font-bold text-slate-800">{calculateTime(10)}</span>
                    <span className="text-sm text-slate-500 mb-1">~10 Mbps</span>
                  </div>
                </div>

                <div className="flex flex-col p-5 rounded-xl bg-blue-50 border border-blue-100 transition-all hover:shadow-md hover:border-blue-300">
                  <div className="flex items-center gap-2 text-blue-700 mb-4">
                    <Wifi className="w-5 h-5" />
                    <span className="font-medium">Wi-Fi Standar</span>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-2xl font-bold text-blue-900">{calculateTime(50)}</span>
                    <span className="text-sm text-blue-600/70 mb-1">~50 Mbps</span>
                  </div>
                </div>

                <div className="flex flex-col p-5 rounded-xl bg-purple-50 border border-purple-100 transition-all hover:shadow-md hover:border-purple-300">
                  <div className="flex items-center gap-2 text-purple-700 mb-4">
                    <Zap className="w-5 h-5" />
                    <span className="font-medium">Internet Cepat (Fiber)</span>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-2xl font-bold text-purple-900">{calculateTime(100)}</span>
                    <span className="text-sm text-purple-600/70 mb-1">~100 Mbps</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
