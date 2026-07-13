const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Listing = require('../src/models/Listing');
const TenantProfile = require('../src/models/TenantProfile');
const Interest = require('../src/models/Interest');
const Compatibility = require('../src/models/Compatibility');
const jwt = require('jsonwebtoken');
const env = require('../src/config/env');

const generateToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '1h' });

describe('Admin Module (Stage 8)', () => {
    let adminToken, ownerToken, tenantToken;
    let adminUser, ownerUser, tenantUser, listing, tenantProfile, compatibility, interest;

    beforeEach(async () => {
        await User.deleteMany({});
        await Listing.deleteMany({});
        await TenantProfile.deleteMany({});
        await Interest.deleteMany({});
        await Compatibility.deleteMany({});

        // Create Users
        adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@test.com',
            password: 'password123',
            role: 'ADMIN'
        });
        adminToken = generateToken(adminUser._id);

        ownerUser = await User.create({
            name: 'Owner User',
            email: 'owner@test.com',
            password: 'password123',
            role: 'OWNER'
        });
        ownerToken = generateToken(ownerUser._id);

        tenantUser = await User.create({
            name: 'Tenant User',
            email: 'tenant@test.com',
            password: 'password123',
            role: 'TENANT'
        });
        tenantToken = generateToken(tenantUser._id);

        // Create Listing
        listing = await Listing.create({
            owner: ownerUser._id,
            location: 'Mumbai',
            rent: 15000,
            availableFrom: new Date(),
            roomType: 'Private Room',
            furnishingStatus: 'Fully Furnished',
            description: 'Nice room',
            isFilled: false
        });

        // Create Tenant Profile
        tenantProfile = await TenantProfile.create({
            tenant: tenantUser._id,
            age: 25,
            gender: 'MALE',
            occupation: 'Software Engineer',
            preferredLocation: 'Mumbai',
            minBudget: 10000,
            maxBudget: 20000,
            moveInDate: new Date(),
            preferences: {
                roomType: ['Private Room'],
                furnishingStatus: ['Fully Furnished']
            },
            habits: {
                smoking: 'NO',
                drinking: 'NO',
                pets: 'NO',
                dietaryPreference: 'ANY'
            },
            bio: 'Looking for a clean flat'
        });

        // Create Compatibility
        compatibility = await Compatibility.create({
            tenant: tenantUser._id,
            listing: listing._id,
            score: 85,
            engine: 'RULE',
            explanation: 'Good match'
        });

        // Create Interest
        interest = await Interest.create({
            tenant: tenantUser._id,
            owner: ownerUser._id,
            listing: listing._id,
            compatibility: compatibility._id,
            status: 'PENDING'
        });
    });

    describe('Platform Stats', () => {
        it('should fetch correct platform stats for admin', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.users.total).toBe(3); // admin, owner, tenant
            expect(res.body.data.listings.total).toBe(1);
            expect(res.body.data.interests.total).toBe(1);
        });

        it('should deny stats access to non-admin', async () => {
            const res = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${ownerToken}`);

            expect(res.status).toBe(403);
        });
    });

    describe('User Management', () => {
        it('should list users with pagination and search', async () => {
            const res = await request(app)
                .get('/api/v1/admin/users?role=OWNER&search=owner')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.users.length).toBe(1);
            expect(res.body.data.users[0].email).toBe('owner@test.com');
            expect(res.body.data.users[0].listingCount).toBe(1);
        });

        it('should disable a user account', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/users/${tenantUser._id}/disable`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isActive).toBe(false);

            // Verify disabled user cannot access protected routes
            const protectedRes = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${tenantToken}`);
            
            expect(protectedRes.status).toBe(403);
            expect(protectedRes.body.message).toMatch(/disabled/i);
        });

        it('should enable a disabled user account', async () => {
            await User.findByIdAndUpdate(tenantUser._id, { isActive: false });

            const res = await request(app)
                .patch(`/api/v1/admin/users/${tenantUser._id}/enable`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.isActive).toBe(true);
        });
    });

    describe('Listing Management', () => {
        it('should list all listings including filled ones', async () => {
            await Listing.create({
                owner: ownerUser._id,
                location: 'Delhi',
                rent: 10000,
                availableFrom: new Date(),
                roomType: 'Shared Room',
                furnishingStatus: 'Unfurnished',
                isFilled: true
            });

            const res = await request(app)
                .get('/api/v1/admin/listings')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.data.listings.length).toBe(2);
        });

        it('should toggle listing status', async () => {
            const res = await request(app)
                .patch(`/api/v1/admin/listings/${listing._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ isFilled: true });

            expect(res.status).toBe(200);
            expect(res.body.data.isFilled).toBe(true);
        });

        it('should delete a listing as admin', async () => {
            const res = await request(app)
                .delete(`/api/v1/admin/listings/${listing._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            const check = await Listing.findById(listing._id);
            expect(check).toBeNull();
        });
    });
});
