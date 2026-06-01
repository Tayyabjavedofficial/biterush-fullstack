import { useState, useEffect, useRef } from "react";
import { X, Send, Mic, Square, Lock } from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import { api } from "./api.js";
import { getKeypair, deriveSharedKey, encryptBytes, decryptBytes, enc, dec } from "./crypto.js";

// End-to-end encrypted chat for a single order (customer <-> restaurant owner).
export function OrderChat({ orderId, onClose }) {
  const { user } = useAuth();
  const [peer, setPeer] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sending, setSending] = useState(false);

  const keyRef = useRef(null);       // derived AES-GCM key
  const decoded = useRef(new Map()); // message id -> decoded {…}
  const recorder = useRef(null);
  const chunks = useRef([]);
  const scroller = useRef(null);
  const poll = useRef(null);

  const decryptOne = async (m) => {
    if (decoded.current.has(m.id)) return;
    const base = { id: m.id, mine: String(m.sender_id) === String(user.id), name: m.sender_name, time: m.created_at, type: m.type };
    try {
      const bytes = await decryptBytes(keyRef.current, m.ciphertext, m.iv);
      if (m.type === "voice") {
        const url = URL.createObjectURL(new Blob([bytes], { type: m.mime || "audio/webm" }));
        decoded.current.set(m.id, { ...base, url });
      } else {
        decoded.current.set(m.id, { ...base, text: dec(bytes) });
      }
    } catch {
      decoded.current.set(m.id, { ...base, text: "[unable to decrypt]" });
    }
  };

  const refresh = async () => {
    try {
      const res = await api.getMessages(orderId);
      setPeer(res.peer);
      if (!res.peer || !res.peer.pubkey) {
        setErr("The restaurant hasn't enabled chat yet (they need to sign in once).");
        setReady(false);
        return;
      }
      if (!keyRef.current) {
        const { privKey } = await getKeypair();
        keyRef.current = await deriveSharedKey(privKey, JSON.parse(res.peer.pubkey));
      }
      for (const m of res.messages) await decryptOne(m);
      const ordered = res.messages.map((m) => decoded.current.get(m.id)).filter(Boolean);
      setMsgs(ordered);
      setErr("");
      setReady(true);
    } catch (e) {
      setErr(e.message || "Couldn't load chat");
    }
  };

  useEffect(() => {
    refresh();
    poll.current = setInterval(refresh, 4000);
    return () => {
      clearInterval(poll.current);
      decoded.current.forEach((d) => d.url && URL.revokeObjectURL(d.url));
      decoded.current.clear();
      if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [msgs.length]);

  const sendText = async () => {
    const text = input.trim();
    if (!text || !keyRef.current) return;
    setSending(true); setInput("");
    try {
      const { ciphertext, iv } = await encryptBytes(keyRef.current, enc(text));
      await api.sendMessage(orderId, { type: "text", ciphertext, iv });
      await refresh();
    } catch (e) { setErr(e.message || "Failed to send"); setInput(text); }
    finally { setSending(false); }
  };

  const startRec = async () => {
    if (!keyRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        try {
          setSending(true);
          const buf = new Uint8Array(await blob.arrayBuffer());
          const { ciphertext, iv } = await encryptBytes(keyRef.current, buf);
          await api.sendMessage(orderId, { type: "voice", ciphertext, iv, mime: blob.type });
          await refresh();
        } catch (e) { setErr(e.message || "Failed to send voice note"); }
        finally { setSending(false); }
      };
      recorder.current = mr;
      mr.start();
      setRecording(true);
      // hard cap at 60s
      setTimeout(() => { if (mr.state !== "inactive") mr.stop(); }, 60000);
    } catch {
      setErr("Microphone permission denied.");
    }
  };
  const stopRec = () => { if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop(); setRecording(false); };

  return (
    <div className="chat-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="chat-modal glass">
        <div className="chat-head">
          <div>
            <h3>{peer?.name || "Restaurant"}</h3>
            <div className="chat-e2e"><Lock size={11} /> End-to-end encrypted · #{String(orderId).slice(-5)}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="chat-body" ref={scroller}>
          {err && <div className="err" style={{ margin: "4px 0" }}>{err}</div>}
          {ready && msgs.length === 0 && !err && (
            <div className="chat-empty">No messages yet. Ask the restaurant anything — is the food fresh, halal, spicy?</div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={"chat-bubble" + (m.mine ? " mine" : "")}>
              {m.type === "voice"
                ? <audio controls src={m.url} className="chat-audio" />
                : <span>{m.text}</span>}
              <span className="chat-time">{new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>

        <div className="chat-input">
          <input
            value={input}
            disabled={!ready || sending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendText(); } }}
            placeholder={ready ? "Type a message…" : "Chat unavailable"}
          />
          {recording ? (
            <button className="icon-btn rec" onClick={stopRec} title="Stop & send"><Square size={16} /></button>
          ) : (
            <button className="icon-btn" onClick={startRec} disabled={!ready || sending} title="Record voice note"><Mic size={16} /></button>
          )}
          <button className="icon-btn send" onClick={sendText} disabled={!ready || sending || !input.trim()} title="Send"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
