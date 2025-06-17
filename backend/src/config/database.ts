import { DataSource } from 'typeorm';
import { AnalysisResult } from '../models/AnalysisResult';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: process.env.DATABASE_URL || 'db/analysis.db',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  entities: [AnalysisResult],
  migrations: [],
  subscribers: [],
}); 