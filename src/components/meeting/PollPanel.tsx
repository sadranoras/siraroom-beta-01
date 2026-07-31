import { useState, useEffect } from 'react';
import { Plus, CircleCheck as CheckCircle, ChartBar as BarChart2, X } from 'lucide-react';
import { supabase, Poll, PollOption, RoomParticipant } from '../../lib/supabase';

interface PollPanelProps {
  roomId: string;
  me: RoomParticipant;
}

export default function PollPanel({ roomId, me }: PollPanelProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, string>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);
  const [creating, setCreating] = useState(false);

  const canCreate = me.role === 'host' || me.role === 'co_host';

  useEffect(() => {
    fetchPolls();
    fetchMyVotes();

    const pollChannel = supabase
      .channel(`polls-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'polls', filter: `room_id=eq.${roomId}` }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_options' }, fetchPolls)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, fetchMyVotes)
      .subscribe();

    return () => { supabase.removeChannel(pollChannel); };
  }, [roomId]);

  async function fetchPolls() {
    const { data: pollData } = await supabase
      .from('polls')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false });

    if (!pollData) return;

    const pollsWithOptions = await Promise.all(
      pollData.map(async poll => {
        const { data: options } = await supabase
          .from('poll_options')
          .select('*')
          .eq('poll_id', poll.id)
          .order('id');
        return { ...poll, options: options ?? [] };
      })
    );
    setPolls(pollsWithOptions);
  }

  async function fetchMyVotes() {
    const { data } = await supabase
      .from('poll_votes')
      .select('poll_id, option_id')
      .eq('participant_id', me.id);
    const votes: Record<string, string> = {};
    (data ?? []).forEach(v => { votes[v.poll_id] = v.option_id; });
    setMyVotes(votes);
  }

  async function vote(poll: Poll, optionId: string) {
    if (myVotes[poll.id]) return;
    await supabase.from('poll_votes').insert({
      poll_id: poll.id,
      option_id: optionId,
      participant_id: me.id,
    });
    await supabase.from('poll_options').update({
      vote_count: (poll.options?.find(o => o.id === optionId)?.vote_count ?? 0) + 1
    }).eq('id', optionId);
    setMyVotes(prev => ({ ...prev, [poll.id]: optionId }));
    fetchPolls();
  }

  async function closePoll(pollId: string) {
    await supabase.from('polls').update({ is_active: false }).eq('id', pollId);
    fetchPolls();
  }

  async function createPoll() {
    const validOptions = newOptions.filter(o => o.trim());
    if (!newQuestion.trim() || validOptions.length < 2) return;
    setCreating(true);

    const { data: poll } = await supabase
      .from('polls')
      .insert({ room_id: roomId, creator_participant_id: me.id, question: newQuestion.trim() })
      .select()
      .single();

    if (poll) {
      await supabase.from('poll_options').insert(
        validOptions.map(text => ({ poll_id: poll.id, option_text: text.trim() }))
      );
    }

    setNewQuestion('');
    setNewOptions(['', '']);
    setShowCreate(false);
    setCreating(false);
    fetchPolls();
  }

  const totalVotes = (options: PollOption[]) => options.reduce((s, o) => s + o.vote_count, 0);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-bold">نظرسنجی</h3>
        {canCreate && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300"
          >
            <Plus className="w-4 h-4" />
            ایجاد نظرسنجی
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && canCreate && (
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 space-y-3">
          <input
            type="text"
            value={newQuestion}
            onChange={e => setNewQuestion(e.target.value)}
            placeholder="سؤال نظرسنجی..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="space-y-2">
            {newOptions.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={e => {
                    const next = [...newOptions];
                    next[i] = e.target.value;
                    setNewOptions(next);
                  }}
                  placeholder={`گزینه ${i + 1}`}
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newOptions.length > 2 && (
                  <button onClick={() => setNewOptions(prev => prev.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setNewOptions(prev => [...prev, ''])}
              className="text-xs text-slate-400 hover:text-white"
            >
              + افزودن گزینه
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-2 text-sm text-slate-400 border border-slate-600 rounded-xl hover:bg-slate-700">
              انصراف
            </button>
            <button
              onClick={createPoll}
              disabled={creating || !newQuestion || newOptions.filter(o => o.trim()).length < 2}
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40"
            >
              {creating ? '...' : 'ایجاد'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {polls.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">
            {canCreate ? 'نظرسنجی جدیدی ایجاد کنید' : 'هیچ نظرسنجی‌ای وجود ندارد'}
          </p>
        )}

        {polls.map(poll => {
          const total = totalVotes(poll.options ?? []);
          const myVote = myVotes[poll.id];
          const voted = !!myVote;
          const showResults = voted || !poll.is_active || canCreate;

          return (
            <div key={poll.id} className={`bg-slate-800 rounded-2xl p-4 border ${poll.is_active ? 'border-blue-700/50' : 'border-slate-700'}`}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 className={`w-4 h-4 flex-shrink-0 ${poll.is_active ? 'text-blue-400' : 'text-slate-500'}`} />
                  <h4 className="text-white text-sm font-medium">{poll.question}</h4>
                </div>
                {canCreate && poll.is_active && (
                  <button onClick={() => closePoll(poll.id)} className="text-xs text-slate-500 hover:text-red-400 flex-shrink-0">
                    پایان
                  </button>
                )}
              </div>

              {!poll.is_active && <p className="text-slate-500 text-xs mb-3">پایان یافته • {total} رأی</p>}

              <div className="space-y-2">
                {(poll.options ?? []).map(option => {
                  const pct = total > 0 ? Math.round((option.vote_count / total) * 100) : 0;
                  const isMyVote = myVote === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => poll.is_active && !voted && vote(poll, option.id)}
                      disabled={!poll.is_active || voted}
                      className={`w-full text-right relative overflow-hidden rounded-xl transition-all ${
                        !voted && poll.is_active
                          ? 'hover:bg-slate-700 border border-slate-600 hover:border-blue-500'
                          : isMyVote
                          ? 'border border-blue-600'
                          : 'border border-slate-700'
                      } ${!voted && poll.is_active ? 'p-3' : 'p-3'}`}
                    >
                      {showResults && (
                        <div
                          className={`absolute inset-0 ${isMyVote ? 'bg-blue-900/40' : 'bg-slate-700/40'}`}
                          style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                        />
                      )}
                      <div className="relative flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-200">{option.option_text}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isMyVote && <CheckCircle className="w-4 h-4 text-blue-400" />}
                          {showResults && <span className="text-xs text-slate-400">{pct}%</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {poll.is_active && !voted && (
                <p className="text-slate-500 text-xs mt-3 text-center">برای رأی دادن یک گزینه انتخاب کنید</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
