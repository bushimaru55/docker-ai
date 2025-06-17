import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AnalysisResult } from '../models/AnalysisResult';
import { OllamaService } from '../services/ollamaService';

const analysisRepository = AppDataSource.getRepository(AnalysisResult);
const ollamaService = OllamaService.getInstance();

export class AnalysisController {
  public async analyzeData(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, data } = req.body;

      if (!prompt || !data) {
        res.status(400).json({ error: 'Prompt and data are required' });
        return;
      }

      // Ollamaで分析を実行
      const analysisResult = await ollamaService.analyze({ prompt, data });
      const parsedResult = JSON.parse(analysisResult);

      // 分析結果を保存
      const result = analysisRepository.create({
        title: prompt.substring(0, 100),
        fileName: (req.file as Express.Multer.File)?.originalname || 'unknown',
        promptText: prompt,
        resultText: parsedResult.text,
        graphsData: JSON.stringify(parsedResult.graphs || []),
      });

      await analysisRepository.save(result);

      res.json(result);
    } catch (error) {
      console.error('Analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze data' });
    }
  }

  public async getResults(_req: Request, res: Response): Promise<void> {
    try {
      const results = await analysisRepository.find({
        order: { createdAt: 'DESC' },
      });
      res.json(results);
    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({ error: 'Failed to get analysis results' });
    }
  }

  public async getResult(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await analysisRepository.findOne({ where: { id: Number(id) } });

      if (!result) {
        res.status(404).json({ error: 'Analysis result not found' });
        return;
      }

      res.json(result);
    } catch (error) {
      console.error('Get result error:', error);
      res.status(500).json({ error: 'Failed to get analysis result' });
    }
  }
} 