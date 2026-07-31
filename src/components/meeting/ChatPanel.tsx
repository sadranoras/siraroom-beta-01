import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { supabase, RoomMessage, RoomParticipant } from '../../lib/supabase';

interface ChatPanelProps {
  roomId: string;
  me: RoomParticipant;
}

export default function ChatPanel({ roomId, me }: ChatPanelProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel(`chat-${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as RoomMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchMessages() {
    const { data } = await supabase
      .from('room_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data ?? []);
  }

  async function sendMessage() {
    if (!text.trim() || sending) return;
    setSending(true);
    await supabase.from('room_messages').insert({
      room_id: roomId,
      participant_id: me.id,
      display_name: me.display_name,
      message: text.trim(),
    });
    setText('');
    setSending(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-bold">چت</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">هنوز پیامی ارسال نشده است</p>
        )}
        {messages.map(msg => {
          const isMe = msg.participant_id === me.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs text-slate-400 font-medium">{msg.display_name}</span>
                <span className="text-xs text-slate-600">{formatTime(msg.created_at)}</span>
              </div>
              <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                isMe ? 'bg-blue-600 text-white rounded-tl-sm' : 'bg-slate-700 text-slate-200 rounded-tr-sm'
              }`}>
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="پیام بنویسید..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
