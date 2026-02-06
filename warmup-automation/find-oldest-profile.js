/**
 * Find the oldest accessible profile
 */
const AdsPowerClient = require('./adspower-client');
const client = new AdsPowerClient();

async function findOldestProfile() {
    console.log('🔍 Finding the oldest accessible profile...\n');

    try {
        // Get all profiles
        const profiles = await client.getProfiles({ page_size: 100 });

        if (!profiles || !profiles.list || profiles.list.length === 0) {
            console.log('❌ No profiles found');
            return;
        }

        console.log(`📊 Total profiles accessible: ${profiles.list.length}\n`);

        // Get detailed info for first 5 and last 5 profiles
        console.log('🔍 First 5 profiles in list:\n');
        for (let i = 0; i < Math.min(5, profiles.list.length); i++) {
            const p = profiles.list[i];
            console.log(`[${i + 1}] ID: ${p.user_id}`);
            console.log(`    Name: ${p.user_name || 'Unnamed'}`);
            console.log(`    Group: ${p.group_id}`);
            if (p.browsers && p.browsers[0]) {
                console.log(`    Created: ${p.browsers[0].create_time || 'Unknown'}`);
            }
            console.log('');
        }

        console.log('\n🔍 Last 5 profiles in list:\n');
        for (let i = Math.max(0, profiles.list.length - 5); i < profiles.list.length; i++) {
            const p = profiles.list[i];
            console.log(`[${i + 1}] ID: ${p.user_id}`);
            console.log(`    Name: ${p.user_name || 'Unnamed'}`);
            console.log(`    Group: ${p.group_id}`);
            if (p.browsers && p.browsers[0]) {
                console.log(`    Created: ${p.browsers[0].create_time || 'Unknown'}`);
            }
            console.log('');
        }

        // Sort by creation time if available
        const profilesWithTime = profiles.list.filter(p =>
            p.browsers && p.browsers[0] && p.browsers[0].create_time
        );

        if (profilesWithTime.length > 0) {
            profilesWithTime.sort((a, b) =>
                a.browsers[0].create_time - b.browsers[0].create_time
            );

            const oldest = profilesWithTime[0];
            console.log('\n✅ OLDEST PROFILE (by creation time):\n');
            console.log(`   ID: ${oldest.user_id}`);
            console.log(`   Name: ${oldest.user_name || 'Unnamed'}`);
            console.log(`   Group: ${oldest.group_id}`);
            console.log(`   Created: ${new Date(oldest.browsers[0].create_time * 1000).toLocaleString()}`);
        } else {
            // No creation time available, use first in list
            console.log('\n✅ FIRST PROFILE (by list order):\n');
            const first = profiles.list[0];
            console.log(`   ID: ${first.user_id}`);
            console.log(`   Name: ${first.user_name || 'Unnamed'}`);
            console.log(`   Group: ${first.group_id}`);
        }

    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

findOldestProfile();
