/**
 * ChunkedUploader Component
 *
 * Fast resumable upload UI with:
 * - Drag & drop support
 * - Progress bar with speed indicator
 * - Pause/resume/cancel controls
 * - File validation
 * - Multiple file support
 */

import { useState, useCallback, useRef } from 'react';
import { useChunkedUpload, formatBytes, formatTime } from '@/hooks/useChunkedUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  X,
  Pause,
  Play,
  CheckCircle,
  AlertCircle,
  Shield,
  Zap,
  File,
  Image,
  Video,
  Music,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChunkedUploaderProps {
  onUploadComplete?: (result: { assetId: string; forensicSignature: string }) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxFileSize?: number; // in bytes
  className?: string;
}

interface QueuedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: { assetId: string; forensicSignature: string };
}

export function ChunkedUploader({
  onUploadComplete,
  onUploadError,
  accept = 'video/*,image/*,audio/*',
  maxFileSize = 10 * 1024 * 1024 * 1024, // 10GB default
  className,
}: ChunkedUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadFile,
    progress,
    isUploading,
    isPaused,
    error,
    pause,
    resume,
    cancel,
  } = useChunkedUpload();

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('audio/')) return Music;
    return File;
  };

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File too large. Maximum size is ${formatBytes(maxFileSize)}`;
    }

    const acceptedTypes = accept.split(',').map(t => t.trim());
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.replace('/*', '/'));
      }
      return file.type === type;
    });

    if (!isAccepted) {
      return 'File type not supported';
    }

    return null;
  }, [accept, maxFileSize]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const newFiles: QueuedFile[] = [];

    Array.from(files).forEach(file => {
      const validationError = validateFile(file);
      newFiles.push({
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined,
      });
    });

    setQueue(prev => [...prev, ...newFiles]);
  }, [validateFile]);

  const processQueue = useCallback(async () => {
    const pendingFile = queue.find(f => f.status === 'pending');
    if (!pendingFile || isUploading) return;

    setQueue(prev =>
      prev.map(f =>
        f.id === pendingFile.id ? { ...f, status: 'uploading' as const } : f
      )
    );

    const result = await uploadFile(pendingFile.file);

    setQueue(prev =>
      prev.map(f => {
        if (f.id === pendingFile.id) {
          if (result) {
            onUploadComplete?.(result);
            return { ...f, status: 'completed' as const, result };
          } else {
            onUploadError?.(error || 'Upload failed');
            return { ...f, status: 'error' as const, error: error || 'Upload failed' };
          }
        }
        return f;
      })
    );
  }, [queue, isUploading, uploadFile, error, onUploadComplete, onUploadError]);

  // Auto-process queue
  if (!isUploading && queue.some(f => f.status === 'pending')) {
    processQueue();
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  }, [addFiles]);

  const removeFile = useCallback((id: string) => {
    const file = queue.find(f => f.id === id);
    if (file?.status === 'uploading') {
      cancel();
    }
    setQueue(prev => prev.filter(f => f.id !== id));
  }, [queue, cancel]);

  const currentFile = queue.find(f => f.status === 'uploading');

  return (
    <Card className={cn('bg-card border-border', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Fast Upload
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Shield className="h-4 w-4 text-green-500" />
              Forensic watermarking enabled
            </CardDescription>
          </div>
          {queue.length > 0 && (
            <Badge variant="secondary">
              {queue.filter(f => f.status === 'completed').length}/{queue.length} complete
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Upload className={cn(
            'h-12 w-12 mx-auto mb-4',
            isDragging ? 'text-primary' : 'text-muted-foreground'
          )} />
          <p className="text-lg font-medium mb-1">
            {isDragging ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports video, images, and audio up to {formatBytes(maxFileSize)}
          </p>
        </div>

        {/* Current Upload Progress */}
        {currentFile && progress && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const FileIcon = getFileIcon(currentFile.file.type);
                  return <FileIcon className="h-5 w-5 text-primary" />;
                })()}
                <div>
                  <p className="font-medium truncate max-w-[200px]">{currentFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(progress.uploadedBytes)} / {formatBytes(progress.totalBytes)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={isPaused ? resume : pause}
                  className="h-8 w-8"
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={cancel}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Progress value={progress.percentage} className="h-2" />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {isPaused ? 'Paused' : `${formatBytes(progress.speed)}/s`}
              </span>
              <span>
                {isPaused ? '' : `${formatTime(progress.remainingTime)} remaining`}
              </span>
              <span>{progress.percentage}%</span>
            </div>
          </div>
        )}

        {/* File Queue */}
        {queue.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Upload Queue</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {queue.map(item => {
                const FileIcon = getFileIcon(item.file.type);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      item.status === 'completed' && 'bg-green-500/10 border-green-500/30',
                      item.status === 'error' && 'bg-destructive/10 border-destructive/30',
                      item.status === 'pending' && 'bg-muted/50',
                      item.status === 'uploading' && 'bg-primary/10 border-primary/30'
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileIcon className={cn(
                        'h-5 w-5 flex-shrink-0',
                        item.status === 'completed' && 'text-green-500',
                        item.status === 'error' && 'text-destructive',
                        item.status === 'uploading' && 'text-primary',
                      )} />
                      <div className="overflow-hidden">
                        <p className="font-medium truncate text-sm">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(item.file.size)}
                          {item.result && (
                            <span className="ml-2 text-green-600">
                              Signature: {item.result.forensicSignature.slice(0, 16)}...
                            </span>
                          )}
                          {item.error && (
                            <span className="ml-2 text-destructive">{item.error}</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {item.status === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                      {item.status !== 'uploading' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(item.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t text-center">
          <div>
            <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-xs text-muted-foreground">10x Faster</p>
          </div>
          <div>
            <Shield className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">DMCA Protected</p>
          </div>
          <div>
            <Play className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-muted-foreground">Resumable</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ChunkedUploader;
