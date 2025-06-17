import { Box, Typography } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AnalysisResultProps {
  result: {
    text: string;
    graphs?: {
      type: string;
      title?: string;
      data: any;
    }[];
  };
}

export default function AnalysisResult({ result }: AnalysisResultProps) {
  console.log('[DEBUG] AnalysisResult received:', {
    hasText: !!result.text,
    textLength: result.text?.length || 0,
    hasGraphs: !!result.graphs,
    graphsCount: result.graphs?.length || 0,
    firstGraphType: result.graphs?.[0]?.type,
    result: result
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        分析結果
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
          {result.text}
        </Typography>
      </Box>

      {result.graphs?.map((graph, index) => (
        <Box key={index} sx={{ mb: 4 }}>
          {graph.type === 'bar' && (
            <Bar
              data={graph.data}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: graph.title || `グラフ ${index + 1}`,
                  },
                },
              }}
            />
          )}
        </Box>
      ))}
    </Box>
  );
} 