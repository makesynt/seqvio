#!/usr/bin/env node

import { doctorExitCode, runDoctor, type DoctorStatus } from './doctor';

function marker(status: DoctorStatus): string {
  if (status === 'pass') return 'PASS';
  if (status === 'warn') return 'WARN';
  return 'FAIL';
}

async function main(): Promise<void> {
  const json = process.argv.includes('--json');
  const report = await runDoctor({ launchBrowser: !process.argv.includes('--no-browser-launch') });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Seqvio doctor (${report.environment.platform}/${report.environment.arch}, ${report.environment.node})`);
    for (const entry of report.checks) {
      console.log(`[${marker(entry.status)}] ${entry.label}: ${entry.detail}`);
      if (entry.repair) console.log(`       Repair: ${entry.repair}`);
    }
    console.log(report.ok ? 'Environment is ready.' : 'Environment has blocking failures.');
  }
  process.exitCode = doctorExitCode(report);
}

main().catch((error) => {
  console.error(`seqvio-doctor failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
