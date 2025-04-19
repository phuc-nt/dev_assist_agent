import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ProjectConfigReader {
  private configCache: any = null;
  private readonly configPath = path.resolve('src/config/project_config_demo.json');
  
  async getProjectConfig() {
    if (this.configCache) {
      return this.configCache;
    }
    
    try {
      const configData = await fs.promises.readFile(this.configPath, 'utf8');
      this.configCache = JSON.parse(configData);
      return this.configCache;
    } catch (error) {
      throw new Error(`Failed to read project config: ${error.message}`);
    }
  }
  
  clearCache() {
    this.configCache = null;
  }
} 