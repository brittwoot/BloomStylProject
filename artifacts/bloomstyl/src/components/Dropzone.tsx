import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropzoneProps {
  onFileExtracted: (text: string) => void;
  isExtracting: boolean;
}

// Ensure the hook doesn't create cycles by wrapping its usage appropriately
import { useUploadDocument } from "../hooks/use-upload";

export function FileDropzone({ onFileExtracted, isExtracting }: DropzoneProps) {
  const { mutateAsync: uploadFile } = useUploadDocument();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      try {
        const extractedText = await uploadFile(file);
        onFileExtracted(extractedText);
      } catch (error) {
        console.error("Failed to extract text", error);
      }
    }
  }, [uploadFile, onFileExtracted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    disabled: isExtracting
  });

  if (selectedFile) {
    return (
      <div className="w-full bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            {isExtracting ? <Loader2 className="w-6 h-6 animate-spin" /> : <File className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground line-clamp-1">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {isExtracting ? "Extracting text..." : "Text extracted successfully"}
            </p>
          </div>
        </div>
        {!isExtracting && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              onFileExtracted(""); // Clear text
            }}
            className="p-2 hover:bg-black/5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "w-full border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-out cursor-pointer flex flex-col items-center justify-center gap-3 text-center",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        isExtracting && "opacity-50 pointer-events-none"
      )}
    >
      <input {...getInputProps()} />
      <div className="bg-primary/10 p-4 rounded-full text-primary shadow-inner">
        <UploadCloud className="w-8 h-8" />
      </div>
      <div>
        <p className="text-base font-semibold text-foreground">
          {isDragActive ? "Drop the file here" : "Upload PDF or DOCX"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag and drop, or click to browse files
        </p>
      </div>
    </div>
  );
}
