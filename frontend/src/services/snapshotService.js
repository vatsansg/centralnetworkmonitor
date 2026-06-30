function formatDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(d).find(p => p.type === 'timeZoneName')?.value || tz;
  const local = d.toLocaleTimeString('en', { hour12: false });
  const utc = d.toISOString().slice(11, 19);
  return `${local} ${tzAbbr} (UTC ${utc})`;
}

function statusDot(status) {
  const colours = { up: '#22c55e', down: '#ef4444', warning: '#eab308', unknown: '#9ca3af' };
  const c = colours[status] || colours.unknown;
  return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${c};margin-right:4px;"></span>`;
}

export function openSnapshot(venueData) {
  const d = venueData;
  const now = new Date();
  const tzAbbr = new Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now).find(p => p.type === 'timeZoneName')?.value || '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Dashboard Snapshot — ${d.venue_id}</title>
<style>
  body { font-family: Inter, Arial, sans-serif; background: #fff; color: #111; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; color: #555; margin: 20px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
  .summary { display: flex; gap: 12px; margin-bottom: 16px; }
  .tile { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 16px; text-align: center; min-width: 80px; }
  .tile .num { font-size: 24px; font-weight: 700; }
  .tile .lbl { font-size: 11px; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { text-align: left; padding: 6px 8px; background: #f3f4f6; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 600; }
  .up { background:#dcfce7; color:#15803d; }
  .down { background:#fee2e2; color:#dc2626; }
  .warning { background:#fef9c3; color:#92400e; }
  .critical { background:#fee2e2; color:#dc2626; }
  .info { background:#dbeafe; color:#1d4ed8; }
  footer { margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<h1>Central Network Monitor — Dashboard Snapshot</h1>
<div class="meta">
  <strong>Venue:</strong> ${d.venue_id} &nbsp;|&nbsp;
  <strong>Event:</strong> ${d.event_name || '—'} &nbsp;|&nbsp;
  <strong>Version:</strong> ${d.app_version || '—'} &nbsp;|&nbsp;
  <strong>Data as of:</strong> ${formatDateTime(d.generated_at)}
</div>

<h2>Device Summary</h2>
<div class="summary">
  ${[['Up','up','#15803d'],['Down','down','#dc2626'],['Warning','warning','#92400e'],['Unknown','unknown','#6b7280'],['Total','total','#1d4ed8']].map(([l,k,c])=>
    `<div class="tile"><div class="num" style="color:${c}">${d.summary?.[k] ?? 0}</div><div class="lbl">${l}</div></div>`
  ).join('')}
</div>

<h2>Internet Status</h2>
<p><span class="badge ${d.internet?.status === 'up' ? 'up' : 'down'}">${d.internet?.status === 'up' ? 'ONLINE' : 'OFFLINE'}</span>${d.internet?.down_since ? ` — Down since ${new Date(d.internet.down_since).toLocaleString()}` : ''}</p>

${d.vlans?.length ? `<h2>VLANs</h2><table><tr><th>Name</th><th>Subnet</th><th>Gateway</th></tr>${d.vlans.map(v=>`<tr><td>${v.name}</td><td>${v.subnet}</td><td>${v.gateway}</td></tr>`).join('')}</table>` : ''}

${d.down_devices?.length ? `<h2>Down Devices (${d.down_devices.length})</h2><table><tr><th>Name</th><th>IP</th><th>Type</th><th>VLAN</th><th>Location</th><th>Last Seen</th></tr>${d.down_devices.map(x=>`<tr><td>${x.name}</td><td>${x.ip_address}</td><td>${x.device_type_name||'—'}</td><td>${x.vlan_name||'—'}</td><td>${x.location_name||'—'}</td><td>${x.last_seen?new Date(x.last_seen).toLocaleTimeString():'—'}</td></tr>`).join('')}</table>` : ''}

${d.top_latency?.length ? `<h2>Top Latency</h2><table><tr><th>Name</th><th>IP</th><th>Latency</th><th>Status</th></tr>${d.top_latency.slice(0,8).map(x=>`<tr><td>${x.name}</td><td>${x.ip_address}</td><td>${x.last_ping_latency}ms</td><td><span class="badge ${x.status}">${x.status.toUpperCase()}</span></td></tr>`).join('')}</table>` : ''}

${d.top_cpu?.filter(x=>x.cpu_usage!=null).length ? `<h2>Top CPU</h2><table><tr><th>Name</th><th>IP</th><th>CPU%</th></tr>${d.top_cpu.filter(x=>x.cpu_usage!=null).slice(0,6).map(x=>`<tr><td>${x.name}</td><td>${x.ip_address}</td><td>${x.cpu_usage.toFixed(1)}%</td></tr>`).join('')}</table>` : ''}

${d.top_temperature?.filter(x=>x.last_temperature!=null).length ? `<h2>Top Temperature</h2><table><tr><th>Name</th><th>Temp</th><th>CPU%</th><th>Mem%</th></tr>${d.top_temperature.filter(x=>x.last_temperature!=null).slice(0,6).map(x=>`<tr><td>${x.name}</td><td>${x.last_temperature.toFixed(1)}°C</td><td>${x.last_cpu?.toFixed(1)??'—'}%</td><td>${x.last_memory?.toFixed(1)??'—'}%</td></tr>`).join('')}</table>` : ''}

${d.recent_events?.length ? `<h2>Recent Events</h2><table><tr><th>Time</th><th>Device</th><th>Severity</th><th>Message</th></tr>${d.recent_events.slice(0,20).map(x=>`<tr><td>${new Date(x.timestamp).toLocaleTimeString()}</td><td>${x.device_name}</td><td><span class="badge ${x.severity}">${x.severity.toUpperCase()}</span></td><td>${x.message}</td></tr>`).join('')}</table>` : ''}

<footer>Generated at ${now.toLocaleString()} ${tzAbbr} (UTC ${now.toISOString().slice(11,19)}) | Central Network Monitor</footer>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}
