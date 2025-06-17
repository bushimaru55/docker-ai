import { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  disabled?: boolean;
}

export default function PromptInput({ onSubmit, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        分析指示を入力
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="例: 月別の売上推移をグラフで表示し、トップセールス担当者の名前は匿名化してください"
        disabled={disabled}
        sx={{ mb: 2 }}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={disabled || !prompt.trim()}
      >
        分析実行
      </Button>
    </Box>
  );
} 