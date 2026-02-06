/**
 * Get detailed info for first 5 profiles
 */
const AdsPowerClient = require('./adspower-client');
const client = new AdsPowerClient();
const fs = require('fs');
const path = require('path');

async function getProfileDetails() {
    console.log('🔍 Getting detailed info for first 5 profiles...\n');

    try {
        const profiles = await client.getProfiles({ page_size: 100 });

        if (!profiles || !profiles.list || profiles.list.length === 0) {
            console.log('❌ No profiles found');
            return;
        }

        const firstFive = profiles.list.slice(0, 5);
        const detailedProfiles = [];

        for (let i = 0; i < firstFive.length; i++) {
            const profile = firstFive[i];
            console.log(`\n[${i + 1}/5] Fetching details for: ${profile.user_id}`);
            console.log('─'.repeat(60));

            try {
                // Try to get full profile info
                const info = await client.getProfileInfo(profile.user_id);

                const detailed = {
                    rank: i + 1,
                    user_id: profile.user_id,
                    name: info.user_name || profile.user_name || 'Unnamed',
                    group_id: profile.group_id,
                    email: info.email || null,
                    browser_type: info.browser_type || null,
                    os_type: info.os_type || null,
                    language: info.language || null,
                    region: info.region || null,
                    timezone: info.timezone || null,
                    fingerprint: info.fingerprint || null,
                    status: info.status || null,
                    notes: info.notes || info.remark || null
                };

                detailedProfiles.push(detailed);

                console.log(`✅ Name: ${detailed.name}`);
                console.log(`   Group: ${detailed.group_id}`);
                console.log(`   Browser: ${detailed.browser_type || 'N/A'}`);
                console.log(`   OS: ${detailed.os_type || 'N/A'}`);
                console.log(`   Region: ${detailed.region || 'N/A'}`);

            } catch (error) {
                console.log(`⚠️  Could not get details: ${error.message}`);
                // Still add basic info
                detailedProfiles.push({
                    rank: i + 1,
                    user_id: profile.user_id,
                    name: profile.user_name || 'Unnamed',
                    group_id: profile.group_id,
                    error: error.message
                });
            }
        }

        // Save to JSON
        const outputPath = path.join(__dirname, 'profile-details-first5.json');
        fs.writeFileSync(outputPath, JSON.stringify(detailedProfiles, null, 2));
        console.log(`\n\n✅ Saved to: ${outputPath}`);

        // Print dashboard
        console.log('\n\n' + '='.repeat(80));
        console.log('📊 PROFILE DASHBOARD - FIRST 5 PROFILES');
        console.log('='.repeat(80) + '\n');

        detailedProfiles.forEach(p => {
            console.log(`\n🔹 PROFILE #${p.rank}: ${p.user_id}`);
            console.log('─'.repeat(80));
            console.log(`Name:        ${p.name}`);
            console.log(`Group:       ${p.group_id}`);
            console.log(`Email:       ${p.email || 'N/A'}`);
            console.log(`Browser:     ${p.browser_type || 'N/A'}`);
            console.log(`OS:          ${p.os_type || 'N/A'}`);
            console.log(`Language:    ${p.language || 'N/A'}`);
            console.log(`Region:      ${p.region || 'N/A'}`);
            console.log(`Timezone:    ${p.timezone || 'N/A'}`);
            console.log(`Fingerprint: ${p.fingerprint || 'N/A'}`);
            console.log(`Status:      ${p.status || 'N/A'}`);
            console.log(`Notes:       ${p.notes || 'N/A'}`);
            if (p.error) console.log(`⚠️  Error: ${p.error}`);
        });

        console.log('\n' + '='.repeat(80));

        return detailedProfiles;

    } catch (error) {
        console.log('❌ Error:', error.message);
        return [];
    }
}

getProfileDetails();
