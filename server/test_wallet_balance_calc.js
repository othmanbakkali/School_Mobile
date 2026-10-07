const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const ODOO_URL = (process.env.ODOO_URL || '').replace(/\/+$/, '');
const ODOO_DB = process.env.ODOO_DB;
const ADMIN_USER = process.env.ODOO_ADMIN_USER;
const ADMIN_PASS = process.env.ODOO_ADMIN_PASS;

async function check() {
  const loginRes = await axios.post(ODOO_URL + '/jsonrpc', {
    jsonrpc: '2.0',
    method: 'call',
    params: { service: 'common', method: 'login', args: [ODOO_DB, ADMIN_USER, ADMIN_PASS] }
  });
  const uid = loginRes.data.result;
  const students = await axios.post(ODOO_URL + '/jsonrpc', {
    jsonrpc: '2.0',
    method: 'call',
    params: {
      service: 'object',
      method: 'execute_kw',
      args: [ODOO_DB, uid, ADMIN_PASS, 'school.student', 'search_read', [[]], { fields: ['id', 'name', 'wallet_balance', 'wallet_transaction_ids'] }]
    }
  });
  console.log('--- RECAPITULATIF DES SOLDES PORTEFEUILLE DES ELEVES ---');
  for (const s of students.data.result) {
    if (s.wallet_transaction_ids && s.wallet_transaction_ids.length > 0) {
      const txs = await axios.post(ODOO_URL + '/jsonrpc', {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          service: 'object',
          method: 'execute_kw',
          args: [ODOO_DB, uid, ADMIN_PASS, 'school.wallet.transaction', 'read', [s.wallet_transaction_ids, ['id', 'type', 'amount', 'student_wallet_balance']]]
        }
      });
      const credits = txs.data.result.filter(t => t.type === 'credit').reduce((a, b) => a + b.amount, 0);
      const debits = txs.data.result.filter(t => t.type === 'debit').reduce((a, b) => a + b.amount, 0);
      const calculated = credits - debits;
      console.log(`Élève [${s.id}] ${s.name} :`);
      console.log(`   + Cumul Rechargements (Crédits) : ${credits.toFixed(2)} MAD`);
      console.log(`   - Cumul Achats Boutique (Débits) : ${debits.toFixed(2)} MAD`);
      console.log(`   = Solde Calculé : ${calculated.toFixed(2)} MAD (Solde Odoo : ${s.wallet_balance.toFixed(2)} MAD)\n`);
    }
  }
}

check().catch(console.error);
