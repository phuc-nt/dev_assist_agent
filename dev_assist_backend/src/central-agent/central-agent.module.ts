import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentralAgentController } from './central-agent.controller';
import { CentralAgentService } from './central-agent.service';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';
import { OpenaiModule } from '../openai/openai.module';
import { ActionPlanner } from './action-planner/action-planner.service';
import { ActionPlanEntity } from './entities/action-plan.entity';
import { ActionPlanStorageService } from './file-storage/action-plan-storage.service';

@Module({
  imports: [
    OpenaiModule,
    TypeOrmModule.forFeature([ActionPlanEntity]),
  ],
  controllers: [CentralAgentController],
  providers: [
    CentralAgentService,
    InputProcessor,
    ProjectConfigReader,
    ActionPlanner,
    ActionPlanStorageService,
  ],
  exports: [CentralAgentService],
})
export class CentralAgentModule {} 