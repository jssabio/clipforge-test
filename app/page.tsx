'use client';

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

type Preset = 'balanced' | 'high' | 'small';
const fmt = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [inputUrl, setInputUrl] = useState('');
  const [preset, setPreset] = useState<Preset>('balanced');
  const [resolution, setResolution] = useState('1080');
  const [fps, setFps] = useState('30');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [outputUrl, setOutputUrl] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const originalUrlRef = useRef('');

  useEffect(() => () => {
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
  }, [outputUrl]);

  function selectFile(next: File | undefined) {
    if (!next) return;
    if (!next.type.startsWith('video/')) { setStatus('Please choose a video file.'); return; }
    if (next.size > 1024 * 1024 * 1024) { setStatus('This starter app supports files up to 1 GB.'); return; }
    if (originalUrlRef.current) URL.revokeObjectURL(originalUrlRef.current);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    const url = URL.createObjectURL(next);
    originalUrlRef.current = url;
    setFile(next); setOutputUrl(''); setOutputSize(null); setProgress(0); setStatus('Video ready to process.');
  }
  function onInput(e: ChangeEvent<HTMLInputElement>) { selectFile(e.target.files?.[0]); }
  function onDrop(e: DragEvent<HTMLDivElement>) { e.preventDefault(); setDragging(false); selectFile(e.dataTransfer.files?.[0]); }

  async function compress() {
    if (!file) { setStatus('Choose a video file first.'); return; }
    setBusy(true); setProgress(0); setStatus('Starting the video engine…');
    try {
      let ffmpeg = ffmpegRef.current;
      if (!ffmpeg) {
        ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => setProgress(Math.max(0, Math.min(99, Math.round(progress * 100)))));
        ffmpeg.on('log', ({ message }) => { if (message.includes('Error')) setStatus(message); });
        const base = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd';
        await ffmpeg.load({ coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'), wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm') });
        ffmpegRef.current = ffmpeg;
      }
      setStatus('Compressing in your browser…');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4';
      const inputName = `input.${ext.replace(/[^a-z0-9]/g, '')}`;
      await ffmpeg.writeFile(inputName, await fetchFile(file));
      const crf = preset === 'high' ? '20' : preset === 'small' ? '30' : '25';
      const maxHeight = resolution === 'source' ? null : Number(resolution);
      const filters = maxHeight ? ['-vf', `scale=-2:'min(${maxHeight},ih)'`] : [];
      const args = ['-i', inputName, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, ...filters, '-r', fps, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', 'output.mp4'];
      await ffmpeg.exec(args);
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data as BlobPart], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(url); setOutputSize(blob.size); setProgress(100); setStatus('Your processed video is ready.');
      await ffmpeg.deleteFile(inputName); await ffmpeg.deleteFile('output.mp4');
    } catch (err) {
      console.error(err);
      setStatus('Could not process this video. Try a supported video format, a smaller file, or a modern desktop browser.');
    } finally { setBusy(false); }
  }

  const saving = file && outputSize !== null ? Math.round((1 - outputSize / file.size) * 100) : null;

  return <main className="shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">C</span><span>clipforge<span className="brand-dot">.</span></span></a><nav><a href="#studio">Studio</a><a href="#how">How it works</a><span className="local-pill"><i/> Local processing</span></nav></header>
    <section className="hero"><div className="eyebrow"><span className="eyebrow-line"/> VIDEO PREP STUDIO</div><h1>Make every frame<br/><span>work harder.</span></h1><p className="hero-copy">Get your video ready to post. Fine-tune resolution, frame rate, and file size with a simple workflow that runs right in your browser.</p><div className="hero-meta"><span><b>01</b> Upload</span><span className="meta-arrow">→</span><span><b>02</b> Tune</span><span className="meta-arrow">→</span><span><b>03</b> Export</span></div></section>
    <section className="workspace" id="studio"><div className="workspace-head"><div><div className="section-kicker">THE WORKSPACE</div><h2>Prepare your video</h2></div><span className="step-tag">STEP 01 — 03</span></div>
      <div className="studio-grid"><div className="left-column"><div className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`} onDragOver={e => {e.preventDefault();setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        {file ? <><div className="file-icon"><span>MP4</span></div><div className="file-name">{file.name}</div><div className="file-detail">{fmt(file.size)} · {file.type || 'Video file'}</div><button className="text-button" onClick={() => inputRef.current?.click()}>Choose a different file</button></> : <><div className="upload-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg></div><h3>Drop your video here</h3><p>or browse files from your device</p><button className="primary-button" onClick={() => inputRef.current?.click()}>Choose video <span>↗</span></button><small>MP4, MOV, WebM and other browser-readable video formats · Up to 1 GB</small></>}
        <input ref={inputRef} type="file" accept="video/*" onChange={onInput} hidden/>
      </div>
      {file && <div className="preview-card"><div className="preview-title">SOURCE PREVIEW <span>ORIGINAL</span></div><video src={originalUrlRef.current} controls playsInline className="video-preview"/><div className="preview-footer"><span>{file.name}</span><strong>{fmt(file.size)}</strong></div></div>}
      <div className="privacy-note"><span className="lock">⌑</span><div><strong>Your files stay yours.</strong><p>Video processing runs locally in your browser. Files are not uploaded to our server.</p></div></div>
      </div>
      <div className="settings-panel"><div className="panel-title"><div><div className="section-kicker">CUSTOMIZE OUTPUT</div><h3>Processing settings</h3></div><span className="settings-icon">☷</span></div>
        <div className="field"><div className="field-heading"><label>Quality profile</label><span className="muted">Choose a balance</span></div><div className="preset-list">
          <button className={`preset ${preset === 'small' ? 'selected' : ''}`} onClick={() => setPreset('small')}><span className="radio-dot"/><span className="preset-text"><b>Smaller file</b><small>Prioritize size</small></span><span className="preset-value">30 CRF</span></button>
          <button className={`preset ${preset === 'balanced' ? 'selected' : ''}`} onClick={() => setPreset('balanced')}><span className="radio-dot"/><span className="preset-text"><b>Balanced</b><small>Everyday sharing</small></span><span className="recommended">POPULAR</span></button>
          <button className={`preset ${preset === 'high' ? 'selected' : ''}`} onClick={() => setPreset('high')}><span className="radio-dot"/><span className="preset-text"><b>Higher quality</b><small>Preserve more detail</small></span><span className="preset-value">20 CRF</span></button>
        </div></div>
        <div className="field"><div className="field-heading"><label>Maximum resolution</label><span className="muted">Vertical or landscape</span></div><div className="select-wrap"><select value={resolution} onChange={e => setResolution(e.target.value)}><option value="source">Keep source resolution</option><option value="2160">Up to 4K · 2160p</option><option value="1080">Up to Full HD · 1080p</option><option value="720">Up to HD · 720p</option><option value="480">Up to SD · 480p</option></select><span>⌄</span></div></div>
        <div className="field"><div className="field-heading"><label>Frame rate</label><span className="muted">Frames per second</span></div><div className="fps-options">{['24','30','60','120'].map(v => <button key={v} onClick={() => setFps(v)} className={fps === v ? 'active' : ''}>{v} <small>FPS</small></button>)}</div><p className="hint">120 FPS is available for high-frame-rate output. For genuinely smooth 120 FPS motion, your source video should already contain 120 FPS footage; lower-frame-rate clips may have duplicated frames.</p></div>
        <div className="action-area"><button className="process-button" onClick={compress} disabled={busy || !file}>{busy ? <><span className="spinner"/> Processing video…</> : <>Process video <span>→</span></>}</button>{busy && <div className="progress-wrap"><div className="progress-label"><span>Processing locally</span><b>{progress}%</b></div><div className="progress-track"><div style={{width:`${progress}%`}}/></div></div>}{status && <p className={`status ${status.startsWith('Could not') || status.startsWith('Please') || status.startsWith('Choose') ? 'error' : ''}`}>{status}</p>}</div>
      </div></div>
      {outputUrl && <div className="result-panel"><div className="result-icon">✓</div><div className="result-main"><div className="section-kicker">EXPORT COMPLETE</div><h3>Your video is ready</h3><p>{fmt(file!.size)} original → {fmt(outputSize!)} processed {saving !== null && saving > 0 ? `· ${saving}% smaller` : ''}</p><video src={outputUrl} controls playsInline className="video-preview result-video"/><a className="download-button" href={outputUrl} download={`${file!.name.replace(/\.[^.]+$/, '')}-clipforge.mp4`}>Download MP4 <span>↓</span></a></div></div>}
    </section>
    <section className="how-section" id="how"><div className="section-kicker">BUILT FOR A SIMPLE WORKFLOW</div><h2>Less friction. More focus.</h2><div className="feature-grid"><article><span className="feature-num">01</span><div className="feature-icon">◈</div><h3>Browser-first</h3><p>Your selected video is processed on your device, rather than sent to an app server.</p></article><article><span className="feature-num">02</span><div className="feature-icon">⌁</div><h3>Control the output</h3><p>Choose a quality profile, maximum resolution, and frame rate before export.</p></article><article><span className="feature-num">03</span><div className="feature-icon">↗</div><h3>Ready to share</h3><p>Preview the result and download an MP4 copy when processing finishes.</p></article></div></section>
    <footer><a className="brand footer-brand" href="#"><span className="brand-mark">C</span><span>clipforge<span className="brand-dot">.</span></span></a><span>Video prep, made simple.</span><span>Files stay on your device.</span></footer>
  </main>;
}
