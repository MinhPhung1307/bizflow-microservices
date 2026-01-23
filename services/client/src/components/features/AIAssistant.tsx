'use client';

import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';

interface AIAssistantProps {
    onProcessCommand: (data: any) => void;
}

export const AIAssistant = ({ onProcessCommand }: AIAssistantProps) => {
  const [messages, setMessages] = useState<any[]>([
    { id: 1, type: 'bot', text: 'Chào bạn! Tôi là trợ lý BizFlow. Bạn có thể nói: "Bán 10 bao xi măng cho anh Ba ghi nợ".' }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsgs = [...messages, { id: Date.now(), type: 'user', text: input }];
    setMessages(newMsgs);
    setInput('');
    setTimeout(() => {
      if (input.toLowerCase().includes('xi măng') && input.toLowerCase().includes('anh ba')) {
         setMessages(prev => [...prev, { 
           id: Date.now() + 1, 
           type: 'bot', 
           text: 'Tôi đã hiểu: Bán 5 bao Xi măng Hà Tiên cho Anh Ba (Ghi nợ). Đã tạo đơn nháp!',
           action: 'view_draft'
         }]);
         onProcessCommand({ customerId: 1, items: [{ productId: 1, qty: 5 }] });
      } else {
        setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', text: 'Tôi đang học hỏi. Bạn vui lòng thử lệnh cụ thể hơn.' }]);
      }
    }, 1000);
  };

  const toggleRecord = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInput('Lấy cho anh Ba 5 bao xi măng Hà Tiên nợ cũ nha');
      }, 2000); 
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-2xl mx-auto bg-white border-x border-slate-200 shadow-sm animate-fade-in">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
          <Mic size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Trợ lý ảo BizFlow</h3>
          <p className="text-sm text-slate-500">Hỗ trợ tạo đơn nhanh & Tra cứu công nợ</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
              msg.type === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
            }`}>
              <p className="leading-relaxed">{msg.text}</p>
              {msg.action && (
                <button className="mt-3 w-full py-2 px-4 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                  Xem đơn nháp
                </button>
              )}
            </div>
          </div>
        ))}
        {isRecording && (
          <div className="flex justify-center my-4">
             <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <span className="text-sm font-medium text-slate-600">Đang nghe...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2 items-center bg-slate-100 p-2 rounded-full border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all">
          <button 
            onClick={toggleRecord}
            className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-100 text-red-600' : 'bg-white text-slate-500 hover:text-blue-600 shadow-sm'}`}
          >
            <Mic size={20} />
          </button>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Nhập hoặc nói lệnh..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 px-2"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};