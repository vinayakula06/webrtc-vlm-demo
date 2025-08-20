#!/usr/bin/env node
// get-network-ip.js - Quick script to find your network IP

const os = require('os');

function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  const results = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal (localhost) and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        results.push({
          interface: name,
          address: interface.address,
          mac: interface.mac
        });
      }
    }
  }
  
  console.log('🌐 Network IP Addresses Found:');
  console.log('================================');
  
  if (results.length === 0) {
    console.log('❌ No external network interfaces found.');
    console.log('📱 Make sure you\'re connected to WiFi or Ethernet.');
    return;
  }
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.interface}: ${result.address}`);
  });
  
  const primaryIP = results[0].address;
  const port = process.env.PORT || 3000;
  
  console.log('\n📱 Mobile URLs:');
  console.log(`- Receiver: http://${primaryIP}:${port}`);
  console.log(`- Sender: http://${primaryIP}:${port}/sender.html?room=room1`);
  
  console.log('\n📋 Instructions:');
  console.log('1. Make sure your phone is on the same WiFi network');
  console.log('2. Open the receiver URL on your computer');
  console.log('3. Scan the QR code with your phone, or manually enter the sender URL');
}

getNetworkIP();
