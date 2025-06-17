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

  private constructor() {}

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  public async analyze(data: any[], prompt: string): Promise<any> {
    const startTime = Date.now();
    console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Starting analysis`);
    
    // データを制限してパフォーマンスを向上
    const MAX_ROWS = 3; // さらに少なくして確実性を向上
    const limitedData = data.slice(0, MAX_ROWS);
    console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Data limited to ${MAX_ROWS} rows`);
    
    // 非常にシンプルなプロンプトに変更
    const analysisPrompt = `以下のデータを分析してください：
${JSON.stringify(limitedData, null, 2)}

要求：${prompt}

以下のJSON形式で簡潔に回答してください：
{
  "text": "分析結果の説明",
  "graphs": [{
    "type": "bar",
    "title": "グラフタイトル",
    "data": {
      "labels": ["ラベル1", "ラベル2"],
      "datasets": [{"label": "データ", "data": [数値1, 数値2]}]
    }
  }]
}`;

    console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Prompt length: ${analysisPrompt.length} characters`);

    try {
      const TIMEOUT = 120000; // 2分
      console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Sending request to ${OLLAMA_API_URL}/api/generate with ${TIMEOUT}ms timeout`);
      
      const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, {
        model: 'llama3.2:1b',
        prompt: analysisPrompt,
        stream: false,
        options: {
          num_predict: 800, // より多くのトークンを許可
          num_ctx: 2048,
          temperature: 0.1, // より一貫した出力
          repeat_penalty: 1.1
        }
      }, {
        timeout: TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const responseData = response.data as { response: string };
      console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Response received. Status: ${response.status}, Response length: ${responseData.response?.length || 0}`);
      console.log(`[DEBUG] ${new Date().toISOString()} - OllamaService: Processing time: ${Date.now() - startTime}ms`);
      
      return responseData.response;
    } catch (error: any) {
      console.error(`[ERROR] ${new Date().toISOString()} - OllamaService: Analysis failed after ${Date.now() - startTime}ms`);
      
      if (error?.isAxiosError || error?.response || error?.request) {
        if (error.code === 'ECONNABORTED') {
          console.error(`[ERROR] ${new Date().toISOString()} - OllamaService: Request timeout`);
          throw new Error('Ollama analysis timed out after 2 minutes');
        } else if (error.response) {
          console.error(`[ERROR] ${new Date().toISOString()} - OllamaService: HTTP error:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
          throw new Error(`Ollama API error: ${error.response.status} ${error.response.statusText}`);
        } else if (error.request) {
          console.error(`[ERROR] ${new Date().toISOString()} - OllamaService: Network error - no response received`);
          throw new Error('Failed to connect to Ollama service');
        }
      }
      
      console.error(`[ERROR] ${new Date().toISOString()} - OllamaService: Unknown error:`, error);
      throw new Error('Failed to analyze data with Ollama');
    }
  }
}
