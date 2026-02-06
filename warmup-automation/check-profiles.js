/**
 * Check all AdsPower profiles
 */
const AdsPowerClient = require('./adspower-client');
const client = new AdsPowerClient();

async function checkProfiles() {
    console.log('🔍 Checking AdsPower profiles...\n');

    try {
        // Try to get groups
        console.log('1️⃣ Checking groups...');
        try {
            const groups = await client.getGroups();
            console.log('Groups:', JSON.stringify(groups, null, 2));
        } catch (e) {
            console.log('Could not get groups:', e.message);
        }

        // Try with different parameters
        console.log('\n2️⃣ Getting all profiles (page_size=100)...');
        const profiles = await client.getProfiles({ page_size: 100 });

        if (profiles && profiles.list) {
            console.log(`\n✅ Found ${profiles.list.length} profile(s):\n`);

            profiles.list.forEach((p, i) => {
                console.log(`[${i + 1}] ID: ${p.user_id}`);
                console.log(`    Name: ${p.user_name || 'Unnamed'}`);
                console.log(`    Group: ${p.group_id}`);
                if (p.browsers && p.browsers[0]) {
                    console.log(`    Browser: ${p.browsers[0].browser_type}`);
                    console.log(`    OS: ${p.browsers[0].os_type}`);
                    console.log(`    Status: ${p.browsers[0].status}`);
                }
                console.log('');
            });
        } else {
            console.log('Unexpected response:', profiles);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

checkProfiles();
