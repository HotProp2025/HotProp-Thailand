import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Upload, RotateCcw, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentCaptureProps {
  documentType: 'chanote' | 'id';
  onCapture: (file: File) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function DocumentCapture({ documentType, onCapture, onCancel, isOpen }: DocumentCaptureProps) {
  const [captureMode, setCaptureMode] = useState<'camera' | 'upload' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const documentTitle = documentType === 'chanote' ? 'Chanote Document' : 'ID/Passport';
  const documentInstructions = documentType === 'chanote' 
    ? 'Take a clear photo of your chanote (land title deed). Make sure all text is readable and the document is well-lit.'
    : 'Take a clear photo of your ID card or passport. Make sure your name and photo are clearly visible.';

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setCaptureMode('camera');
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please try uploading a file instead.",
        variant: "destructive",
      });
      setCaptureMode('upload');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataURL);
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const confirmPhoto = useCallback(() => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${documentType}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        handleClose();
      });
  }, [capturedImage, documentType, onCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select an image file (JPG, PNG) or PDF document.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      onCapture(file);
      handleClose();
    }
  }, [toast, onCapture]);

  const handleClose = useCallback(() => {
    stopCamera();
    setCaptureMode(null);
    setCapturedImage(null);
    onCancel();
  }, [stopCamera, onCancel]);

  const renderModeSelection = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{documentInstructions}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          type="button"
          onClick={startCamera}
          disabled={isLoading}
          className="h-24 flex flex-col items-center gap-2"
          variant="outline"
          data-testid="button-camera-capture"
        >
          <Camera className="h-8 w-8" />
          <span>Take Photo</span>
        </Button>
        
        <Button
          type="button"
          onClick={() => {
            setCaptureMode('upload');
            fileInputRef.current?.click();
          }}
          className="h-24 flex flex-col items-center gap-2"
          variant="outline"
          data-testid="button-file-upload"
        >
          <Upload className="h-8 w-8" />
          <span>Upload File</span>
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
        data-testid="input-file-upload"
      />
    </div>
  );

  const renderCamera = () => (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured document"
            className="w-full h-full object-contain"
            data-testid="img-captured-document"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            data-testid="video-camera-stream"
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center gap-4">
        {capturedImage ? (
          <>
            <Button
              onClick={retakePhoto}
              variant="outline"
              size="lg"
              data-testid="button-retake-photo"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmPhoto}
              size="lg"
              data-testid="button-confirm-photo"
            >
              <Check className="h-4 w-4 mr-2" />
              Use Photo
            </Button>
          </>
        ) : (
          <Button
            onClick={capturePhoto}
            size="lg"
            className="bg-red-600 hover:bg-red-700"
            data-testid="button-capture-photo"
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-document-capture">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Capture {documentTitle}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            {captureMode === 'camera' ? renderCamera() : renderModeSelection()}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleClose}
            variant="outline"
            data-testid="button-cancel-capture"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}