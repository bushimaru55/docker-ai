import { Request, Response } from 'express';
// import { AppDataSource } from '../config/database';
// import { AnalysisResult } from '../models/AnalysisResult';
import { OllamaService } from '../services/ollamaService';
import * as XLSX from 'xlsx';

// const analysisRepository = AppDataSource.getRepository(AnalysisResult);
const ollamaService = OllamaService.getInstance();

export class AnalysisController {
  public async analyzeData(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    console.log(`[DEBUG] ${new Date().toISOString()} - Analysis request started`);
    
    try {
      const { prompt, data } = req.body;
      console.log(`[DEBUG] ${new Date().toISOString()} - Request body parsed:`, {
        hasPrompt: !!prompt,
        hasData: !!data,
        hasFile: !!req.file,
        fileInfo: req.file ? {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        } : null
      });

      if (!prompt || (!data && !req.file)) {
        console.log(`[DEBUG] ${new Date().toISOString()} - Missing required parameters`);
        res.status(400).json({ error: 'Prompt and either data or file are required' });
        return;
      }

      let parsedData = data;
      // ファイルがアップロードされている場合はExcelをパース
      if (!parsedData && req.file) {
        console.log(`[DEBUG] ${new Date().toISOString()} - Starting Excel file parsing`);
        try {
          const workbook = XLSX.readFile(req.file.path);
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          parsedData = XLSX.utils.sheet_to_json(sheet);
          console.log(`[DEBUG] ${new Date().toISOString()} - Excel parsing completed. Rows: ${parsedData.length}`);
        } catch (excelError) {
          console.error(`[ERROR] ${new Date().toISOString()} - Failed to parse Excel file:`, excelError);
          res.status(400).json({ error: 'Failed to parse Excel file' });
          return;
        }
      }

      // Ollamaで分析を実行
      console.log(`[DEBUG] ${new Date().toISOString()} - Starting Ollama analysis`);
      const analysisResult = await ollamaService.analyze(parsedData, prompt);
      console.log(`[DEBUG] ${new Date().toISOString()} - Ollama analysis completed. Response length:`, analysisResult?.length || 0);
      console.log(`[DEBUG] ${new Date().toISOString()} - Ollama raw response (first 500 chars):`, analysisResult?.substring(0, 500));
      
      let parsedResult;
      try {
        console.log(`[DEBUG] ${new Date().toISOString()} - Starting JSON parsing`);
        // 複数のJSONブロック抽出パターンを試行
        let jsonString = '';
        
        // パターン1: ```json ブロック内のJSON
        const jsonBlockMatch = analysisResult.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonBlockMatch) {
          jsonString = jsonBlockMatch[1];
          console.log(`[DEBUG] ${new Date().toISOString()} - JSON block found, length:`, jsonString.length);
        } else {
          // パターン2: 最初のJSONオブジェクト
          const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0];
            console.log(`[DEBUG] ${new Date().toISOString()} - JSON object found, length:`, jsonString.length);
          } else {
            console.error(`[ERROR] ${new Date().toISOString()} - No JSON found in Ollama response`);
            throw new Error('No JSON found in Ollama response');
          }
        }
        
        parsedResult = JSON.parse(jsonString);
        console.log(`[DEBUG] ${new Date().toISOString()} - JSON parsing completed successfully`);
      } catch (parseError) {
        console.error(`[ERROR] ${new Date().toISOString()} - Failed to parse Ollama response as JSON:`, parseError);
        console.error(`[ERROR] ${new Date().toISOString()} - Raw response:`, analysisResult);
        
        // フォールバック: 簡単な分析結果を生成
        console.log(`[DEBUG] ${new Date().toISOString()} - Generating fallback result`);
        parsedResult = {
          text: "データの分析を実行しました。詳細な結果の表示に問題が発生しましたが、基本的な処理は完了しています。",
          graphs: [{
            type: "bar",
            title: "データ概要",
            data: {
              labels: ["データ項目"],
              datasets: [{"label": "件数", "data": [Array.isArray(parsedData) ? parsedData.length : 1]}]
            }
          }]
        };
        console.log(`[DEBUG] ${new Date().toISOString()} - Fallback result generated:`, {
          textLength: parsedResult.text.length,
          text: parsedResult.text,
          graphsCount: parsedResult.graphs.length
        });
      }

      console.log(`[DEBUG] ${new Date().toISOString()} - Preparing response object`);
      // 暫定的にDB保存せず直接返す
      const result = {
        id: Date.now(),
        title: prompt.substring(0, 100),
        fileName: (req.file as Express.Multer.File)?.originalname || 'unknown',
        promptText: prompt,
        resultText: parsedResult.text,
        graphsData: parsedResult.graphs || [],
        createdAt: new Date().toISOString()
      };

      console.log(`[DEBUG] ${new Date().toISOString()} - Final response object:`, {
        id: result.id,
        title: result.title,
        fileName: result.fileName,
        promptText: result.promptText.substring(0, 50) + '...',
        resultTextLength: result.resultText.length,
        resultText: result.resultText,
        graphsDataLength: result.graphsData.length,
        createdAt: result.createdAt
      });

      console.log(`[DEBUG] ${new Date().toISOString()} - Sending response. Processing time: ${Date.now() - startTime}ms`);
      res.json(result);
      console.log(`[DEBUG] ${new Date().toISOString()} - Response sent successfully`);
    } catch (error) {
      console.error(`[ERROR] ${new Date().toISOString()} - Analysis error:`, error);
      console.error(`[ERROR] ${new Date().toISOString()} - Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Failed to analyze data' });
    }
  }

  public async getResults(_req: Request, res: Response): Promise<void> {
    try {
      // 暫定的に空配列を返す
      res.json([]);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Failed to get analysis results' });
    }
  }

  public async getResult(_req: Request, res: Response): Promise<void> {
    try {
      // 暫定的に404を返す
      res.status(404).json({ error: 'Analysis result not found' });
    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({ error: 'Failed to get analysis result' });
    }
  }
} 