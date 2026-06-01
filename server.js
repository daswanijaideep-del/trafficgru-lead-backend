require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();



/* ─────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────── */

app.use(cors({
  origin: '*',
}));

app.use(express.json());



/* ─────────────────────────────────────────
   GOOGLE SHEETS AUTH
───────────────────────────────────────── */

const auth = new google.auth.GoogleAuth({

  credentials: {

    client_email:
      process.env.GOOGLE_CLIENT_EMAIL,

    private_key:
      process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),

  },

  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],

});

const sheets = google.sheets({
  version: 'v4',
  auth,
});



/* ─────────────────────────────────────────
   HEALTH CHECK
───────────────────────────────────────── */

app.get('/', (req, res) => {

  res.send('API RUNNING');

});



/* ─────────────────────────────────────────
   LEAD ENDPOINT
───────────────────────────────────────── */

app.post('/api/lead', async (req, res) => {

  try {

    console.log('\n========== NEW LEAD ==========');

    console.log(JSON.stringify(req.body, null, 2));

    const {

      form_id,

      form_data = {},

      meta = {},

    } = req.body;



    /* ─────────────────────────────────────
       EXTRACT FIELDS
    ───────────────────────────────────── */

const row = [

  /* A */
  new Date().toLocaleString(),

  /* B */
  form_id || '',

  /* C */
  form_data.name || '',

  /* D */
  form_data.email || '',

  /* E */
  "'" + (
  (
    (form_data.country_code || '') +
    ' ' +
    (form_data.phone || '')
  ).trim()
),

  /* F */
  form_data.message || '',

  /* G */
  meta.page_url || '',

  /* H */
  meta.page_title || '',

  /* I */
  meta.referrer || '',

  /* J */
  meta.utm_source || '',

  /* K */
  meta.utm_medium || '',

  /* L */
  meta.utm_campaign || '',

];



    console.log('\nROW TO INSERT:\n');

    console.log(row);



    /* ─────────────────────────────────────
       GOOGLE SHEETS INSERT
    ───────────────────────────────────── */

    await sheets.spreadsheets.values.append({

      spreadsheetId: process.env.SPREADSHEET_ID,

      range: 'Leads!A:K',

      valueInputOption: 'USER_ENTERED',

      requestBody: {

        values: [row],

      },

    });



    console.log('\n✅ LEAD SAVED\n');



    res.status(200).json({

      success: true,

      message: 'Lead stored successfully',

    });

  } catch (error) {

    console.error('\n❌ SERVER ERROR\n');

    console.error(error);

    res.status(500).json({

      success: false,

      message: 'Server error',

      error: error.message,

    });

  }

});



/* ─────────────────────────────────────────
   START SERVER
───────────────────────────────────────── */

const PORT = 8080;

app.listen(PORT, () => {

  console.log(`\n🚀 SERVER RUNNING ON:\n`);

  console.log(`http://localhost:${PORT}\n`);

});
