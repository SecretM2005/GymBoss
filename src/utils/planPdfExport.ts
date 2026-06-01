import { Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TrainingsPlan, Einheit, EinheitUebung } from '../types';

function renderParam(u: EinheitUebung): string {
  if (u.parameter.length === 0) return '';
  const parts = u.parameter.map((p) => {
    const val = p.wert + (p.einheit ? ` ${p.einheit}` : '');
    return p.bezeichnung ? `${p.bezeichnung}: ${val}` : val;
  });
  return ` <span class="param">(${parts.join(' · ')})</span>`;
}

function renderUebung(u: EinheitUebung): string {
  if (u.typ === 'kreis') {
    const items = (u.kreisUebungen ?? [])
      .map((k) => `<li class="kreis-item">${k.name}: ${k.wert} ${k.einheit}</li>`)
      .join('');
    return `<li>${u.name} <span class="param">(Kreis)</span><ul class="kreis-list">${items}</ul></li>`;
  }
  return `<li>${u.name}${renderParam(u)}</li>`;
}

function renderPhase(label: string, items: EinheitUebung[]): string {
  if (items.length === 0) return '';
  return `
    <div class="phase">
      <span class="phase-label">${label}</span>
      <ul>${items.map(renderUebung).join('')}</ul>
    </div>`;
}

function renderEinheit(e: Einheit): string {
  const datum = e.datum
    ? new Date(e.datum).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
    : '';
  return `
    <div class="einheit">
      <div class="einheit-header">
        <span>${e.name}</span>
        ${datum ? `<span class="datum">${datum}</span>` : ''}
      </div>
      ${renderPhase('Warm-up', e.warmup)}
      ${renderPhase('Haupteinheit', e.haupteinheit)}
      ${renderPhase('Cool-down', e.cooldown)}
    </div>`;
}

export function buildPlanHtml(plan: TrainingsPlan): string {
  const metaParts = [plan.sportart, plan.startdatum ? `Start: ${plan.startdatum}` : ''].filter(Boolean);
  const wochenHtml = plan.wochen.length === 0
    ? '<p class="empty">Keine Wochen angelegt.</p>'
    : plan.wochen
        .map(
          (w) => `
      <div class="woche">
        <div class="woche-header">
          Woche ${w.wochennummer}${w.notizen ? ` <span class="woche-notiz">· ${w.notizen}</span>` : ''}
        </div>
        ${w.einheiten.length === 0 ? '<p class="empty">Keine Einheiten</p>' : w.einheiten.map(renderEinheit).join('')}
      </div>`,
        )
        .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${plan.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: #fff; padding: 32px 36px; max-width: 780px; margin: 0 auto; }
    h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #777; margin-bottom: 6px; }
    .desc { font-size: 13px; color: #555; margin-bottom: 28px; line-height: 1.5; }
    .woche { margin-bottom: 28px; }
    .woche-header { font-size: 14px; font-weight: 700; color: #fff; background: #1a1a2e; padding: 8px 14px; border-radius: 8px; margin-bottom: 10px; }
    .woche-notiz { font-weight: 400; opacity: 0.75; font-size: 13px; }
    .einheit { border: 1px solid #dde; border-radius: 8px; margin-bottom: 10px; overflow: hidden; page-break-inside: avoid; }
    .einheit-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; padding: 9px 14px; background: #f4f4fb; }
    .datum { font-size: 11px; font-weight: 400; color: #999; }
    .phase { padding: 7px 14px; border-top: 1px solid #eaebf4; }
    .phase-label { display: block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #aaa; margin-bottom: 5px; }
    ul { list-style: none; padding-left: 6px; }
    li { padding: 2px 0; font-size: 13px; color: #333; }
    li::before { content: "·"; margin-right: 8px; color: #bbb; }
    .kreis-list { padding-left: 18px; margin-top: 3px; }
    .kreis-item::before { content: "–"; margin-right: 6px; color: #ccc; }
    .param { color: #999; font-size: 12px; }
    .empty { font-size: 12px; color: #bbb; font-style: italic; padding: 6px 0; }
    @media print { body { padding: 16px; } .woche { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <h1>${plan.name}</h1>
  ${metaParts.length > 0 ? `<p class="meta">${metaParts.join(' · ')}</p>` : ''}
  ${plan.beschreibung ? `<p class="desc">${plan.beschreibung}</p>` : ''}
  ${wochenHtml}
</body>
</html>`;
}

export async function exportPlanAsPdf(plan: TrainingsPlan): Promise<void> {
  try {
    const html = buildPlanHtml(plan);
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${plan.name} teilen`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ html });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('cancelled') || msg.includes('canceled') || msg.includes('dismiss')) return;
    Alert.alert('Export fehlgeschlagen', msg || 'Unbekannter Fehler');
  }
}
