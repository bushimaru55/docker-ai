import express from 'express';
import cors from 'cors';
// import { AppDataSource } from './config/database';
import analysisRoutes from './routes/analysisRoutes';

const app = express();
const port = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルートの設定
app.use('/api/analysis', analysisRoutes);

// 暫定的にDB接続を無効化
console.log('Database connection skipped (temporary)');

// サーバーの起動
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// データベース接続の初期化（暫定的に無効化）
// AppDataSource.initialize()
//   .then(() => {
//     console.log('Database connection initialized');
    
//     // サーバーの起動
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     });
//   })
//   .catch((error: Error) => {
//     console.error('Error during Data Source initialization:', error);
//   }); 