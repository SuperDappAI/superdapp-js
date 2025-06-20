import axios, { AxiosRequestConfig } from 'axios';
import { BotConfig } from '../types';

export async function request(
  method: string,
  path: string,
  body?: any,
  config?: BotConfig
) {
  const baseUrl = config?.baseUrl || process.env.API_BASE_URL;
  const token = config?.apiToken || process.env.API_TOKEN;
  if (!baseUrl || !token) throw new Error('Missing API base URL or token');

  const url = `${baseUrl}/bot-${token}/${path}`;
  const axiosConfig: AxiosRequestConfig = {
    method: method as any,
    url,
    headers: { 'Content-Type': 'application/json' },
    ...(body && { data: body }),
  };
  const response = await axios(axiosConfig);
  return response.data;
}
