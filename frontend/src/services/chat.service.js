import api from './api';

const chatService = {
  getMyChats: () => api.get('/chats'),
  getChatMessages: (chatId) => api.get(`/chats/${chatId}/messages`)
};

export default chatService;
