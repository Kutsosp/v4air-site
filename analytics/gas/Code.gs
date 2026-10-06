/* V4AIR weekly GA4 digest: one e-mail every Monday 08:00 with last week's traffic, sources, CTA clicks and submissions.
   Standalone Apps Script owned by petkout1 (clasp --user v4air). Reads GA4 property 557594808 through the Data API
   with the script owner's token; no key file. Run installTrigger() once from the editor to grant consent and schedule it. */

var PROPERTY = 'properties/557594808';
var RECIPIENTS = ['peter@v4air.eu', 'petr@v4air.eu'];
var SITE = 'https://v4air.eu';

function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'sendDigest') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('sendDigest').timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();
  sendDigest(); /* first run now, so the consent screen covers every scope */
}

function sendDigest() {
  var week = range(7, 1), prev = range(14, 8);
  var totals = runReport({ dateRanges: [week, prev], metrics: m(['sessions', 'totalUsers', 'screenPageViews', 'keyEvents']) });
  var sources = runReport({ dateRanges: [week], dimensions: d(['sessionSource', 'sessionMedium']), metrics: m(['sessions', 'keyEvents']), orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 8 });
  var countries = runReport({ dateRanges: [week], dimensions: d(['country']), metrics: m(['sessions']), orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 6 });
  var pages = runReport({ dateRanges: [week], dimensions: d(['pagePath']), metrics: m(['screenPageViews']), orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 6 });
  var events = runReport({ dateRanges: [week], dimensions: d(['eventName', 'customEvent:form_name', 'customEvent:cta_target']), metrics: m(['eventCount']),
    dimensionFilter: { filter: { fieldName: 'eventName', inListFilter: { values: ['cta_click', 'contact_click', 'form_submitted', 'form_error', 'page_not_found'] } } } });

  var t = totals.rows || [];
  var cur = t.filter(function (r) { return r.dimensionValues[0].value === 'date_range_0'; })[0];
  var old = t.filter(function (r) { return r.dimensionValues[0].value === 'date_range_1'; })[0];
  var html = '<div style="font:15px/1.5 Segoe UI,Arial,sans-serif;color:#161616;max-width:640px">'
    + '<h2 style="margin:0 0 4px">V4AIR site, week ' + week.startDate + ' to ' + week.endDate + '</h2>'
    + '<p style="color:#52564a;margin:0 0 16px">GA4 property v4air.eu, consented visits only, numbers vs the week before in brackets.</p>'
    + kpis(cur, old, ['Sessions', 'Users', 'Page views', 'Key events'])
    + table('Sources', ['Source / medium', 'Sessions', 'Key events'], (sources.rows || []).map(function (r) { return [r.dimensionValues[0].value + ' / ' + r.dimensionValues[1].value, r.metricValues[0].value, r.metricValues[1].value]; }))
    + table('Countries', ['Country', 'Sessions'], (countries.rows || []).map(function (r) { return [r.dimensionValues[0].value, r.metricValues[0].value]; }))
    + table('Pages', ['Path', 'Views'], (pages.rows || []).map(function (r) { return [r.dimensionValues[0].value, r.metricValues[0].value]; }))
    + table('Actions', ['Event', 'Detail', 'Count'], (events.rows || []).map(function (r) {
        var detail = [r.dimensionValues[1].value, r.dimensionValues[2].value].filter(function (v) { return v && v !== '(not set)'; }).join(' ');
        return [r.dimensionValues[0].value, detail, r.metricValues[0].value]; }))
    + '<p style="color:#52564a;font-size:13px;margin-top:20px">Full reports: <a href="https://analytics.google.com/analytics/web/#/p557594808/reports/intelligenthome">GA4</a>. Site: <a href="' + SITE + '">' + SITE + '</a></p></div>';
  MailApp.sendEmail({ to: RECIPIENTS.join(','), subject: 'V4AIR site: week ' + week.startDate + ' to ' + week.endDate, htmlBody: html, name: 'V4AIR analytics' });
}

/* ---------- GA4 Data API ---------- */

function runReport(body) {
  var res = UrlFetchApp.fetch('https://analyticsdata.googleapis.com/v1beta/' + PROPERTY + ':runReport', {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(body), muteHttpExceptions: true,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }
  });
  if (res.getResponseCode() !== 200) throw new Error('GA4 ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
  return JSON.parse(res.getContentText());
}
function range(fromDaysAgo, toDaysAgo) { return { startDate: fromDaysAgo + 'daysAgo', endDate: toDaysAgo + 'daysAgo' }; }
function m(names) { return names.map(function (n) { return { name: n }; }); }
function d(names) { return names.map(function (n) { return { name: n }; }); }

/* ---------- HTML ---------- */

function kpis(cur, old, labels) {
  var cells = labels.map(function (label, i) {
    var v = cur ? Number(cur.metricValues[i].value) : 0, o = old ? Number(old.metricValues[i].value) : 0;
    return '<td style="padding:10px 14px;border:1px solid #d3d5c8;border-radius:8px"><div style="font-size:22px;font-weight:700">' + v + '</div>'
      + '<div style="color:#52564a;font-size:13px">' + label + ' (' + o + ')</div></td>';
  });
  return '<table cellspacing="6" style="border-collapse:separate;margin:0 -6px 12px"><tr>' + cells.join('') + '</tr></table>';
}
function table(title, head, rows) {
  if (!rows.length) return '<h3 style="margin:18px 0 6px">' + title + '</h3><p style="color:#52564a;margin:0">No data.</p>';
  var th = head.map(function (h, i) { return '<th style="text-align:' + (i ? 'right' : 'left') + ';padding:4px 8px;border-bottom:1px solid #d3d5c8;font-weight:600">' + h + '</th>'; }).join('');
  var tr = rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return '<td style="text-align:' + (i && i === r.length - 1 ? 'right' : 'left') + ';padding:4px 8px;border-bottom:1px solid #eceee4">' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('');
  return '<h3 style="margin:18px 0 6px">' + title + '</h3><table style="border-collapse:collapse;width:100%"><tr>' + th + '</tr>' + tr + '</table>';
}
function esc(s) { return String(s).replace(/[&<>]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]; }); }
