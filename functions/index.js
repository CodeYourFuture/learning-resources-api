const functions = require('firebase-functions');

const firebase = require('firebase-admin')
const express = require('express')
const bodyParser = require('body-parser')

firebase.initializeApp(functions.config().firebase);
const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);

const app = express();
const main = express();

main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));

app.get('/resources', async (req, res) => {
  try {

    //2. Check API Key Exists
    let apiKeyRequested = req.query.api_key

    if (!apiKeyRequested) {
      return res.status(401).send({
        'error': 'Please include your API key when making requests',
      });
    }

    let apiKeySnap = await db.collection('api_keys').doc(apiKeyRequested).get()

    if (!apiKeySnap.exists) {
      return res.status(401).send({
        'error': 'API Key does not exist!',
      });
    }

    //3. Filter for resources with requested API Key
    let resourcesSnap = await db.collection('resources').where('api_key', '==', apiKeyRequested).get()
    res.status(200).send({
      'message': 'Documents Found!',
      'docs': resourcesSnap.docs.map(doc => doc.data())
    });
  } catch (error) {
    return res.status(400).send({ 'error': `This is the error ${error}` });
  }
});

//1. Generate new API keys
app.post('/api-keys', async (req, res) => {
  try {
    let documentRef = db.collection('api_keys').doc()

    //4. Validate all required data is included and accurate
    let missingParams = []
    if (!req.body.owner_name) missingParams.push('owner_name')

    if (missingParams.length > 0) {
      return res.status(400).send({
        'error': 'Missing Parameters',
        'missing_params': missingParams,
      });
    }

    let objectToSave = {
      'api_key': documentRef.id,
      'owner_name': req.body.owner_name,
      'type': 'test'
    }

    await documentRef.set(objectToSave);
    return res.status(201).send({
      'message': 'API Key Saved',
      'api_key': documentRef.id,
      'type': 'test',
    });
  } catch (error) {
    return res.status(401).send({ 'error': `${error}` });
  }
});

app.post('/resources', async (req, res) => {
  try {
    //2. Check API Key Exists
    let apiKey = req.query.api_key

    if (!apiKey) {
      return res.status(401).send({
        'error': 'Please include your API key when making requests',
      });
    }

    console.log(apiKey)

    let apiKeySnap = await db.collection('api_keys').doc(apiKey).get()

    if (!apiKeySnap.exists) {
      return res.status(401).send({
        'error': 'API Key does not exist!',
      });
    }

    //4. Validate all required data is included and accurate
    let missingParams = []
    if (!req.body.name) missingParams.push('name')
    if (!req.body.url) missingParams.push('url')
    if (!req.body.type) missingParams.push('type')

    if (missingParams.length > 0) {
      return res.status(400).send({
        'error': 'Missing Parameters',
        'missing_params': missingParams,
      });
    }

    //5. Add other parameters
    let objectToSave = {
      'name': req.body.name,
      'url': req.body.url,
      'type': req.body.type,
      'api_key': apiKey,
    }
    await db.collection('resources').add(objectToSave);
    return res.status(201).send({ 'message': 'good job!' });
  } catch (error) {
    return res.status(401).send({ 'error': `${error}` });
  }
});

app.get('/*', async (req, res) => {
  return res.status(404).send({ 'error': 'Route not found!' });
});

app.post('/*', async (req, res) => {
  return res.status(404).send({ 'error': 'Route not found!' });
});

exports.api = functions.https.onRequest(main);