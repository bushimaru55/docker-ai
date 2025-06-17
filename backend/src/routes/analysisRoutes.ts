import { Router } from 'express';
import { AnalysisController } from '../controllers/analysisController';
import multer from 'multer';

const router = Router();
const analysisController = new AnalysisController();
const upload = multer({ dest: 'uploads/' });

// データ分析を実行
router.post('/analyze', upload.single('file'), analysisController.analyzeData.bind(analysisController));

// 分析結果一覧を取得
router.get('/results', analysisController.getResults.bind(analysisController));

// 特定の分析結果を取得
router.get('/results/:id', analysisController.getResult.bind(analysisController));

export default router; 