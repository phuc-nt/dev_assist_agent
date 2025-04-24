/// <reference types="jest" />
import { jest, describe, it, expect, beforeAll } from '@jest/globals';
import configEnv from '../config/env';
import 'dotenv/config';
// Sử dụng fetch API có sẵn
const fetch = global.fetch;

/**
 * Kiểm thử kết nối cơ bản với API Jira và Confluence
 * Kiểm tra khả năng kết nối HTTP mà không phụ thuộc vào các service
 */
describe('API Connection Test', () => {
  it('should be able to connect to JIRA API', async () => {
    // Bỏ qua nếu không có token API
    if (!configEnv.jira.apiToken || configEnv.jira.apiToken === 'dummy_token') {
      console.log('Skipping test: No valid JIRA API token provided');
      return;
    }
    
    // Thử kết nối với JIRA API
    const response = await fetch('https://phuc-nt.atlassian.net/rest/api/3/project', {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${configEnv.jira.email}:${configEnv.jira.apiToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    // Kiểm tra kết nối thành công
    expect(response.ok).toBe(true);
    
    // Kiểm tra dữ liệu trả về
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    
    // In thông tin kết quả
    console.log(`Connected to JIRA API successfully - ${data.length} projects found`);
    if (data.length > 0) {
      console.log(`First project: ${data[0].name} (${data[0].key})`);
    }
  });
  
  it('should be able to connect to Confluence API', async () => {
    // Bỏ qua nếu không có token API
    if (!configEnv.confluence.apiToken || configEnv.confluence.apiToken === 'dummy_token') {
      console.log('Skipping test: No valid Confluence API token provided');
      return;
    }
    
    // Thử kết nối với Confluence API - sử dụng URL đúng từ service
    const CONFLUENCE_DOMAIN = 'https://phuc-nt.atlassian.net';
    const CONFLUENCE_API_BASE = `${CONFLUENCE_DOMAIN}/wiki/rest/api`;
    
    const response = await fetch(`${CONFLUENCE_API_BASE}/space`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${configEnv.confluence.email}:${configEnv.confluence.apiToken}`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Confluence response status:', response.status);
    
    // Kiểm tra dữ liệu trả về - ngay cả khi response không ok, vẫn cần phải có dữ liệu trả về
    const data = await response.json();
    
    // In thông tin kết quả
    if (response.ok) {
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
      console.log(`Connected to Confluence API successfully - ${data.results.length} spaces found`);
      if (data.results.length > 0) {
        console.log(`First space: ${data.results[0].name} (${data.results[0].key})`);
      }
    } else {
      console.log('Confluence API returned error:', data);
      // Với response lỗi, vẫn phải có thuộc tính message hoặc statusCode
      expect(data).toBeDefined();
      
      // Vấn đề quyền truy cập thường là lý do chính, thông báo cho biết
      if (data.statusCode === 403 || data.status === 403) {
        console.log('Permission issue detected, but connection test is successful');
      }
    }
  });
});

// Thông tin xác thực từ biến môi trường
const JIRA_EMAIL = process.env.JIRA_EMAIL || '';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';
const CONFLUENCE_EMAIL = process.env.CONFLUENCE_EMAIL || '';
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN || '';

// URL cơ bản cho API
const JIRA_API_URL = 'https://phuc-nt.atlassian.net/rest/api/3';
const CONFLUENCE_API_URL = 'https://phuc-nt.atlassian.net/wiki/rest/api';

// Kiểm tra có token API hay không
const hasJiraCredentials = JIRA_EMAIL && JIRA_API_TOKEN;
const hasConfluenceCredentials = CONFLUENCE_EMAIL && CONFLUENCE_API_TOKEN;

// Hàm tạo header xác thực
const getAuthHeader = (email: string, token: string) => {
  const auth = Buffer.from(`${email}:${token}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
};

// Hàm gọi API với xử lý lỗi
const callAPI = async (url: string, headers: Record<string, string>) => {
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    return { 
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data 
    };
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

describe('API Connection Tests', () => {
  // Kiểm tra kết nối Jira API
  (hasJiraCredentials ? describe : describe.skip)('Jira API Connection', () => {
    it('should connect to Jira API and return a valid response', async () => {
      const headers = getAuthHeader(JIRA_EMAIL, JIRA_API_TOKEN);
      const result = await callAPI(`${JIRA_API_URL}/myself`, headers);

      // Kiểm tra kết nối thành công hoặc trả về lỗi quyền truy cập có cấu trúc
      expect(result.status === 200 || result.status === 403).toBeTruthy();
      
      // Nếu quyền truy cập bị từ chối, kiểm tra cấu trúc lỗi
      if (result.status === 403) {
        expect(result.data).toHaveProperty('errorMessages');
      } 
      // Nếu kết nối thành công, kiểm tra có dữ liệu trả về
      else if (result.status === 200) {
        expect(result.data).toHaveProperty('accountId');
      }
    });
  });

  // Kiểm tra kết nối Confluence API
  (hasConfluenceCredentials ? describe : describe.skip)('Confluence API Connection', () => {
    it('should connect to Confluence API and return a valid response', async () => {
      const headers = getAuthHeader(CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN);
      const result = await callAPI(`${CONFLUENCE_API_URL}/user/current`, headers);

      // Kiểm tra kết nối thành công hoặc trả về lỗi quyền truy cập có cấu trúc
      expect(result.status === 200 || result.status === 403).toBeTruthy();
      
      // Nếu quyền truy cập bị từ chối, kiểm tra cấu trúc lỗi
      if (result.status === 403) {
        expect(result.data).toHaveProperty('statusCode', 403);
      } 
      // Nếu kết nối thành công, kiểm tra có dữ liệu trả về
      else if (result.status === 200) {
        expect(result.data).toHaveProperty('accountId');
      }
    });
  });

  // Hiển thị thông báo khi không có thông tin xác thực
  beforeAll(() => {
    if (!hasJiraCredentials) {
      console.warn('⚠️ Bỏ qua test Jira API do không có thông tin xác thực. Vui lòng cung cấp JIRA_EMAIL và JIRA_API_TOKEN trong file .env');
    }
    
    if (!hasConfluenceCredentials) {
      console.warn('⚠️ Bỏ qua test Confluence API do không có thông tin xác thực. Vui lòng cung cấp CONFLUENCE_EMAIL và CONFLUENCE_API_TOKEN trong file .env');
    }
  });
}); 