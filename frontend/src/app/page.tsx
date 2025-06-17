'use client';

import { useState } from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import FileUpload from '@/components/FileUpload';
import PromptInput from '@/components/PromptInput';
import AnalysisResult from '@/components/AnalysisResult';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file: File) => {
    setFile(file);
  };

  const handlePromptSubmit = async (prompt: string) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);

      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        ローカルLLM分析システム
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <FileUpload onFileUpload={handleFileUpload} />
        </Paper>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <PromptInput onSubmit={handlePromptSubmit} disabled={!file} />
        </Paper>
      </Box>

      {result && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <AnalysisResult result={result} />
          </Paper>
        </Box>
      )}
    </Container>
  );
} 