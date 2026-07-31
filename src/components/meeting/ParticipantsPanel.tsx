import { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Monitor, Crown, MoveVertical as MoreVertical, UserX, CircleArrowUp as ArrowUpCircle, Hand } from 'lucide-react';
import { supabase, RoomParticipant, ParticipantRole, roleLabel, defaultPermissionsForRole } from '../../lib/supabase';

interface ParticipantsPanelProps {
  participants: RoomParticipant[];
  me: RoomParticipant;
  raisedHands: Set<string>;
  onParticipantUpdated: () => void;
}

export default function ParticipantsPanel({ participants, me, raisedHands, onParticipantUpdated }: ParticipantsPanelProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const isHost = me.role === 'host';
  const isCoHost = me.role === 'co_host';
  const canManage = isHost || isCoHost;

  async function changeRole(participant: RoomParticipant, newRole: ParticipantRole) {
    if (!canManage) return;
    if (participant.role === 'host') return; // Cannot change host role
    if (newRole === 'host') return; // Cannot make someone else host this way

    const perms = defaultPermissionsForRole(newRole);
    await supabase
      .from('room_participants')
      .update({ role: newRole, ...perms })
      .eq('id', participant.id);
    onParticipantUpdated();
    setOpenMenu(null);
  }

  async function togglePermission(participant: RoomParticipant, perm: 'can_use_mic' | 'can_use_webcam' | 'can_share_screen') {
    if (!canManage) return;
    const newVal = !participant[perm];
    const update: Partial<RoomParticipant> = { [perm]: newVal };
    if (!newVal) {
      if (perm === 'can_use_mic') update.is_mic_on = false;
      if (perm === 'can_use_webcam') update.is_webcam_on = false;
      if (perm === 'can_share_screen') update.is_screen_sharing = false;
    }
    await supabase.from('room_participants').update(update).eq('id', participant.id);
    onParticipantUpdated();
  }

  async function removeParticipant(participant: RoomParticipant) {
    if (!isHost) return;
    await supabase
      .from('room_participants')
      .update({ status: 'removed' })
      .eq('id', participant.id);
    onParticipantUpdated();
    setOpenMenu(null);
  }

  async function makeCoHost(participant: RoomParticipant) {
    if (!isHost) return;
    await changeRole(participant, 'co_host');
  }

  async function revokeCoHost(participant: RoomParticipant) {
    if (!isHost) return;
    await changeRole(participant, 'attendee');
  }

  const active = participants.filter(p => p.status === 'active');
  const waiting = participants.filter(p => p.status === 'waiting');

  const roleOrder: Record<ParticipantRole, number> = { host: 0, co_host: 1, presenter: 2, attendee: 3 };
  const sorted = [...active].sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-4 border-b border-slate-700">
        <h3 className="text-white font-bold">شرکت‌کنندگان ({active.length})</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {waiting.length > 0 && (
          <div className="mb-3">
            <p className="text-slate-500 text-xs font-medium px-2 mb-1">در انتظار ({waiting.length})</p>
            {waiting.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-900/20 border border-amber-800/30 mb-1">
                <div className="w-8 h-8 rounded-full bg-amber-700 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {p.display_name[0].toUpperCase()}
                </div>
                <span className="text-amber-300 text-sm flex-1 truncate">{p.display_name}</span>
                <span className="text-amber-500 text-xs">انتظار</span>
              </div>
            ))}
          </div>
        )}

        {sorted.map(p => (
          <div
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 group hover:bg-slate-700/50 transition-colors relative ${p.id === me.id ? 'bg-slate-700/30' : ''}`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                p.role === 'host' ? 'bg-amber-600 text-white' :
                p.role === 'co_host' ? 'bg-blue-600 text-white' :
                p.role === 'presenter' ? 'bg-emerald-600 text-white' :
                'bg-slate-600 text-slate-300'
              }`}>
                {p.display_name[0].toUpperCase()}
              </div>
              {p.role === 'host' && (
                <Crown className="w-3 h-3 text-amber-400 absolute -top-0.5 -right-0.5" />
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm truncate">{p.display_name}{p.id === me.id ? ' (شما)' : ''}</span>
                {raisedHands.has(p.id) && <Hand className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
              </div>
              <span className={`text-xs ${
                p.role === 'host' ? 'text-amber-400' :
                p.role === 'co_host' ? 'text-blue-400' :
                p.role === 'presenter' ? 'text-emerald-400' :
                'text-slate-500'
              }`}>
                {roleLabel(p.role)}
              </span>
            </div>

            {/* Status icons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {p.is_mic_on ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-slate-600" />}
              {p.is_webcam_on ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-slate-600" />}
              {p.is_screen_sharing && <Monitor className="w-3.5 h-3.5 text-blue-400" />}
            </div>

            {/* Management menu - only show for others when canManage */}
            {canManage && p.id !== me.id && p.role !== 'host' && (
              <div className="relative">
                <button
                  onClick={() => setOpenMenu(openMenu === p.id ? null : p.id)}
                  className="p-1.5 rounded-lg hover:bg-slate-600 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {openMenu === p.id && (
                  <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-slate-600 rounded-xl shadow-xl z-20">
                    <div className="p-1">
                      {/* Permissions */}
                      <p className="text-slate-500 text-xs px-3 py-1.5">مجوزها</p>
                      {[
                        { key: 'can_use_mic' as const, label: 'میکروفن', icon: Mic },
                        { key: 'can_use_webcam' as const, label: 'دوربین', icon: Video },
                        { key: 'can_share_screen' as const, label: 'اشتراک صفحه', icon: Monitor },
                      ].map(perm => (
                        <button
                          key={perm.key}
                          onClick={() => togglePermission(p, perm.key)}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg hover:bg-slate-700 text-sm text-slate-300"
                        >
                          <div className="flex items-center gap-2">
                            <perm.icon className="w-4 h-4" />
                            {perm.label}
                          </div>
                          <div className={`w-8 h-4 rounded-full transition-colors ${p[perm.key] ? 'bg-blue-600' : 'bg-slate-600'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white mt-0.5 transition-transform ${p[perm.key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        </button>
                      ))}

                      <div className="border-t border-slate-700 my-1" />

                      {/* Role changes */}
                      <p className="text-slate-500 text-xs px-3 py-1.5">نقش</p>
                      {[
                        { role: 'presenter' as ParticipantRole, label: 'ارائه‌دهنده' },
                        { role: 'attendee' as ParticipantRole, label: 'شرکت‌کننده' },
                      ].map(r => (
                        <button
                          key={r.role}
                          onClick={() => changeRole(p, r.role)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-right ${p.role === r.role ? 'text-blue-400 bg-blue-900/20' : 'text-slate-300 hover:bg-slate-700'}`}
                        >
                          {p.role === r.role && <span className="text-blue-400">✓</span>}
                          {r.label}
                        </button>
                      ))}

                      {isHost && (
                        <>
                          {p.role !== 'co_host' ? (
                            <button
                              onClick={() => makeCoHost(p)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700"
                            >
                              <ArrowUpCircle className="w-4 h-4 text-blue-400" />
                              همکار میزبان
                            </button>
                          ) : (
                            <button
                              onClick={() => revokeCoHost(p)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-400 hover:bg-slate-700"
                            >
                              لغو همکار میزبان
                            </button>
                          )}
                          <div className="border-t border-slate-700 my-1" />
                          <button
                            onClick={() => removeParticipant(p)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-900/20"
                          >
                            <UserX className="w-4 h-4" />
                            اخراج از کلاس
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
