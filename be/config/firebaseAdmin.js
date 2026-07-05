const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../serviceAccount.json')
    )
  });
}

module.exports = admin;
