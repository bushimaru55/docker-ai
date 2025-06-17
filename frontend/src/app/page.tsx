'use client';

import { useState } from 'react';
import { Box, Container, Typography, Paper, CircularProgress } from '@mui/material';
import FileUpload from '@/components/FileUpload';
import PromptInput from '@/components/PromptInput';
import AnalysisResult from '@/components/AnalysisResult';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (file: File) => {
    console.log(`[DEBUG] ${new Date().toISOString()} - File uploaded:`, {
      name: file.name,
      size: file.size,
      type: file.type
    });
    setFile(file);
  };

  const handlePromptSubmit = async (prompt: string) => {
    const startTime = Date.now();
    console.log(`[DEBUG] ${new Date().toISOString()} - handlePromptSubmit called with:`, { 
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      hasFile: !!file,
      fileName: file?.name 
    });
    
    if (!file) {
      console.log(`[DEBUG] ${new Date().toISOString()} - No file selected, returning early`);
      return;
    }
    
    console.log(`[DEBUG] ${new Date().toISOString()} - Starting analysis...`);
    setLoading(true);
    
    // タイムアウト設定（5分）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error(`[ERROR] ${new Date().toISOString()} - Request timeout after 5 minutes`);
      controller.abort();
    }, 5 * 60 * 1000);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);
      
      console.log(`[DEBUG] ${new Date().toISOString()} - FormData prepared, sending request to: http://localhost:3001/api/analysis/analyze`);
      
      const response = await fetch('http://localhost:3001/api/analysis/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[DEBUG] ${new Date().toISOString()} - Response received:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`[DEBUG] ${new Date().toISOString()} - Starting response JSON parsing...`);
      const data = await response.json();
      console.log(`[DEBUG] ${new Date().toISOString()} - Response data parsed successfully:`, {
        hasId: !!data.id,
        hasTitle: !!data.title,
        hasResultText: !!data.resultText,
        hasGraphsData: !!data.graphsData,
        resultTextLength: data.resultText?.length || 0,
        graphsDataLength: data.graphsData?.length || 0,
        processingTime: Date.now() - startTime
      });
      
      // バックエンドのレスポンス形式をフロントエンドの期待する形式に変換
      const transformedResult = {
        text: data.resultText || '',
        graphs: data.graphsData || []
      };
      
      console.log(`[DEBUG] ${new Date().toISOString()} - Transformed result:`, {
        originalResultText: data.resultText,
        transformedText: transformedResult.text,
        textLength: transformedResult.text.length,
        graphsCount: transformedResult.graphs.length,
        fullTransformedResult: transformedResult
      });
      
      setResult(transformedResult);
      console.log(`[DEBUG] ${new Date().toISOString()} - Result state updated successfully`);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`[ERROR] ${new Date().toISOString()} - Request was aborted due to timeout`);
        } else {
          console.error(`[ERROR] ${new Date().toISOString()} - Analysis failed:`, {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
      } else {
        console.error(`[ERROR] ${new Date().toISOString()} - Analysis failed with unknown error:`, error);
      }
    } finally {
      console.log(`[DEBUG] ${new Date().toISOString()} - Setting loading to false. Total time: ${Date.now() - startTime}ms`);
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
          <PromptInput onSubmit={handlePromptSubmit} disabled={!file || loading} />
        </Paper>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>分析中...</Typography>
        </Box>
      )}

      {result && !loading && (
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <AnalysisResult result={result} />
          </Paper>
        </Box>
      )}
    </Container>
  );
} 