import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ActionPlan, PlanStatus } from '../models/action-plan.model';

@Entity('action_plans')
export class ActionPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  userId: string;

  @Column({ nullable: false })
  originalMessage: string;

  @Column({ type: 'text', nullable: false })
  processedInput: string;

  @Column({ type: 'json', nullable: false })
  plan: ActionPlan;

  @Column({
    type: 'varchar',
    length: 50,
    default: PlanStatus.CREATED,
  })
  status: string;

  @Column({ default: 0 })
  overallProgress: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 