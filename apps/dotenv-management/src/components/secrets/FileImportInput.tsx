"use client";

import { forwardRef } from "react";

interface FileImportInputProps {
  onFileImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FileImportInput = forwardRef<HTMLInputElement, FileImportInputProps>(
  ({ onFileImport }, ref) => {
    return (
      <input
        ref={ref}
        type="file"
        accept=".env,.env.local,.env.development,.env.production,.env.test,.txt"
        onChange={onFileImport}
        className="hidden"
      />
    );
  }
);

FileImportInput.displayName = "FileImportInput";
