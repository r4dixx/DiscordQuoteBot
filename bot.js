const FS = require('fs');
const SQLITE = require('sqlite3');
const DISCORD = require('discord.js');
const CONFIG = require('./config.json');

const DB_PATH = './quotes.db';
const TOKEN_PATH = './token.json';
const TOKEN_FILE = require(TOKEN_PATH);

const CLIENT = new DISCORD.Client();

const PREFIX = CONFIG.prefix;

if (FS.existsSync(TOKEN_PATH)) {
  CLIENT.login(TOKEN_FILE.token);
} else {
  console.log('Error: No token file');
}

let db;

function openDb() {
  db = new SQLITE.Database(DB_PATH, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to SQlite database');
  });
}

function closeDb() {
  db.close((err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Closed database connection');
  });
}

if (FS.existsSync(DB_PATH)) {
  console.log(`File ${DB_PATH} exists. Moving on`);
} else {
  console.log(`${DB_PATH} not found, creating...`);
  openDb();
  db.run('CREATE TABLE IF NOT EXISTS quotes(quote text)', (err) => {
    if (err) {
      return console.log(err.message);
    }
    console.log('Quotes table created');
  });
  closeDb();
}

CLIENT.on('message', (message) => {
  const MESSAGE = message.content;
  const TRIGGER_QUOTE = PREFIX + CONFIG.command_quote;
  const TRIGGER_HELP = PREFIX + CONFIG.command_help;

  function displayRandomQuote() {
    openDb();
    db.all('SELECT * FROM quotes WHERE quote IN (SELECT quote FROM quotes ORDER BY RANDOM() LIMIT 1)', [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
        message.channel.send(row.quote);
      });
    });
    closeDb();
  }

  function saveQuote() {
    const quoteClean = MESSAGE.replace(TRIGGER_QUOTE, '').substring(1);
    openDb();
    db.run('INSERT INTO quotes(quote) VALUES(?)', quoteClean, (err) => {
      if (err) {
        return console.log(err.message);
      }
    });
    closeDb();
    message.channel.send(`${CONFIG.feedback_confirm}\n${quoteClean}`);
  }

  if (MESSAGE === TRIGGER_QUOTE) {
    displayRandomQuote();
    console.log(`Quote displayed: ${row.quote}`);
  } else if (MESSAGE.startsWith(TRIGGER_QUOTE)) {
    saveQuote();
    console.log(`Quote saved: ${quoteClean}`);
  } else if (MESSAGE.startsWith(TRIGGER_HELP)) {
    message.channel.send(`${CONFIG.help_add} \`${TRIGGER_QUOTE}\` \`${CONFIG.help_add_formatting}\`\n${CONFIG.help_display} \`${TRIGGER_QUOTE}\`\n${CONFIG.help_self} \`${TRIGGER_HELP}\``);
    console.log('Help displayed');
  } else if (MESSAGE === '/ping') {
    message.reply('Pong');
    console.log('Ping Pong');
  } else if (MESSAGE.startsWith('/ping')) {
    const pong = MESSAGE.replace('/ping', '').substring(1);
    message.reply(`Pong: ${pong}`);
    console.log(`Pong: ${pong}`);
  }
});
