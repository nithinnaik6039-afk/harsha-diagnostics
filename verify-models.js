// verify-models.js - validator script
import mongoose from 'mongoose';

console.log('Testing Mongoose schemas compile...');

try {
  const User = (await import('./src/models/User.js')).default;
  const MLT = (await import('./src/models/MLT.js')).default;
  const Test = (await import('./src/models/Test.js')).default;
  const Order = (await import('./src/models/Order.js')).default;
  const ChatbotFAQ = (await import('./src/models/ChatbotFAQ.js')).default;
  const ServiceZone = (await import('./src/models/ServiceZone.js')).default;
  const DelayEvent = (await import('./src/models/DelayEvent.js')).default;
  const Partner = (await import('./src/models/Partner.js')).default;
  const Certificate = (await import('./src/models/Certificate.js')).default;

  console.log('✅ User model compiled successfully.');
  console.log('✅ MLT model compiled successfully.');
  console.log('✅ Test model compiled successfully.');
  console.log('✅ Order model compiled successfully.');
  console.log('✅ ChatbotFAQ model compiled successfully.');
  console.log('✅ ServiceZone model compiled successfully.');
  console.log('✅ DelayEvent model compiled successfully.');
  console.log('✅ Partner model compiled successfully.');
  console.log('✅ Certificate model compiled successfully.');

  console.log('\n🎉 ALL SCHEMAS COMPILED SUCCESSFULLY!');
  process.exit(0);
} catch (error) {
  console.error('❌ Schema compilation failed:');
  console.error(error);
  process.exit(1);
}
