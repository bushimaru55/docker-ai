import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/database';
import analysisRoutes from './routes/analysisRoutes';

const app = express();
const port = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルートの設定
app.use('/api/analysis', analysisRoutes);

// データベース接続の初期化
AppDataSource.initialize()
  .then(() => {
    console.log('Database connection initialized');
    
    // サーバーの起動
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error: Error) => {
    console.error('Error during Data Source initialization:', error);
  }); 