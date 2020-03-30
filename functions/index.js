//1. Import the Firebase Function Dependency
const functions = require('firebase-functions');

//2. Import other dependencies that we will use
const firebase = require('firebase-admin')
const express = require('express')
const bodyParser = require('body-parser')

//3. Initialize the database
firebase.initializeApp(functions.config().firebase);
const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

//4. Initialize Express (Our Backend Helper)
const app = express();
const main = express();

//5. Configure Middlewares
main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

//6. Define the GET routes
app.get('/resources', async (req, res) => {
  try {
    let snap = await db.collection('resources').get()
    res.status(200).send({
      'message': 'Documents Found!',
      'docs': snap.docs.map(doc => doc.data())
    });
  } catch (error) {
    res.status(400).send({ 'error': `This is the error ${error}` });
  }
});

app.get('/*', async (req, res) => {
  res.status(404).send({ 'error': 'Route not found!' });
});

//7. Define the POST routes
app.post('/resources', async (req, res) => {
  let objectToSave = {
    'name': req.body.name,
    'url': req.body.url,
    'type': req.body.type
  }
  await db.collection('resources').add(objectToSave);
  res.status(200).send({ 'message': 'good job!' });
});

//8. Export to Firebase Functions
exports.api = functions.https.onRequest(main);