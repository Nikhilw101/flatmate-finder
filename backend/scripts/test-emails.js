/**
 * Run manually via: node scripts/test-emails.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

// We use the local real database for this quick smoke test.
const env = require('../src/config/env');
const { sendEmail } = require('../src/services/email.service');
const emailTemplates = require('../src/utils/emailTemplates');

const run = async () => {
    if (!env.BREVO_API_KEY) {
        console.error('❌ No BREVO_API_KEY found in .env. Exiting.');
        process.exit(1);
    }

    console.log('✅ Found BREVO_API_KEY. Starting email test...');

    const ownerEmail = 'nwagh008@gmail.com';
    const tenantEmail = 'swapnilkoli2035@gmail.com';

    console.log(`📧 Sending INTEREST_RECEIVED email to Owner (${ownerEmail})...`);
    
    // 1. Test High Compatibility Email (Owner)
    try {
        const { subject: subj1, htmlContent: html1 } = emailTemplates.highCompatibilityInterest({
            ownerName: 'Nitin',
            tenantName: 'Swapnil',
            score: 92,
            location: 'Mumbai - Andheri West',
            rent: '18000'
        });
        await sendEmail({ to: ownerEmail, toName: 'Nitin', subject: subj1, htmlContent: html1 });
        console.log('✅ INTEREST_RECEIVED email sent successfully.');
    } catch (err) {
        console.error('❌ Failed to send INTEREST_RECEIVED email:', err.message);
    }

    console.log(`\n📧 Sending INTEREST_ACCEPTED email to Tenant (${tenantEmail})...`);

    // 2. Test Interest Accepted Email (Tenant)
    try {
        const { subject: subj2, htmlContent: html2 } = emailTemplates.interestAccepted({
            tenantName: 'Swapnil',
            ownerName: 'Nitin',
            location: 'Mumbai - Andheri West'
        });
        await sendEmail({ to: tenantEmail, toName: 'Swapnil', subject: subj2, htmlContent: html2 });
        console.log('✅ INTEREST_ACCEPTED email sent successfully.');
    } catch (err) {
        console.error('❌ Failed to send INTEREST_ACCEPTED email:', err.message);
    }

    console.log(`\n📧 Sending INTEREST_DECLINED email to Tenant (${tenantEmail})...`);

    // 3. Test Interest Declined Email (Tenant)
    try {
        const { subject: subj3, htmlContent: html3 } = emailTemplates.interestDeclined({
            tenantName: 'Swapnil',
            location: 'Mumbai - Andheri West'
        });
        await sendEmail({ to: tenantEmail, toName: 'Swapnil', subject: subj3, htmlContent: html3 });
        console.log('✅ INTEREST_DECLINED email sent successfully.');
    } catch (err) {
        console.error('❌ Failed to send INTEREST_DECLINED email:', err.message);
    }

    console.log('\n🎉 Real email test completed! Check the inboxes of both email addresses.');
    process.exit(0);
};

run();
