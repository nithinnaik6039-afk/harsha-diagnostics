import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import Test from './src/models/Test.js';
import ChatbotFAQ from './src/models/ChatbotFAQ.js';
import ServiceZone from './src/models/ServiceZone.js';
import User from './src/models/User.js';
import MLT from './src/models/MLT.js';
import Order from './src/models/Order.js';

dotenv.config();

const testsData = [
  {
    name: 'Random Blood Sugar (RBS)',
    category: 'Blood Sugar / Diabetes',
    price: 100,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '6 hours',
    description: 'Measures blood glucose levels at any time of day to screen for diabetes.'
  },
  {
    name: 'Fasting Sugar',
    category: 'Blood Sugar / Diabetes',
    price: 120,
    sampleType: 'Blood',
    fastingRequirement: 'Fasting required (8-12 hours)',
    turnaroundTime: '6 hours',
    description: 'Measures blood glucose levels after an overnight fast.'
  },
  {
    name: 'HBA1c (3-Month Avg. Blood Sugar)',
    category: 'Blood Sugar / Diabetes',
    price: 450,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Shows average blood sugar levels over the past 3 months to monitor diabetes control.'
  },
  {
    name: 'Lipid Profile',
    category: 'Lipid & Heart',
    price: 500,
    sampleType: 'Blood',
    fastingRequirement: 'Fasting required (10-12 hours)',
    turnaroundTime: '12 hours',
    description: 'Measures cholesterol and triglyceride levels to assess heart disease risk.'
  },
  {
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'Thyroid',
    price: 400,
    sampleType: 'Blood',
    fastingRequirement: 'Recommended early morning (8-12 hours fasting)',
    turnaroundTime: '12 hours',
    description: 'Evaluates thyroid gland function by checking hormone levels.'
  },
  {
    name: 'Liver Function Test (LFT)',
    category: 'Liver & Kidney',
    price: 600,
    sampleType: 'Blood',
    fastingRequirement: 'Recommended early morning (8-12 hours fasting)',
    turnaroundTime: '12 hours',
    description: 'Checks levels of proteins, liver enzymes, and bilirubin in blood to assess liver health.'
  },
  {
    name: 'Kidney / Renal Function Test (RFT)',
    category: 'Liver & Kidney',
    price: 600,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Measures urea, creatinine, and electrolytes to evaluate kidney performance.'
  },
  {
    name: 'HIV',
    category: 'Infection Screening',
    price: 300,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Screens for antibodies to Human Immunodeficiency Virus.'
  },
  {
    name: 'HBsAg',
    category: 'Infection Screening',
    price: 300,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Screens for Hepatitis B virus surface antigen.'
  },
  {
    name: 'HCV',
    category: 'Infection Screening',
    price: 500,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Screens for Hepatitis C virus antibodies.'
  },
  {
    name: 'VDRL',
    category: 'Infection Screening',
    price: 250,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Syphilis screening test.'
  },
  {
    name: 'Vitamin D',
    category: 'Vitamins',
    price: 900,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '24 hours',
    description: 'Measures Vitamin D levels for bone and immune health.'
  },
  {
    name: 'Vitamin B12',
    category: 'Vitamins',
    price: 700,
    sampleType: 'Blood',
    fastingRequirement: 'Recommended fasting',
    turnaroundTime: '24 hours',
    description: 'Checks Vitamin B12 levels which are critical for nerve function and blood cells.'
  },
  {
    name: 'Urine Analysis (Routine)',
    category: 'General / Routine',
    price: 150,
    sampleType: 'Urine',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Screens for urinary tract infections, kidney issues, or diabetes symptoms.'
  },
  {
    name: 'Complete Blood Picture (CBP/CBC)',
    category: 'General / Routine',
    price: 250,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Evaluates overall health and detects a wide range of disorders, including anemia and infection.'
  },
  {
    name: 'CRP',
    category: 'General / Routine',
    price: 400,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'C-reactive protein test checks for systemic inflammation.'
  },
  {
    name: 'INR / ATPP',
    category: 'General / Routine',
    price: 350,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Monitors blood clotting time.'
  },
  {
    name: 'Prolactin',
    category: "Women's Health",
    price: 500,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Measures prolactin hormone levels.'
  },
  {
    name: 'Beta HCG',
    category: "Women's Health",
    price: 500,
    sampleType: 'Blood',
    fastingRequirement: 'No fasting required',
    turnaroundTime: '12 hours',
    description: 'Checks levels of HCG hormone to confirm pregnancy.'
  },
  {
    name: 'Iron Profile',
    category: 'Iron Studies',
    price: 600,
    sampleType: 'Blood',
    fastingRequirement: 'Recommended early morning (8-12 hours fasting)',
    turnaroundTime: '12 hours',
    description: 'Evaluates iron levels and iron storage capacity in the body.'
  },
  {
    name: 'Full Body Checkup Package',
    category: 'Bundles',
    price: 999,
    sampleType: 'Multi-sample',
    fastingRequirement: 'Yes (10-12 hours fasting)',
    turnaroundTime: '24 hours',
    tests: [
      'Complete Blood Picture (CBP/CBC)',
      'Random Blood Sugar (RBS)',
      'Thyroid Profile (T3, T4, TSH)',
      'Lipid Profile',
      'Liver Function Test (LFT)',
      'Kidney / Renal Function Test (RFT)',
      'Urine Analysis (Routine)'
    ],
    description: 'Comprehensive health checkup covering glucose, cholesterol, liver, kidney, blood counts, and urine.'
  },
  {
    name: 'Diabetes/Thyroid/Liver Package',
    category: 'Bundles',
    price: 799,
    sampleType: 'Blood',
    fastingRequirement: 'Yes (8-12 hours fasting)',
    turnaroundTime: '12 hours',
    tests: [
      'Fasting Sugar',
      'HBA1c (3-Month Avg. Blood Sugar)',
      'Thyroid Profile (T3, T4, TSH)',
      'Liver Function Test (LFT)'
    ],
    description: 'Essential wellness package to track diabetes markers, thyroid, and liver values.'
  }
];

const faqsData = [
  {
    question_en: 'What are your working hours?',
    question_te: 'మీ పని వేళలు ఏమిటి?',
    answer_en: 'We are open 7:00 AM to 9:00 PM, all 7 days. Early-morning slots (6–8 AM) are available for fasting tests.',
    answer_te: 'మేము వారంలో 7 రోజులు ఉదయం 7:00 నుండి రాత్రి 9:00 వరకు అందుబాటులో ఉంటాము. ఖాళీ కడుపుతో చేసే పరీక్షల కోసం తెల్లవారుజామున (ఉదయం 6-8 గంటలకు) స్లాట్లు అందుబాటులో ఉన్నాయి.',
    keywords: ['hours', 'timings', 'time', 'open', 'working', 'సమయం', 'పనివేళలు'],
    order: 1
  },
  {
    question_en: 'Where is Harsha Diagnostics located?',
    question_te: 'హర్ష డయాగ్నోస్టిక్స్ ఎక్కడ ఉంది?',
    answer_en: '#26/3, Venkateswara Swamy Arch, Opposite Housing Board, 80 Feet Road, MIG Bus Stand, Anantapuramu – 515001.',
    answer_te: '#26/3, వెంకటేశ్వర స్వామి ఆర్చ్, హౌసింగ్ బోర్డు ఎదురుగా, 80 ఫీట్ల రోడ్డు, MIG బస్ స్టాండ్, అనంతపురము - 515001.',
    keywords: ['location', 'address', 'branch', 'where', 'అడ్రస్', 'ఎక్కడ', 'హౌసింగ్ బోర్డ్'],
    order: 2
  },
  {
    question_en: 'Is home collection really free?',
    question_te: 'ఇంటి వద్ద శాంపిల్ కలెక్షన్ నిజంగా ఉచితమేనా?',
    answer_en: 'Yes! Home collection is 100% free within 3 km. From 3–5 km a small ₹20 visit charge applies, shown clearly at checkout.',
    answer_te: 'అవును! 3 కిలోమీటర్ల లోపు హోమ్ కలెక్షన్ 100% ఉచితం. 3-5 కిలోమీటర్ల దూరానికి ₹20 ల విజిటింగ్ ఛార్జీ వర్తిస్తుంది.',
    keywords: ['free', 'home', 'collection', 'charge', 'cost', 'విజిట్', 'ఛార్జీ', 'ఉచితం'],
    order: 3
  },
  {
    question_en: 'How do I book a test?',
    question_te: 'నేను టెస్ట్ ఎలా బుక్ చేయాలి?',
    answer_en: 'Open the app → search your test → add to cart → choose address & time slot → pay online or pay the technician at home. Done in under 2 minutes!',
    answer_te: 'యాప్ ఓపెన్ చేయండి → టెస్ట్ సెర్చ్ చేయండి → కార్ట్‌కి యాడ్ చేయండి → అడ్రస్ మరియు టైమ్ స్లాట్ ఎంచుకోండి → ఆన్‌లైన్‌లో లేదా ఇంటి వద్ద టెక్నీషియన్‌కు పే చేయండి. 2 నిమిషాల లోపు పూర్తవుతుంది!',
    keywords: ['book', 'order', 'appointment', 'how', 'బుకింగ్', 'ఎలా'],
    order: 4
  },
  {
    question_en: 'When will I get my report?',
    question_te: 'నా రిపోర్ట్ ఎప్పుడు వస్తుంది?',
    answer_en: "Most reports are ready within 6–24 hours. You get a PDF in the app, plus a WhatsApp/email copy the moment it's ready.",
    answer_te: 'చాలా వరకు రిపోర్ట్‌లు 6-24 గంటలలోపు సిద్ధమవుతాయి. సిద్ధమైన వెంటనే యాప్‌లో PDF ద్వారా, అలాగే వాట్సాప్/ఈమెయిల్ ద్వారా అందుతాయి.',
    keywords: ['report', 'result', 'pdf', 'when', 'రిపోర్ట్', 'ఎప్పుడు', 'ఫలితాలు'],
    order: 5
  },
  {
    question_en: 'Is the technician certified?',
    question_te: 'టెక్నీషియన్ సర్టిఫైడ్ లేబొరేటరీ టెక్నీషియనేనా?',
    answer_en: 'Yes. Every MLT is a certified lab technician. You can see their photo, certificate badge and rating in the app before they arrive — and verify them with a 4-digit safety PIN.',
    answer_te: 'అవును. ప్రతి MLT సర్టిఫైడ్ ల్యాబ్ టెక్నీషియన్. వారు వచ్చే ముందే యాప్‌లో వారి ఫోటో, సర్టిఫికేట్ బ్యాడ్జ్ మరియు రేటింగ్ చూడవచ్చు.',
    keywords: ['technician', 'phlebotomist', 'mlt', 'certified', 'safe', 'టెక్నీషియన్', 'నమ్మకమైన'],
    order: 6
  },
  {
    question_en: 'Do I need fasting for my test?',
    question_te: 'టెస్ట్ కోసం ఖాళీ కడుపుతో ఉండాలా?',
    answer_en: 'It depends on the test. Each test in the app clearly shows if fasting is needed and for how many hours. Fasting tests get priority early-morning slots.',
    answer_te: 'ఇది మీరు చేసుకునే టెస్ట్ పైన ఆధారపడి ఉంటుంది. ప్రతి టెస్ట్ పక్కన ఖాళీ కడుపుతో ఉండాలా లేదా అనేది స్పష్టంగా ఉంటుంది.',
    keywords: ['fasting', 'empty', 'stomach', 'eat', 'food', 'ఫాస్టింగ్', 'కడుపు'],
    order: 7
  },
  {
    question_en: 'How do I pay?',
    question_te: 'నేను పేమెంట్ ఎలా చేయాలి?',
    answer_en: 'UPI, debit/credit card, net banking — or simply pay cash/UPI to the technician after sample collection.',
    answer_te: 'UPI, డెబిట్/క్రెడిట్ కార్డ్, నెట్ బ్యాంకింగ్ ద్వారా లేదా శాంపిల్ సేకరించిన తర్వాత టెక్నీషియన్‌కు నగదు/UPI ద్వారా చెల్లించవచ్చు.',
    keywords: ['pay', 'payment', 'cash', 'upi', 'card', 'డబ్బులు', 'పేమెంట్'],
    order: 8
  },
  {
    question_en: 'Can I book for my parents or family?',
    question_te: 'నేను నా తల్లిదండ్రులు లేదా కుటుంబ సభ్యుల కోసం బుక్ చేయవచ్చా?',
    answer_en: 'Yes! Add family member profiles in the app and book for anyone. You can also track the technician live for their visit.',
    answer_te: 'అవును! యాప్‌లో కుటుంబ సభ్యుల ప్రొఫైల్‌లను యాడ్ చేసి ఎవరికైనా బుక్ చేయవచ్చు.',
    keywords: ['family', 'parents', 'children', 'others', 'కుటుంబం', 'పేరెంట్స్'],
    order: 9
  },
  {
    question_en: 'What if I need to cancel?',
    question_te: 'ఒకవేళ బుకింగ్ రద్దు చేయాలంటే ఎలా?',
    answer_en: 'Cancellation is free any time before a technician is assigned. After assignment, a small charge may apply. Refunds are processed in 3–5 working days.',
    answer_te: 'టెక్నీషియన్ కేటాయించబడక ముందే క్యాన్సిలేషన్ ఉచితం. కేటాయించిన తర్వాత చిన్న రుసుము వర్తించవచ్చు.',
    keywords: ['cancel', 'cancellation', 'refund', 'మార్చుకోండి', 'క్యాన్సిల్'],
    order: 10
  },
  {
    question_en: 'Which areas do you serve?',
    question_te: 'మీరు ఏ ఏ ప్రాంతాలలో సేవలందిస్తున్నారు?',
    answer_en: "Currently we serve within 5 km of our center in Anantapuramu. Enter your address in the app to instantly check. We're expanding soon — join the waitlist if you're outside!",
    answer_te: 'ప్రస్తుతం మేము అనంతపురములోని మా సెంటర్ నుండి 5 కిలోమీటర్ల లోపు సేవలందిస్తున్నాము. యాప్‌లో మీ చిరునామాను ఎంటర్ చేసి చెక్ చేసుకోండి.',
    keywords: ['area', 'serve', 'service', 'locations', 'అనంతపురం', 'ప్రాంతాలు'],
    order: 11
  },
  {
    question_en: 'How can I contact you?',
    question_te: 'మిమ్మల్ని ఎలా సంప్రదించాలి?',
    answer_en: "Call or WhatsApp us at 1800-200-8899, or use the in-app chat. We're happy to help!",
    answer_te: 'మాకు 1800-200-8899 నంబర్‌కు కాల్ లేదా వాట్సాప్ చేయండి, లేదా యాప్ ద్వారా సంప్రదించండి.',
    keywords: ['contact', 'phone', 'whatsapp', 'call', 'support', 'ఫోన్', 'సహాయం', 'వాట్సాప్'],
    order: 12
  }
];

const zoneData = {
  name: 'Zone 1 — Launch Zone',
  centerCoordinates: {
    lat: 14.6819,
    lng: 77.6006
  },
  radiusKm: 5.0,
  freeRadiusKm: 3.0,
  extraChargeAmount: 20.0,
  isActive: true
};

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/harsha-diagnostics';
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database.');

    // Clean existing data
    console.log('Cleaning collections...');
    await Test.deleteMany({});
    await ChatbotFAQ.deleteMany({});
    await ServiceZone.deleteMany({});
    await User.deleteMany({});
    await MLT.deleteMany({});
    await Order.deleteMany({});

    // Seed Tests
    console.log(`Seeding ${testsData.length} tests...`);
    const seededTests = await Test.insertMany(testsData);
    console.log('✅ Tests seeded.');

    // Seed FAQs
    console.log(`Seeding ${faqsData.length} FAQs...`);
    await ChatbotFAQ.insertMany(faqsData);
    console.log('✅ FAQs seeded.');

    // Seed Service Zone
    console.log('Seeding Service Zone...');
    await ServiceZone.create(zoneData);
    console.log('✅ Service Zone seeded.');

    // Seed Customer Profile (Phone: 9876543210)
    console.log('Seeding Customer Profile...');
    const user = await User.create({
      name: 'Nithin Naik',
      firstName: 'Nithin',
      lastName: 'Naik',
      password: crypto.createHash('sha256').update('password123').digest('hex'),
      phone: '9876543210',
      email: 'customer.test@harsha.com',
      gender: 'Male',
      age: 28,
      addresses: [
        {
          name: 'Home Address',
          addressLine: 'MIG-42, Housing Board Colony, Anantapuramu',
          coordinates: { lat: 14.6815, lng: 77.6001 }
        }
      ],
      familyMembers: [
        { name: 'Srinivas Naik', age: 55, gender: 'Male', relation: 'Father' },
        { name: 'Sarada Devi', age: 48, gender: 'Female', relation: 'Mother' }
      ]
    });
    console.log('✅ Customer Profile seeded.');

    // Seed Phlebotomists (MLTs)
    console.log('Seeding MLT Phlebotomists...');
    const mlt1 = await MLT.create({
      name: 'Rajesh Kumar (MLT)',
      phone: '1112223334',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=250&auto=format&fit=crop',
      certificateUrl: 'https://res.cloudinary.com/demo/image/upload/sample_certificate.pdf',
      isVerified: true,
      isOnline: true,
      liveLocation: { lat: 14.6822, lng: 77.6010, updatedAt: new Date() },
      rating: 4.9,
      ratingsCount: 28,
      earnings: 2450
    });

    const mlt2 = await MLT.create({
      name: 'Anita Rao (MLT)',
      phone: '8765432109',
      photoUrl: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=250&auto=format&fit=crop',
      certificateUrl: 'https://res.cloudinary.com/demo/image/upload/sample_certificate.pdf',
      isVerified: true,
      isOnline: false,
      liveLocation: { lat: 14.6750, lng: 77.5950, updatedAt: new Date() },
      rating: 4.8,
      ratingsCount: 15,
      earnings: 1200
    });
    console.log('✅ MLTs seeded.');

    // Find seeded test IDs
    const cbcTest = seededTests.find(t => t.name.includes('CBP/CBC'));
    const thyroidTest = seededTests.find(t => t.name.includes('Thyroid Profile'));
    const rbsTest = seededTests.find(t => t.name.includes('RBS'));
    const fullBodyPack = seededTests.find(t => t.name.includes('Full Body Checkup'));

    // Seed Orders
    console.log('Seeding Orders...');
    
    // Order 1: Booked (Unassigned)
    await Order.create({
      customer: user._id,
      patient: { name: 'Nithin Naik', age: 24, gender: 'Male' },
      tests: [cbcTest._id],
      address: {
        addressLine: 'MIG-42, Housing Board Colony, Anantapuramu',
        coordinates: { lat: 14.6815, lng: 77.6001 }
      },
      slot: { date: new Date(Date.now() + 86400000), time: '09:00 AM - 10:00 AM' },
      status: 'Booked',
      payment: { method: 'CashOnCollection', status: 'Pending', amount: 250 },
      safetyPin: '1234',
      distanceFromCenter: 0.15,
      collectionCharge: 0
    });

    // Order 2: Assigned (to Rajesh Kumar)
    await Order.create({
      customer: user._id,
      patient: { name: 'Srinivas Naik', age: 55, gender: 'Male' },
      tests: [fullBodyPack._id],
      address: {
        addressLine: 'MIG-42, Housing Board Colony, Anantapuramu',
        coordinates: { lat: 14.6815, lng: 77.6001 }
      },
      slot: { date: new Date(), time: '07:00 AM - 08:00 AM' },
      status: 'Assigned',
      assignedMLT: mlt1._id,
      payment: { method: 'UPI', status: 'Paid', amount: 999, transactionId: 'pay_ABC123XYZ' },
      safetyPin: '4321',
      distanceFromCenter: 0.15,
      collectionCharge: 0
    });

    // Order 3: Collected (to Rajesh Kumar)
    await Order.create({
      customer: user._id,
      patient: { name: 'Nithin Naik', age: 24, gender: 'Male' },
      tests: [thyroidTest._id],
      address: {
        addressLine: 'MIG-42, Housing Board Colony, Anantapuramu',
        coordinates: { lat: 14.6815, lng: 77.6001 }
      },
      slot: { date: new Date(Date.now() - 86400000), time: '08:00 AM - 09:00 AM' },
      status: 'Collected',
      assignedMLT: mlt1._id,
      payment: { method: 'UPI', status: 'Paid', amount: 400, transactionId: 'pay_DEF456UVW' },
      safetyPin: '5678',
      distanceFromCenter: 0.15,
      collectionCharge: 0
    });

    // Order 4: Completed (ReportReady) (by Anita Rao)
    await Order.create({
      customer: user._id,
      patient: { name: 'Sarada Devi', age: 48, gender: 'Female' },
      tests: [rbsTest._id],
      address: {
        addressLine: 'MIG-42, Housing Board Colony, Anantapuramu',
        coordinates: { lat: 14.6815, lng: 77.6001 }
      },
      slot: { date: new Date(Date.now() - 172800000), time: '10:00 AM - 11:00 AM' },
      status: 'ReportReady',
      assignedMLT: mlt2._id,
      payment: { method: 'Card', status: 'Paid', amount: 100, transactionId: 'pay_GHI789OPQ' },
      safetyPin: '9900',
      distanceFromCenter: 0.15,
      collectionCharge: 0,
      reports: ['https://res.cloudinary.com/demo/image/upload/sample.pdf']
    });

    console.log('✅ Orders seeded.');
    console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:');
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
