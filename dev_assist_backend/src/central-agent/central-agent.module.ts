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
import { AgentCoordinator } from './agent-coordinator/agent-coordinator.service';
import { AgentFactory, MockJiraAgent, MockSlackAgent } from './agent-factory/agent-factory.service';
import { ConfigModule } from '../config/config.module';
import { ResultSynthesizerService } from './result-synthesizer/result-synthesizer.service';

@Module({
  imports: [
    OpenaiModule,
    ConfigModule,
    TypeOrmModule.forFeature([ActionPlanEntity]),
  ],
  controllers: [CentralAgentController],
  providers: [
    CentralAgentService,
    InputProcessor,
    ProjectConfigReader,
    ActionPlanner,
    ActionPlanStorageService,
    AgentCoordinator,
    MockJiraAgent,
    MockSlackAgent,
    AgentFactory,
    ResultSynthesizerService
  ],
  exports: [CentralAgentService],
})
export class CentralAgentModule {} 