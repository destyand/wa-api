const { Client } = require('pg');

const client = new Client({
  // connectionString: 'postgres://ncupurxurdckdp:dd717023316898e6f5d25761e995058bef7649509a02bb75d3bb74b798bbd50c@ec2-54-227-246-76.compute-1.amazonaws.com:5432/db0u87diqcf8f9', // dev
	connectionString: process.env.DATABASE_URL, // prod
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();

const readSession = async () => {
	try {
		const res = await client.query("SELECT * FROM wa_sess ORDER BY created_at DESC LIMIT 1");
		if(res.rows.length) return res.rows[0].session;
		return '';
	} catch {
		throw err;
	}
}

const saveSession = (session) => {
	client.query('INSERT INTO wa_sess (session) VALUES($1)', [session], (err, result) => {
		if(err){
			console.error("Failed save session", err);
		} else {
			console.log("Session Saved!");
		}
	})
}

const removeSession = () => {
	client.query('DELETE FROM wa_sess', (err, result) => {
		if(err){
			console.error("Failed delete session", err);
		} else {
			console.log("Session deleted!");
		}
	})
}

module.exports = {
	readSession,
	saveSession,
	removeSession,
}