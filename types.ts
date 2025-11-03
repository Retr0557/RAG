
export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  content: string;
}
