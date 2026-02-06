/**
 * Try to find specific profile IDs
 */
const AdsPowerClient = require('./adspower-client');
const client = new AdsPowerClient();

// The profile IDs from your screenshots
const TARGET_IDS = ['j5klfkv', 'j5klp3m', 'k12am9a2'];

async function findProfiles() {
    console.log('🔍 Searching for specific profile IDs...\n');

    for (const id of TARGET_IDS) {
        console.log(`\n📌 Checking: ${id}`);
        console.log('─'.repeat(50));

        try {
            // Try to get profile info directly
            const info = await client.getProfileInfo(id);
            console.log(`✅ Found!`);
            console.log(`   Name: ${info.user_name || info.name || 'Unnamed'}`);
            console.log(`   Group: ${info.group_id || 'N/A'}`);

            if (info.browsers && info.browsers[0]) {
                console.log(`   Browser: ${info.browsers[0].browser_type}`);
                console.log(`   OS: ${info.browsers[0].os_type}`);
                console.log(`   Status: ${info.browsers[0].status}`);
            }
        } catch (error) {
            console.log(`❌ Not found: ${error.message}`);
        }
    }

    console.log('\n\n📊 Summary:');
    console.log('─'.repeat(50));
    console.log('Profile k12am9a2 = The one I have been using');
    console.log('Profiles j5klfkv, j5klp3m = May not exist or no API access');
}

findProfiles();
