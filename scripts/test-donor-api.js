#!/usr/bin/env node

const fetch = require('node-fetch');

async function testDonorSearch() {
  try {
    // First, get an access token by logging in
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'user14@example.com',
        password: '12345678'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;

    console.log('✅ Login successful');

    // Now test the donor search
    const searchParams = new URLSearchParams({
      blood_group: 'B+',
      lat: '23.82',
      lng: '90.36',
      radius_km: '20',
      only_available: 'false'
    });

    const searchResponse = await fetch(`http://localhost:3000/api/donors/search?${searchParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!searchResponse.ok) {
      console.error('Search failed:', await searchResponse.text());
      return;
    }

    const searchData = await searchResponse.json();
    console.log('✅ Search successful');
    console.log(`Found ${searchData.donors.length} donors:`);
    
    searchData.donors.forEach((donor, index) => {
      console.log(`${index + 1}. ${donor.name || 'No name'} (${donor.user_code}) - ${donor.blood_group}`);
      console.log(`   Location: ${donor.location_address || 'No address'}`);
      console.log(`   Available: ${donor.availability.isAvailable ? 'Yes' : 'No'}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDonorSearch();
