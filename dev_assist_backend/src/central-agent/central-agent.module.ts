import { Module } from '@nestjs/common';
import { CentralAgentController } from './central-agent.controller';
import { CentralAgentService } from './central-agent.service';
import { InputProcessor } from './input-processor/input-processor.service';
import { ProjectConfigReader } from './project-config/project-config-reader.service';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [CentralAgentController],
  providers: [
    CentralAgentService,
    InputProcessor,
    ProjectConfigReader,
  ],
  exports: [CentralAgentService],
})
export class CentralAgentModule {} 