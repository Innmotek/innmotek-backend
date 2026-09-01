const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

require('dotenv').config();

const sqlContent = fs.readFileSync(path.resolve(__dirname, '../../../innmotekllp_admin.sql'), 'utf8');

async function auditAll31Tables() {
  // 1. Extract every CREATE TABLE name from SQL dump
  const regex = /CREATE TABLE\s+`?(\w+)`?\s*\(/gi;
  let match;
  const dumpTables = [];
  while ((match = regex.exec(sqlContent)) !== null) {
    if (!dumpTables.includes(match[1])) {
      dumpTables.push(match[1]);
    }
  }

  console.log(`=== FULL AUDIT OF ALL ${dumpTables.length} TABLES IN SQL DUMP ===\n`);

  // Count rows in SQL dump for each table
  const dumpCounts = {};
  for (const table of dumpTables) {
    const insertRegex = new RegExp(`INSERT INTO\\s+\`?${table}\`?\\s*\\([^)]+\\)\\s*VALUES\\s*`, 'gi');
    let insertMatch;
    let totalRows = 0;
    while ((insertMatch = insertRegex.exec(sqlContent)) !== null) {
      const startIdx = insertMatch.index + insertMatch[0].length;
      let inStr = false, quoteChar = '', escape = false, endIdx = startIdx;
      for (let i = startIdx; i < sqlContent.length; i++) {
        const ch = sqlContent[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (inStr) { if (ch === quoteChar) inStr = false; }
        else {
          if (ch === "'" || ch === '"') { inStr = true; quoteChar = ch; }
          else if (ch === ';') { endIdx = i; break; }
        }
      }
      const valuesBlock = sqlContent.slice(startIdx, endIdx);
      let pDepth = 0, inTStr = false, tQuote = '', tEscape = false;
      for (let i = 0; i < valuesBlock.length; i++) {
        const c = valuesBlock[i];
        if (tEscape) { tEscape = false; continue; }
        if (c === '\\') { tEscape = true; continue; }
        if (inTStr) { if (c === tQuote) inTStr = false; }
        else {
          if (c === "'" || c === '"') { inTStr = true; tQuote = c; }
          else if (c === '(') {
            pDepth++;
            if (pDepth === 1) totalRows++;
          } else if (c === ')') {
            pDepth--;
          }
        }
      }
    }
    dumpCounts[table] = totalRows;
  }

  // 2. Query Supabase for each table
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const results = [];
  for (const table of dumpTables) {
    try {
      const res = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}";`);
      results.push({
        table,
        inDump: true,
        dumpRows: dumpCounts[table],
        inSupabase: true,
        supabaseRows: res.rows[0].count,
        status: 'MIGRATED'
      });
    } catch (e) {
      results.push({
        table,
        inDump: true,
        dumpRows: dumpCounts[table],
        inSupabase: false,
        supabaseRows: 0,
        status: 'NOT_IN_SUPABASE',
        error: e.message
      });
    }
  }

  await client.end();

  console.log('Table Comparison Table:');
  console.log('------------------------------------------------------------------------------------------------------------------');
  console.log('| #  | Table Name                 | Dump Rows | Supabase Rows | Status            | Details                      |');
  console.log('------------------------------------------------------------------------------------------------------------------');
  results.forEach((r, idx) => {
    const num = (idx + 1).toString().padEnd(2, ' ');
    const name = r.table.padEnd(26, ' ');
    const dRows = r.dumpRows.toString().padEnd(9, ' ');
    const sRows = r.supabaseRows.toString().padEnd(13, ' ');
    const st = r.status.padEnd(17, ' ');
    let detail = '';
    if (r.table === 'banners') detail = 'Banner #25 excluded (approved)';
    else if (r.dumpRows === r.supabaseRows && r.inSupabase) detail = 'Exact Match';
    else detail = r.error ? 'Missing in Supabase' : 'Mismatch';
    console.log(`| ${num} | ${name} | ${dRows} | ${sRows} | ${st} | ${detail.padEnd(28, ' ')} |`);
  });
  console.log('------------------------------------------------------------------------------------------------------------------');

  fs.writeFileSync(
    'C:/Users/Tusha/.gemini/antigravity-ide/brain/1d5efebe-de41-4904-bffa-fbaf34f956a4/scratch/all_31_tables_audit.json',
    JSON.stringify(results, null, 2)
  );
}

auditAll31Tables().catch(console.error);
