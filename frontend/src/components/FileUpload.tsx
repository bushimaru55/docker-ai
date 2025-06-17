import { useState, useCallback } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Excelファイルをアップロード
      </Typography>
      
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <Typography>ファイルをドロップしてください...</Typography>
        ) : (
          <Typography>
            {file ? file.name : 'クリックまたはドラッグ＆ドロップでファイルを選択'}
          </Typography>
        )}
      </Box>

      {file && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            選択されたファイル: {file.name}
          </Typography>
        </Box>
      )}
    </Box>
  );
} 