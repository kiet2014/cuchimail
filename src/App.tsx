import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient'; 
import { sendInternalEmail, getInbox } from './api/email'; 

interface Message {
  id: string; sender_email: string; recipient_email: string; 
  subject: string; body: string; created_at: string; is_read: boolean; 
}

// --- TOAST NOTIFICATION (SIÊU ĐẸP) ---
const Toast: React.FC<{ msg: string; type: 'success' | 'error'; onClose: () => void }> = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
      color: 'white', padding: '14px 28px', borderRadius: '50px', zIndex: 9999,
      boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 800, animation: 'slideUp 0.3s forwards'
    }}>
      {type === 'success' ? '✨ ' : '⚠️ '} {msg}
    </div>
  );
};

// --- AUTH SCREEN (GLASSMORPHISM) ---
const AuthScreen: React.FC<{ setToast: (t: any) => void }> = ({ setToast }) => {
  const [isSign, setIsSign] = useState(false);
  const [form, setForm] = useState({ email: '', pass: '' });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = isSign 
      ? await supabase.auth.signUp({ email: form.email, password: form.pass })
      : await supabase.auth.signInWithPassword({ email: form.email, password: form.pass });
    if (error) setToast({ m: "Lỗi kết nối. Hãy Restore dự án Supabase!", t: 'error' });
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
      <div className="slide-up" style={{ background: 'rgba(255, 255, 255, 0.9)', padding: '50px', borderRadius: '40px', width: '420px', textAlign: 'center', backdropFilter: 'blur(10px)', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1e293b', marginBottom: '10px' }}>CuchiMail</h1>
        <p style={{ color: '#64748b', marginBottom: '35px' }}>Đẳng cấp Email nội bộ</p>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <input type="email" placeholder="Email của bạn" onChange={e => setForm({...form, email: e.target.value})} required />
          <input type="password" placeholder="Mật khẩu" onChange={e => setForm({...form, pass: e.target.value})} required />
          <button type="submit" style={{ padding: '16px', background: '#6366f1', color: 'white', fontSize: '16px', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.3)' }}>
            {isSign ? 'Khởi tạo tài khoản' : 'Đăng nhập ngay'}
          </button>
        </form>
        <p onClick={() => setIsSign(!isSign)} style={{ marginTop: '25px', color: '#6366f1', cursor: 'pointer', fontWeight: 700 }}>{isSign ? 'Đã có? Đăng nhập' : 'Chưa có? Đăng ký ngay'}</p>
      </div>
    </div>
  );
};

// --- EMAIL APP (DASHBOARD) ---
const EmailApp: React.FC<{ userEmail: string; setToast: (t: any) => void }> = ({ userEmail, setToast }) => {
  const [view, setView] = useState<'inbox' | 'compose' | 'detail'>('inbox');
  const [emails, setEmails] = useState<Message[]>([]);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [composeData, setComposeData] = useState({ to: '', sub: '', body: '' });

  const fetchEmails = useCallback(async () => {
    const data = await getInbox(userEmail);
    if (data) setEmails(data as Message[]);
  }, [userEmail]);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  // HÀM REPLY (PHẢN HỒI)
  const onReply = (msg: Message) => {
    setComposeData({ 
      to: msg.sender_email, 
      sub: `Re: ${msg.subject}`, 
      body: `\n\n\n--- Trả lời thư của ${msg.sender_email} ---\n> ${msg.body}`
    });
    setView('compose');
  };

  const handleSend = async () => {
    const ok = await sendInternalEmail({ sender_email: userEmail, recipient_email: composeData.to, subject: composeData.sub, body: composeData.body });
    if (ok) { setToast({ m: 'Gửi thư thành công!', t: 'success' }); setView('inbox'); fetchEmails(); }
    else { setToast({ m: 'Lỗi gửi thư!', t: 'error' }); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* SIDEBAR */}
      <div style={{ width: '300px', background: 'white', padding: '40px 24px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#6366f1', fontWeight: 800, marginBottom: '40px', fontSize: '24px' }}>💎 CuchiMail</h2>
        <button onClick={() => { setComposeData({to:'', sub:'', body:''}); setView('compose'); }} style={{ background: '#6366f1', color: 'white', padding: '16px', borderRadius: '18px', marginBottom: '35px', boxShadow: '0 8px 15px rgba(99, 102, 241, 0.2)' }}>+ Soạn thư mới</button>
        <div onClick={() => setView('inbox')} style={{ padding: '15px 20px', borderRadius: '15px', cursor: 'pointer', background: view === 'inbox' ? '#f5f3ff' : 'transparent', color: view === 'inbox' ? '#6366f1' : '#64748b', fontWeight: 700 }}>📥 Hộp thư ({emails.length})</div>
        
        <div style={{ marginTop: 'auto', background: '#f8fafc', padding: '20px', borderRadius: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '5px' }}>USER:</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
          <button onClick={() => supabase.auth.signOut()} style={{ marginTop: '15px', color: '#ef4444', background: 'none', fontWeight: 800 }}>Đăng xuất</button>
        </div>
      </div>

      {/* CHÍNH */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto', background: '#f8fafc' }}>
        {view === 'inbox' && (
          <div className="slide-up">
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '25px' }}>Hộp thư đến</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {emails.map(m => (
                <div key={m.id} onClick={() => { setSelectedMsg(m); setView('detail'); }} style={{ padding: '24px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: '#e0e7ff', color: '#6366f1', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '18px' }}>{m.sender_email[0].toUpperCase()}</div>
                  <div style={{ marginLeft: '20px', flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '16px' }}>{m.sender_email}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{m.subject}</div>
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'compose' && (
          <div className="slide-up" style={{ maxWidth: '850px', background: 'white', padding: '45px', borderRadius: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <h2 style={{ marginBottom: '30px', fontWeight: 800 }}>Soạn thư</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <input placeholder="Gửi tới (email)" value={composeData.to} onChange={e => setComposeData({...composeData, to: e.target.value})} />
              <input placeholder="Chủ đề" value={composeData.sub} onChange={e => setComposeData({...composeData, sub: e.target.value})} />
              
              <div style={{ border: '2px solid #f1f5f9', borderRadius: '18px', padding: '15px' }}>
                <div style={{ marginBottom: '15px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', display: 'flex', gap: '10px' }}>
                   <button onClick={() => setComposeData({...composeData, body: composeData.body + " **IN ĐẬM**"})} style={{ padding: '8px 15px', background: '#f1f5f9' }}>B</button>
                   <button onClick={() => setComposeData({...composeData, body: composeData.body + " *Nghiêng*"})} style={{ padding: '8px 15px', background: '#f1f5f9' }}>I</button>
                </div>
                <textarea rows={10} style={{ border: 'none', width: '100%', padding: 0, resize: 'none' }} placeholder="Viết thư tại đây..." value={composeData.body} onChange={e => setComposeData({...composeData, body: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={handleSend} style={{ flex: 1, padding: '18px', background: '#6366f1', color: 'white' }}>Gửi ngay 🚀</button>
                <button onClick={() => setView('inbox')} style={{ padding: '18px 30px', background: '#f1f5f9', color: '#64748b' }}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {view === 'detail' && selectedMsg && (
          <div className="slide-up" style={{ background: 'white', padding: '50px', borderRadius: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <button onClick={() => setView('inbox')} style={{ background: 'none', color: '#6366f1', marginBottom: '30px', padding: 0 }}>← Trở lại</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '45px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 800 }}>{selectedMsg.subject}</h1>
                <p style={{ color: '#94a3b8', marginTop: '12px' }}>Từ: <strong style={{color: '#1e293b'}}>{selectedMsg.sender_email}</strong></p>
              </div>
              <button onClick={() => onReply(selectedMsg)} style={{ background: '#f5f3ff', color: '#6366f1', padding: '14px 28px', borderRadius: '16px' }}>↩️ Phản hồi (Reply)</button>
            </div>
            <div style={{ lineHeight: 1.8, fontSize: '17px', color: '#334155', whiteSpace: 'pre-wrap', background: '#f8fafc', padding: '35px', borderRadius: '30px', border: '1px solid #f1f5f9' }}>
              {selectedMsg.body}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [toast, setToast] = useState<{ m: string, t: 'success' | 'error' } | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);
  return (
    <>
      {toast && <Toast msg={toast.m} type={toast.t} onClose={() => setToast(null)} />}
      {session ? <EmailApp userEmail={session.user.email} setToast={setToast} /> : <AuthScreen setToast={setToast} />}
    </>
  );
}