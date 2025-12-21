import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL?: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simplified file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Basic file selection and upload functionality
 * - Upload progress tracking
 * 
 * This is a simplified version that uses native HTML file input instead of Uppy
 * to avoid dependency conflicts.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Check file size
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > maxFileSize) {
          alert(`File "${files[i].name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`);
          return;
        }
      }
      setSelectedFiles(files);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const file = selectedFiles[0]; // For now, just handle one file
      
      // Get upload parameters (presigned URL)
      const { url } = await onGetUploadParameters();
      
      // Upload file directly to S3 using PUT
      const response = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);
      
      // Call completion callback
      onComplete?.({ successful: [{ uploadURL: url }] });
      
      // Close modal and reset state
      setShowModal(false);
      setSelectedFiles(null);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild>
        <Button className={buttonClassName}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-input">Select File</Label>
            <Input
              id="file-input"
              type="file"
              onChange={handleFileSelect}
              multiple={maxNumberOfFiles > 1}
              accept="image/*,video/*"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
          </div>
          
          {selectedFiles && selectedFiles.length > 0 && (
            <div>
              <p className="text-sm font-medium">Selected files:</p>
              <ul className="text-xs text-muted-foreground">
                {Array.from(selectedFiles).map((file, index) => (
                  <li key={index}>{file.name} ({Math.round(file.size / 1024)} KB)</li>
                ))}
              </ul>
            </div>
          )}
          
          {uploading && (
            <div>
              <p className="text-sm font-medium mb-2">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFiles || selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}