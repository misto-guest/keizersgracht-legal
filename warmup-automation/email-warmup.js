/**
 * Inter-Account Email Warmup System
 * Sends 1-2 emails per day between Gmail accounts to build trust
 */

const AdsPowerClient = require('./adspower-client');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    apiKey: '746feb8ab409fbb27a0377a864279e6c000f879a7a0e5329',
    accountsFile: './users/accounts.json',
    sentEmailsLog: './logs/sent-emails.json',
    emailsPerDay: 2, // Max emails to send per day
    minHoursBetweenEmails: 4, // Minimum hours between emails
};

// Helper functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Email templates
const emailTemplates = [
    {
        subject: 'Quick follow-up',
        body: `Hi {name},

Just wanted to follow up on our previous conversation. Hope everything is going well!

Best regards`
    },
    {
        subject: 'Project update',
        body: `Hey {name},

Quick update on what we're working on. Making good progress on the current tasks.

Let me know if you need anything.

Thanks!`
    },
    {
        subject: 'Question',
        body: `Hi {name},

I had a quick question about the project. When you have a moment, could you let me know your thoughts?

Thanks!`
    },
    {
        subject: 'Meeting notes',
        body: `Hey {name},

Here are a few notes from our earlier discussion. Let me know if I missed anything important.

Best`
    },
    {
        subject: 'Resource sharing',
        body: `Hi {name},

Came across this resource and thought it might be useful for what we're working on.

Hope it helps!

Best regards`
    }
];

/**
 * Load account configuration
 */
function loadAccounts() {
    try {
        const data = fs.readFileSync(CONFIG.accountsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('⚠️  No accounts file found, using defaults');
        return {
            accounts: [
                { email: 'patmcgee727@gmail.com', profileId: 'k12am9a2', name: 'Pat' }
            ]
        };
    }
}

/**
 * Load sent emails log
 */
function loadSentEmails() {
    try {
        const data = fs.readFileSync(CONFIG.sentEmailsLog, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { emails: [] };
    }
}

/**
 * Save sent emails log
 */
function saveSentEmails(log) {
    const logDir = path.dirname(CONFIG.sentEmailsLog);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG.sentEmailsLog, JSON.stringify(log, null, 2));
}

/**
 * Check if we can send email (rate limiting)
 */
function canSendEmail(fromEmail, toEmail) {
    const log = loadSentEmails();
    const now = Date.now();
    const today = new Date().toDateString();
    
    // Count emails sent today
    const todayEmails = log.emails.filter(e => {
        const emailDate = new Date(e.timestamp).toDateString();
        return emailDate === today;
    });
    
    if (todayEmails.length >= CONFIG.emailsPerDay) {
        return { allowed: false, reason: 'Daily limit reached' };
    }
    
    // Check minimum time between emails from this sender
    const lastEmailFromSender = log.emails
        .filter(e => e.from === fromEmail)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
    
    if (lastEmailFromSender) {
        const hoursSinceLastEmail = (now - new Date(lastEmailFromSender.timestamp).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEmail < CONFIG.minHoursBetweenEmails) {
            return { allowed: false, reason: `Too soon since last email (${hoursSinceLastEmail.toFixed(1)}h ago)` };
        }
    }
    
    return { allowed: true };
}

/**
 * Send email from one account to another
 */
async function sendEmail(fromProfile, toAccount) {
    console.log(`\n📧 Sending email: ${fromProfile.email} → ${toAccount.email}`);
    
    const client = new AdsPowerClient(CONFIG.apiKey);
    
    try {
        // Launch sender profile
        console.log('  Launching sender profile...');
        const launchResult = await client.startProfile(fromProfile.profileId);
        
        if (!launchResult.ws || !launchResult.ws.puppeteer) {
            throw new Error('Failed to launch profile');
        }
        
        await wait(5000);
        
        // Connect Puppeteer
        const browser = await puppeteer.connect({
            browserWSEndpoint: launchResult.ws.puppeteer,
            defaultViewport: null
        });
        
        const pages = await browser.pages();
        const page = pages[0] || await browser.newPage();
        
        // Go to Gmail
        console.log('  Opening Gmail...');
        await page.goto('https://mail.google.com', { waitUntil: 'networkidle2', timeout: 30000 });
        await wait(5000);
        
        // Check if already signed in
        const isSignedIn = await page.evaluate(() => {
            return !document.querySelector('input[type="email"]') && 
                   !document.querySelector('input[type="password"]');
        });
        
        if (!isSignedIn) {
            throw new Error('Not signed in to Gmail');
        }
        
        // Click compose button
        console.log('  Opening compose window...');
        try {
            await page.waitForSelector('div[role="button"][gh="cm"]', { timeout: 10000 });
            await page.click('div[role="button"][gh="cm"]');
            await wait(3000);
        } catch (e) {
            throw new Error('Could not find compose button');
        }
        
        // Fill recipient
        console.log(`  Setting recipient: ${toAccount.email}`);
        const toInput = await page.$('textarea[name="to"]') || await page.$('input[name="to"]');
        if (toInput) {
            await toInput.click();
            await wait(500);
            await toInput.type(toAccount.email);
            await wait(1000);
            await page.keyboard.press('Enter');
            await wait(1000);
        }
        
        // Select random template
        const template = emailTemplates[randomInt(0, emailTemplates.length - 1)];
        
        // Fill subject
        console.log(`  Subject: ${template.subject}`);
        const subjectInput = await page.$('input[name="subjectbox"]');
        if (subjectInput) {
            await subjectInput.click();
            await subjectInput.type(template.subject);
            await wait(1000);
        }
        
        // Fill body
        console.log('  Writing message...');
        const bodyEditor = await page.$('div[role="textbox"][g_editable="true"]');
        if (bodyEditor) {
            await bodyEditor.click();
            await wait(500);
            
            // Personalize template
            const personalizedBody = template.body.replace(/{name}/g, toAccount.name || 'there');
            await page.keyboard.type(personalizedBody);
            await wait(2000);
        }
        
        // Send email
        console.log('  Sending...');
        const sendBtn = await page.$('div[role="button"][aria-label*="Send"]') || 
                       await page.$('div[role="button"][data-tooltip*="Send"]');
        if (sendBtn) {
            await sendBtn.click();
            await wait(3000);
            console.log('  ✅ Email sent!');
        }
        
        // Close browser
        await browser.close();
        
        // Log the email
        const log = loadSentEmails();
        log.emails.push({
            from: fromProfile.email,
            to: toAccount.email,
            subject: template.subject,
            timestamp: new Date().toISOString()
        });
        saveSentEmails(log);
        
        return { success: true };
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Run email warmup for the day
 */
async function runDailyEmailWarmup() {
    console.log('\n🔄 Daily Email Warmup\n');
    console.log('═'.repeat(60));
    
    const accounts = loadAccounts();
    
    if (accounts.accounts.length < 2) {
        console.log('⚠️  Need at least 2 accounts for email warmup');
        console.log('   Add accounts to:', CONFIG.accountsFile);
        return { success: false, reason: 'Not enough accounts' };
    }
    
    console.log(`📊 Total accounts: ${accounts.accounts.length}`);
    console.log(`📧 Max emails per day: ${CONFIG.emailsPerDay}`);
    console.log(`⏱️  Min hours between emails: ${CONFIG.minHoursBetweenEmails}\n`);
    
    const log = loadSentEmails();
    const today = new Date().toDateString();
    const todayEmails = log.emails.filter(e => new Date(e.timestamp).toDateString() === today);
    
    console.log(`📝 Emails sent today: ${todayEmails.length}/${CONFIG.emailsPerDay}`);
    
    if (todayEmails.length >= CONFIG.emailsPerDay) {
        console.log('✅ Daily limit reached, nothing to do');
        return { success: true, sent: 0 };
    }
    
    // Calculate how many emails we can still send
    const emailsToSend = CONFIG.emailsPerDay - todayEmails.length;
    console.log(`🎯 Emails to send: ${emailsToSend}\n`);
    
    let sentCount = 0;
    
    for (let i = 0; i < emailsToSend; i++) {
        // Pick random sender and receiver (different accounts)
        const fromIndex = randomInt(0, accounts.accounts.length - 1);
        let toIndex = randomInt(0, accounts.accounts.length - 1);
        
        while (toIndex === fromIndex) {
            toIndex = randomInt(0, accounts.accounts.length - 1);
        }
        
        const fromAccount = accounts.accounts[fromIndex];
        const toAccount = accounts.accounts[toIndex];
        
        // Check if we can send
        const check = canSendEmail(fromAccount.email, toAccount.email);
        
        if (!check.allowed) {
            console.log(`⏭️  Skipping ${fromAccount.email}: ${check.reason}`);
            continue;
        }
        
        // Send the email
        const result = await sendEmail(fromAccount, toAccount);
        
        if (result.success) {
            sentCount++;
            console.log(`✅ Sent ${sentCount}/${emailsToSend}\n`);
            
            // Wait between emails
            if (sentCount < emailsToSend) {
                const waitTime = randomInt(60000, 180000); // 1-3 minutes
                console.log(`⏳ Waiting ${Math.round(waitTime/1000)}s before next email...\n`);
                await wait(waitTime);
            }
        } else {
            console.log('❌ Failed to send, trying next pair...\n');
        }
    }
    
    console.log('═'.repeat(60));
    console.log(`\n📊 Summary: ${sentCount}/${emailsToSend} emails sent\n`);
    
    return { success: true, sent: sentCount };
}

// Create sample accounts file if it doesn't exist
function createSampleAccountsFile() {
    const sampleData = {
        accounts: [
            {
                email: 'patmcgee727@gmail.com',
                profileId: 'k12am9a2',
                name: 'Pat McGee',
                status: 'new'
            },
            {
                email: 'account2@gmail.com',
                profileId: 'PROFILE_ID_2',
                name: 'Account Two',
                status: 'new'
            }
        ],
        lastUpdated: new Date().toISOString()
    };
    
    const accountsDir = path.dirname(CONFIG.accountsFile);
    if (!fs.existsSync(accountsDir)) {
        fs.mkdirSync(accountsDir, { recursive: true });
    }
    
    fs.writeFileSync(CONFIG.accountsFile, JSON.stringify(sampleData, null, 2));
    console.log(`\n✅ Created sample accounts file: ${CONFIG.accountsFile}`);
    console.log('   Update this file with your account details\n');
}

// Run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0] || 'run';
    
    if (command === 'init') {
        createSampleAccountsFile();
    } else if (command === 'run') {
        runDailyEmailWarmup()
            .then(result => {
                console.log('\n🏁 Done:', JSON.stringify(result, null, 2));
                process.exit(result.success ? 0 : 1);
            })
            .catch(error => {
                console.error('\n❌ Fatal error:', error);
                process.exit(1);
            });
    } else {
        console.log('\nUsage:');
        console.log('  node email-warmup.js init    - Create sample accounts file');
        console.log('  node email-warmup.js run     - Run daily email warmup\n');
    }
}

module.exports = { runDailyEmailWarmup, sendEmail };
