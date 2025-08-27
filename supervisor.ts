#!/usr/bin/env node

import { spawn, spawnSync, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { init, tx, id } from '@instantdb/node';

const APP_ID = process.env.INSTANTDB_APP_ID || process.env.EXPO_PUBLIC_INSTANTDB_APP_ID || '';
const CHECK_MS = 10_000;
const STALE_MS = 30_000;

type ProcSpec = {
  name: string;
  cmd: string;
  args: string[];
  cwd?: string;
};

function backoffGen() {
  let ms = 1000;
  return () => { const v = ms; ms = Math.min(ms * 2, 30000); return v; };
}

class Supervisor {
  private handler?: ChildProcessWithoutNullStreams;
  private bundler?: ChildProcessWithoutNullStreams;
  private handlerBackoff = backoffGen();
  private bundlerBackoff = backoffGen();
  private interval?: NodeJS.Timeout;
  private db = APP_ID ? init({ appId: APP_ID }) : null;
  private handlerExitTimes: number[] = [];
  private crashWindowMs = 60_000;
  private crashThreshold = 3;
  private enableGit = process.env.SUPERVISOR_ENABLE_GIT === '1';
  private gitRecovery: 'stash'|'reset' = (process.env.SUPERVISOR_GIT_RECOVERY as any) || 'stash';

  start() {
    console.log('👷 Starting supervisor');
    this.startHandler();
    this.startBundler();
    this.interval = setInterval(() => this.checkHealth(), CHECK_MS);
    process.on('SIGINT', () => this.stop());
  }

  stop() {
    console.log('\n🛑 Stopping supervisor');
    if (this.interval) clearInterval(this.interval);
    this.kill('handler');
    this.kill('bundler');
    process.exit(0);
  }

  private spawnProc(spec: ProcSpec) {
    const p = spawn(spec.cmd, spec.args, { cwd: spec.cwd, stdio: 'inherit', env: process.env });
    p.on('exit', (code, signal) => {
      console.log(`⚠️ ${spec.name} exited (code=${code}, signal=${signal})`);
      if (spec.name === 'handler') this.onHandlerExit();
      if (spec.name === 'bundler') this.restartBundler();
    });
    return p;
  }

  private onHandlerExit() {
    this.handlerExitTimes.push(Date.now());
    const cutoff = Date.now() - this.crashWindowMs;
    this.handlerExitTimes = this.handlerExitTimes.filter(t => t >= cutoff);
    if (this.handlerExitTimes.length >= this.crashThreshold) {
      console.log('🧯 Repeated handler crashes detected. Initiating recovery.');
      this.recoverFromCrashes();
      this.handlerExitTimes = [];
    }
    this.restartHandler();
  }

  private startHandler() {
    if (this.handler) return;
    console.log('▶️  Starting handler');
    // Use nodemon so the handler restarts automatically on file changes
    this.handler = this.spawnProc({
      name: 'handler',
      cmd: 'npx',
      args: [
        'nodemon',
        '--quiet',
        '--watch', '.',
        '--ext', 'ts,tsx,js,json',
        '--signal', 'SIGINT',
        '--exec', 'npx tsx instant-message-handler.ts'
      ]
    });
  }

  private restartHandler() {
    this.handler = undefined;
    const wait = this.handlerBackoff();
    console.log(`⏳ Restarting handler in ${wait}ms`);
    setTimeout(() => this.startHandler(), wait);
  }

  private startBundler() {
    if (this.bundler) return;
    console.log('▶️  Starting Expo bundler');
    this.bundler = this.spawnProc({ name: 'bundler', cmd: 'npx', args: ['expo', 'start'], cwd: 'mobile-app' });
  }

  private restartBundler() {
    this.bundler = undefined;
    const wait = this.bundlerBackoff();
    console.log(`⏳ Restarting bundler in ${wait}ms`);
    setTimeout(() => this.startBundler(), wait);
  }

  private async checkHealth() {
    if (!this.db) return;
    try {
      const res = await this.db.queryOnce({ heartbeats: {} });
      const beats = res.data?.heartbeats || [];
      const now = Date.now();
      const hostBeat = beats.find((h: any) => h.kind === 'host');
      if (!hostBeat || now - (hostBeat.lastSeenAt || 0) > STALE_MS) {
        console.log('🔴 Host heartbeat stale → restarting handler');
        this.kill('handler');
        this.restartHandler();
        await this.logToDb('health', 'Host heartbeat stale, handler restarted', { lastSeenAt: hostBeat?.lastSeenAt });
      }
    } catch (err) {
      console.warn('⚠️ Health check failed', err);
    }
  }

  private kill(which: 'handler'|'bundler') {
    const p = which === 'handler' ? this.handler : this.bundler;
    if (p) {
      try { p.kill('SIGINT'); } catch {}
    }
    if (which === 'handler') this.handler = undefined;
    if (which === 'bundler') this.bundler = undefined;
  }

  private async logToDb(kind: string, message: string, meta?: any) {
    if (!this.db) return;
    try {
      const logId = id();
      await (this.db as any).transact([
        (tx as any).logs[logId].update({ id: logId, kind, message, meta: meta || {}, timestamp: Date.now() })
      ]);
    } catch {}
  }

  async installMobileDeps() {
    console.log('📦 Installing mobile dependencies (will restart bundler)');
    this.kill('bundler');
    const res = spawnSync('npm', ['install'], { cwd: 'mobile-app', stdio: 'inherit', env: process.env });
    if (res.status !== 0) {
      console.error('❌ npm install failed');
      await this.logToDb('deps', 'npm install failed for mobile-app', { status: res.status });
      return;
    }
    await this.logToDb('deps', 'npm install completed for mobile-app');
    this.startBundler();
  }

  private recoverFromCrashes() {
    if (!this.enableGit) {
      console.log('ℹ️ Git recovery disabled (SUPERVISOR_ENABLE_GIT!=1)');
      return;
    }
    console.log(`🔧 Running git recovery strategy: ${this.gitRecovery}`);
    try { spawnSync('git', ['status', '--porcelain'], { stdio: 'inherit' }); } catch {}
    try {
      if (this.gitRecovery === 'stash') spawnSync('git', ['stash', '-u'], { stdio: 'inherit' });
      else if (this.gitRecovery === 'reset') spawnSync('git', ['reset', '--hard', 'HEAD'], { stdio: 'inherit' });
    } catch (e) { console.warn('⚠️ Git recovery failed', e); }
  }
}

function main() {
  // Optional self-watch (use SUPERVISOR_WATCH_SELF=1): re-run supervisor via nodemon when this file changes
  if (process.env.SUPERVISOR_WATCH_SELF === '1' && process.env.SUPERVISOR_WRAPPED !== '1') {
    const env = { ...process.env, SUPERVISOR_WRAPPED: '1' } as NodeJS.ProcessEnv;
    const p = spawn('npx', [
      'nodemon', '--quiet', '--watch', 'supervisor.ts', '--ext', 'ts,js,json', '--signal', 'SIGINT',
      '--exec', 'npx tsx supervisor.ts'
    ], { stdio: 'inherit', env });
    p.on('exit', (code) => process.exit(code ?? 0));
    return;
  }
  const sup = new Supervisor();
  const cmd = process.argv[2] || 'start';
  if (cmd === 'start') sup.start();
  else if (cmd === 'status') console.log('Use heartbeats in app to view status');
  else if (cmd === 'restart-bundler') { (sup as any)['kill']('bundler'); (sup as any)['restartBundler'](); }
  else if (cmd === 'restart-handler') { (sup as any)['kill']('handler'); (sup as any)['restartHandler'](); }
  else if (cmd === 'deps-mobile') (sup as any).installMobileDeps();
  else console.log('Unknown command');
}

main();
