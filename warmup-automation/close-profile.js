/**
 * Close all AdsPower profiles
 */
const AdsPowerClient = require('./adspower-client');
const client = new AdsPowerClient();

async function closeProfile() {
    const PROFILE_ID = 'k12am9a2';
    console.log('Closing Profile 1...');
    try {
        await client.stopProfile(PROFILE_ID);
        console.log('✅ Profile closed');
    } catch (error) {
        console.log('Note:', error.message);
    }
}

closeProfile();
