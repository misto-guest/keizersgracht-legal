/**
 * Warmup Routine Profiles
 * Different warmup strategies for various account ages and purposes
 */

// Available activities
const ACTIVITIES = {
    BASIC: {
        name: 'Basic Warmup',
        activities: ['gmail', 'google_search', 'youtube_watch'],
        duration: '5-10 minutes',
        intensity: 'light'
    },
    STANDARD: {
        name: 'Standard Warmup',
        activities: ['gmail', 'google_search', 'youtube_watch', 'google_maps', 'google_alerts'],
        duration: '10-15 minutes',
        intensity: 'medium'
    },
    AGGRESSIVE: {
        name: 'Aggressive Warmup',
        activities: ['gmail', 'google_search', 'youtube_watch', 'google_maps', 'google_alerts', 'google_docs', 'google_sheets', 'google_photos'],
        duration: '20-30 minutes',
        intensity: 'high'
    },
    GOOGLE_WORKSPACE: {
        name: 'Google Workspace Focus',
        activities: ['gmail', 'google_docs', 'google_sheets', 'google_drive', 'google_calendar'],
        duration: '15-20 minutes',
        intensity: 'medium'
    },
    CONTENT_CREATOR: {
        name: 'Content Creator Profile',
        activities: ['youtube_watch', 'youtube_subscribe', 'youtube_like', 'google_photos', 'google_drive'],
        duration: '15-25 minutes',
        intensity: 'medium-high'
    },
    BUSINESS_PROFESSIONAL: {
        name: 'Business Professional',
        activities: ['gmail', 'google_search', 'google_docs', 'google_sheets', 'google_meet', 'google_calendar'],
        duration: '15-20 minutes',
        intensity: 'medium'
    },
    CASUAL_USER: {
        name: 'Casual User',
        activities: ['google_search', 'youtube_watch', 'google_maps', 'google_alerts'],
        duration: '10-15 minutes',
        intensity: 'light-medium'
    },
    FULL_WARMUP: {
        name: 'Full Complete Warmup',
        activities: ['gmail', 'google_search', 'youtube_watch', 'youtube_subscribe', 'youtube_like', 'google_maps', 'google_alerts', 'google_docs', 'google_sheets', 'google_photos', 'google_drive'],
        duration: '30-45 minutes',
        intensity: 'maximum'
    }
};

// Warmup schedules for different account ages
const SCHEDULES = {
    NEW_ACCOUNT: {
        name: 'New Account (0-7 days)',
        routine: 'BASIC',
        frequency: '2x per day',
        duration: '3-7 days',
        notes: 'Start slow, gradually increase activity'
    },
    EARLY_WARMUP: {
        name: 'Early Warmup (7-14 days)',
        routine: 'STANDARD',
        frequency: '2-3x per day',
        duration: '7 days',
        notes: 'Increase activity variety'
    },
    ACTIVE_WARMUP: {
        name: 'Active Warmup (14-30 days)',
        routine: 'GOOGLE_WORKSPACE',
        frequency: '3x per day',
        duration: '14 days',
        notes: 'Add workspace apps, email warmup'
    },
    MAINTENANCE: {
        name: 'Maintenance (30+ days)',
        routine: 'CASUAL_USER',
        frequency: '1x per day',
        duration: 'ongoing',
        notes: 'Maintain activity, periodic email warmup'
    }
};

// Activity configurations
const ACTIVITY_CONFIG = {
    gmail: {
        name: 'GMail',
        url: 'https://mail.google.com',
        minDuration: 3000,
        maxDuration: 8000,
        actions: ['read', 'compose', 'search']
    },
    google_search: {
        name: 'Google Search',
        url: 'https://www.google.com',
        minDuration: 5000,
        maxDuration: 10000,
        actions: ['search', 'click_results', 'image_search']
    },
    youtube_watch: {
        name: 'YouTube Watch',
        url: 'https://www.youtube.com',
        minDuration: 10000,
        maxDuration: 30000,
        actions: ['search', 'watch', 'scroll']
    },
    youtube_subscribe: {
        name: 'YouTube Subscribe',
        url: 'https://www.youtube.com',
        minDuration: 8000,
        maxDuration: 15000,
        actions: ['search', 'watch', 'subscribe']
    },
    youtube_like: {
        name: 'YouTube Like',
        url: 'https://www.youtube.com',
        minDuration: 8000,
        maxDuration: 15000,
        actions: ['search', 'watch', 'like']
    },
    google_maps: {
        name: 'Google Maps',
        url: 'https://www.google.com/maps',
        minDuration: 5000,
        maxDuration: 10000,
        actions: ['search', 'directions', 'save_place']
    },
    google_alerts: {
        name: 'Google Alerts',
        url: 'https://www.google.com/alerts',
        minDuration: 3000,
        maxDuration: 7000,
        actions: ['create_alert']
    },
    google_docs: {
        name: 'Google Docs',
        url: 'https://docs.google.com',
        minDuration: 8000,
        maxDuration: 15000,
        actions: ['create', 'type', 'format', 'comment']
    },
    google_sheets: {
        name: 'Google Sheets',
        url: 'https://sheets.google.com',
        minDuration: 8000,
        maxDuration: 15000,
        actions: ['create', 'enter_data', 'formulas']
    },
    google_photos: {
        name: 'Google Photos',
        url: 'https://photos.google.com',
        minDuration: 5000,
        maxDuration: 10000,
        actions: ['browse', 'create_album']
    },
    google_drive: {
        name: 'Google Drive',
        url: 'https://drive.google.com',
        minDuration: 5000,
        maxDuration: 10000,
        actions: ['browse', 'create_folder']
    },
    google_calendar: {
        name: 'Google Calendar',
        url: 'https://calendar.google.com',
        minDuration: 3000,
        maxDuration: 7000,
        actions: ['create_event']
    },
    google_meet: {
        name: 'Google Meet',
        url: 'https://meet.google.com',
        minDuration: 5000,
        maxDuration: 10000,
        actions: ['browse', 'create_meeting']
    }
};

/**
 * Get routine by name
 */
function getRoutine(routineName) {
    const routine = ACTIVITIES[routineName];
    if (!routine) {
        console.log(`⚠️  Unknown routine: ${routineName}, using STANDARD`);
        return ACTIVITIES.STANDARD;
    }
    return routine;
}

/**
 * Get schedule by account age
 */
function getScheduleByAge(accountAgeDays) {
    if (accountAgeDays < 7) return SCHEDULES.NEW_ACCOUNT;
    if (accountAgeDays < 14) return SCHEDULES.EARLY_WARMUP;
    if (accountAgeDays < 30) return SCHEDULES.ACTIVE_WARMUP;
    return SCHEDULES.MAINTENANCE;
}

/**
 * Generate activity plan for a routine
 */
function generateActivityPlan(routineName, profileData = {}) {
    const routine = getRoutine(routineName);
    const plan = {
        routineName: routine.name,
        activities: [],
        estimatedDuration: routine.duration,
        intensity: routine.intensity
    };

    routine.activities.forEach(activityKey => {
        const config = ACTIVITY_CONFIG[activityKey];
        if (config) {
            plan.activities.push({
                key: activityKey,
                name: config.name,
                url: config.url,
                duration: Math.floor(Math.random() * (config.maxDuration - config.minDuration + 1)) + config.minDuration,
                actions: config.actions
            });
        }
    });

    return plan;
}

/**
 * Save routine plan to file
 */
function saveRoutinePlan(profileId, plan, filename = './users/routine-plans.json') {
    const fs = require('fs');
    const path = require('path');
    
    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let plans = {};
    if (fs.existsSync(filename)) {
        plans = JSON.parse(fs.readFileSync(filename, 'utf8'));
    }

    plans[profileId] = {
        ...plan,
        generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(filename, JSON.stringify(plans, null, 2));
    console.log(`✅ Saved routine plan for ${profileId}`);
}

/**
 * List all available routines
 */
function listRoutines() {
    console.log('\n📋 Available Warmup Routines:\n');
    
    Object.entries(ACTIVITIES).forEach(([key, routine]) => {
        console.log(`${key}`);
        console.log(`  Name: ${routine.name}`);
        console.log(`  Activities: ${routine.activities.length}`);
        console.log(`  Duration: ${routine.duration}`);
        console.log(`  Intensity: ${routine.intensity}\n`);
    });
}

/**
 * List all schedules
 */
function listSchedules() {
    console.log('\n📅 Warmup Schedules:\n');
    
    Object.entries(SCHEDULES).forEach(([key, schedule]) => {
        console.log(`${key}`);
        console.log(`  ${schedule.name}`);
        console.log(`  Routine: ${schedule.routine}`);
        console.log(`  Frequency: ${schedule.frequency}`);
        console.log(`  Duration: ${schedule.duration}`);
        console.log(`  Notes: ${schedule.notes}\n`);
    });
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === 'list') {
        listRoutines();
    } else if (command === 'schedules') {
        listSchedules();
    } else if (command === 'plan') {
        const routineName = args[1] || 'STANDARD';
        const profileId = args[2] || 'test-profile';
        
        console.log(`\n📋 Generating ${routineName} routine plan...\n`);
        const plan = generateActivityPlan(routineName);
        
        console.log(`Routine: ${plan.routineName}`);
        console.log(`Activities: ${plan.activities.length}`);
        console.log(`Duration: ${plan.estimatedDuration}`);
        console.log(`Intensity: ${plan.intensity}\n`);
        
        plan.activities.forEach((activity, i) => {
            console.log(`${i + 1}. ${activity.name}`);
            console.log(`   URL: ${activity.url}`);
            console.log(`   Duration: ${activity.duration}ms`);
            console.log(`   Actions: ${activity.actions.join(', ')}\n`);
        });

        if (args[3] === '--save') {
            saveRoutinePlan(profileId, plan);
        }
    } else {
        console.log('\nUsage:');
        console.log('  node warmup-routines.js list          - List all routines');
        console.log('  node warmup-routines.js schedules     - List schedules');
        console.log('  node warmup-routines.js plan <ROUTINE> - Generate activity plan');
        console.log('  node warmup-routines.js plan STANDARD k12am9a2 --save\n');
    }
}

module.exports = {
    ACTIVITIES,
    SCHEDULES,
    ACTIVITY_CONFIG,
    getRoutine,
    getScheduleByAge,
    generateActivityPlan,
    saveRoutinePlan,
    listRoutines,
    listSchedules
};
