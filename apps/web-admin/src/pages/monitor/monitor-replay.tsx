import { Button } from '@go-tech-frontend/ui';
import type { ReplayEvent } from '@go-tech/monitor-contract';
import { Replayer } from '@rrweb/replay';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
// oxlint-disable-next-line import/no-unassigned-import -- Required rrweb cursor and sandbox presentation styles.
import '@rrweb/replay/dist/style.css';

function time(value: number) {
  const seconds = Math.floor(Math.max(0, Number.isFinite(value) ? value : 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function MonitorReplay({ errorTimestamp, events }: { errorTimestamp: number; events: ReplayEvent[] }) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<Replayer | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorPosition, setErrorPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    const root = host.current;
    if (!root) return;
    setFailure('');
    setPosition(0);
    setPlaying(false);
    let replayer: Replayer;
    try {
      // The API validates the report's JSON envelope. rrweb owns its discriminated
      // event payload types; malformed payloads are contained by this adapter.
      replayer = new Replayer(events as ConstructorParameters<typeof Replayer>[0], {
        root,
        skipInactive: false,
        showWarning: false,
        showDebug: false,
        UNSAFE_replayCanvas: false
      });
    } catch {
      setFailure('這段回放無法還原，仍可下載 JSON 或查看錯誤上下文。');
      return;
    }
    player.current = replayer;
    replayer.wrapper.style.position = 'absolute';
    replayer.wrapper.style.top = '0';
    replayer.iframe.style.position = 'absolute';
    replayer.iframe.style.left = '0';
    replayer.iframe.style.top = '0';
    replayer.iframe.style.border = '0';
    replayer.iframe.style.zIndex = '0';
    replayer.iframe.style.maxWidth = 'none';
    const mouse = replayer.wrapper.querySelector<HTMLElement>('.replayer-mouse');
    if (mouse) {
      mouse.style.visibility = 'hidden';
      mouse.style.zIndex = '2';
    }
    const tail = replayer.wrapper.querySelector<HTMLElement>('.replayer-mouse-tail');
    if (tail) tail.style.zIndex = '1';
    const metadata = replayer.getMetaData();
    setDuration(metadata.totalTime);
    setErrorPosition(Math.max(0, Math.min(metadata.totalTime, errorTimestamp - metadata.startTime)));
    let width = 1024;
    let height = 768;
    const fit = () => {
      const scale = Math.min(1, root.clientWidth / width);
      replayer.wrapper.style.width = `${width}px`;
      replayer.wrapper.style.height = `${height}px`;
      replayer.wrapper.style.left = `${Math.max(0, (root.clientWidth - width * scale) / 2)}px`;
      replayer.iframe.style.width = `${width}px`;
      replayer.iframe.style.height = `${height}px`;
      replayer.wrapper.style.transform = `scale(${scale})`;
      replayer.wrapper.style.transformOrigin = 'top left';
      root.style.height = `${height * scale + root.offsetHeight - root.clientHeight}px`;
    };
    const resize = (value: unknown) => {
      if (typeof value !== 'object' || value === null || !('width' in value) || !('height' in value)) return;
      if (typeof value.width !== 'number' || typeof value.height !== 'number' || value.width <= 0 || value.height <= 0)
        return;
      width = value.width;
      height = value.height;
      fit();
    };
    replayer.on('resize', resize);
    const firstMeta = events.find(event => event.type === 4);
    if (firstMeta) resize(firstMeta.data);
    const showRecordedCursor = () => {
      if (mouse?.style.left && mouse.style.top) mouse.style.visibility = 'visible';
    };
    replayer.on('event-cast', showRecordedCursor);
    replayer.on('flush', showRecordedCursor);
    replayer.on('finish', () => {
      setPlaying(false);
      setPosition(metadata.totalTime);
    });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(fit);
    observer?.observe(root);
    window.addEventListener('resize', fit);
    // rrweb's baseline is zero until the first play/seek. Initializing it avoids
    // reading a negative epoch-sized offset while the player is paused.
    replayer.pause(0);
    fit();
    const timer = setInterval(() => {
      showRecordedCursor();
      const current = replayer.getCurrentTime();
      setPosition(Number.isFinite(current) ? Math.max(0, Math.min(metadata.totalTime, current)) : 0);
    }, 250);
    return () => {
      clearInterval(timer);
      observer?.disconnect();
      window.removeEventListener('resize', fit);
      replayer.destroy();
      player.current = null;
    };
  }, [events, errorTimestamp]);

  function seek(value: number) {
    const next = Math.max(0, Math.min(duration, value));
    player.current?.pause(next);
    setPosition(next);
    setPlaying(false);
  }

  return (
    <div className="space-y-4">
      {failure && (
        <p role="alert" className="text-sm text-destructive">
          {failure}
        </p>
      )}
      <div
        ref={host}
        className="relative min-h-32 w-full overflow-hidden rounded border border-border bg-muted"
        data-testid="monitor-replay"
      />
      {!failure && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              disabled={!player.current}
              onClick={() => {
                if (playing) {
                  player.current?.pause();
                  setPlaying(false);
                } else {
                  player.current?.play(position >= duration ? 0 : position);
                  setPlaying(true);
                }
              }}
            >
              {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {playing ? '暫停' : '播放'}
            </Button>
            <Button variant="outline" onClick={() => seek(errorPosition)} disabled={!player.current}>
              跳至錯誤
            </Button>
            <label className="flex items-center gap-2 text-sm">
              播放速度
              <select
                className="rounded border border-border bg-background px-2 py-1"
                defaultValue="1"
                onChange={event => player.current?.setConfig({ speed: Number(event.target.value) })}
              >
                <option value="1">1×</option>
                <option value="2">2×</option>
                <option value="4">4×</option>
              </select>
            </label>
            <span className="text-sm tabular-nums text-muted-foreground">
              {time(position)} / {time(duration)}
            </span>
          </div>
          <label className="block text-sm">
            <span className="sr-only">回放進度</span>
            <input
              type="range"
              min="0"
              max={duration}
              value={position}
              step="100"
              disabled={!duration}
              className="w-full accent-primary"
              onChange={event => seek(Number(event.target.value))}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            錯誤位置 {time(errorPosition)} · 輸入值、指定敏感區域與媒體已遮罩；舊錄製的遮罩內容無法還原。
          </p>
        </div>
      )}
    </div>
  );
}
