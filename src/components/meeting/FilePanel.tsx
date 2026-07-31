import { useState, useEffect, useRef } from 'react';
import { Upload, Presentation, X, File, Image, FileText } from 'lucide-react';
import { supabase, RoomFile, RoomParticipant } from '../../lib/supabase';

interface FilePanelProps {
  roomId: string;
  me: RoomParticipant;
  presentingFile: RoomFile | null;
  onPresenting: (file: RoomFile | null) => void;
}

export default function FilePanel({ roomId, me, presentingFile, onPresenting }: FilePanelProps) {
  const [files, setFiles] = useState<RoomFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPresent = me.role === 'host' || me.role === 'co_host' || me.role === 'presenter';

  useEffect(() => {
    fetchFiles();
    const ch = supabase
      .channel(`files-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_files', filter: `room_id=eq.${roomId}` }, fetchFiles)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  async function fetchFiles() {
    const { data } = await supabase
      .from('room_files')
      .select('*')
      .eq('room_id', roomId)
      .order('uploaded_at', { ascending: false });
    setFiles(data ?? []);
    const presenting = (data ?? []).find(f => f.is_presenting);
    onPresenting(presenting ?? null);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const path = `${roomId}/${Date.now()}-${file.name}`;

    const { error: storageError } = await supabase.storage
      .from('room-files')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (storageError) {
      setUploadError('خطا در آپلود فایل');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('room-files').getPublicUrl(path);

    const fileType = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) ? 'image'
      : ['pdf'].includes(ext) ? 'pdf'
      : ['mp4', 'webm', 'mov'].includes(ext) ? 'video'
      : 'other';

    await supabase.from('room_files').insert({
      room_id: roomId,
      uploader_participant_id: me.id,
      file_name: file.name,
      file_url: publicUrl,
      file_type: fileType,
      is_presenting: false,
    });

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    fetchFiles();
  }

  async function presentFile(file: RoomFile) {
    if (!canPresent) return;
    // Stop other presentations first
    await supabase.from('room_files').update({ is_presenting: false }).eq('room_id', roomId);
    if (presentingFile?.id !== file.id) {
      await supabase.from('room_files').update({ is_presenting: true }).eq('id', file.id);
    }
    fetchFiles();
  }

  async function deleteFile(file: RoomFile) {
    await supabase.from('room_files').delete().eq('id', file.id);
    fetchFiles();
  }

  const fileIcon = (type: string) => {
    if (type === 'image') return <Image className="w-5 h-5 text-blue-400" />;
    if (type === 'pdf') return <FileText className="w-5 h-5 text-red-400" />;
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full" dir="rtl">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-white font-bold">فایل‌ها</h3>
        {canPresent && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'در حال آپلود...' : 'آپلود فایل'}
          </button>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={uploadFile} accept="image/*,.pdf,.mp4,.webm" />
      </div>

      {uploadError && (
        <div className="mx-3 mt-3 bg-red-900/30 border border-red-700 rounded-xl p-3 text-xs text-red-400">
          {uploadError}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {files.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">
            {canPresent ? 'فایلی آپلود کنید' : 'هیچ فایلی موجود نیست'}
          </p>
        )}

        {files.map(file => (
          <div
            key={file.id}
            className={`bg-slate-800 rounded-xl border p-3 ${file.is_presenting ? 'border-blue-600 bg-blue-900/20' : 'border-slate-700'}`}
          >
            <div className="flex items-start gap-3">
              {fileIcon(file.file_type)}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-slate-500 text-xs">{file.file_type}</p>
              </div>
              <div className="flex items-center gap-1">
                {canPresent && (
                  <button
                    onClick={() => presentFile(file)}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${
                      file.is_presenting ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-blue-400 hover:bg-slate-700'
                    }`}
                    title={file.is_presenting ? 'در حال ارائه' : 'ارائه این فایل'}
                  >
                    <Presentation className="w-4 h-4" />
                  </button>
                )}
                {canPresent && (
                  <button
                    onClick={() => deleteFile(file)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {file.is_presenting && (
              <div className="mt-2 text-xs text-blue-400 font-medium">در حال ارائه به همه</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
