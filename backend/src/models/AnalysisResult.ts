import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AnalysisResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title: string;

  @Column()
  fileName: string;

  @Column('text')
  promptText: string;

  @Column('text')
  resultText: string;

  @Column('text', { nullable: true })
  graphsData: string;

  @CreateDateColumn()
  createdAt: Date;
} 