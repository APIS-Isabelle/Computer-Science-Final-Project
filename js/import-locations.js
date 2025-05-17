const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const locationsFile = fs.readFileSync(path.join(__dirname, 'assets', 'locations.json'), 'utf8');
const locations = JSON.parse(locationsFile);

async function importLocations() {
  const batch = db.batch();
  
  locations.forEach((location) => {
    location.randomIndex = Math.random();
    
    const locationRef = db.collection('locations').doc(location.id);
    
    batch.set(locationRef, location);
  });
  
  return batch.commit()
    .then(() => {
      console.log(`Successfully imported ${locations.length} locations`);
    })
    .catch((error) => {
      console.error('Error importing locations:', error);
    });
}

importLocations()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });