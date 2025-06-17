import axios from 'axios';
import { config } from 'dotenv';

config();

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://ollama:11434';

export interface AnalysisRequest {
  prompt: string;
  data: any;
}

export class OllamaService {
  private static instance: OllamaService;
  private model: string = 'llama3:latest';

  private constructor() {}

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  public async analyze(request: AnalysisRequest): Promise<string> {
    try {
      const response = await axios.post<{ response: string }>(`${OLLAMA_API_URL}/api/generate`, {
        model: this.model,
        prompt: this.buildPrompt(request),
        stream: false,
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw new Error('Failed to analyze data with Ollama');
    }
  }

  private buildPrompt(request: AnalysisRequest): string {
    return `
あなたはデータ分析アシスタントです。以下のデータを分析し、ユーザーの指示に従って結果を提供してください。

データ:
${JSON.stringify(request.data, null, 2)}

ユーザーの指示:
${request.prompt}

分析結果は以下の形式で提供してください：
1. テキストによる分析結果
2. グラフデータ（必要な場合）

JSON形式で出力し、以下の構造に従ってください：
{
  "text": "分析結果のテキスト",
  "graphs": [
    {
      "type": "bar",
      "data": {
        "labels": [...],
        "datasets": [...]
      }
    }
  ]
}
`;
  }
} 