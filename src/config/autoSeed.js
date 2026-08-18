import Test from '../models/Test.js';
import ServiceZone from '../models/ServiceZone.js';
import ChatbotFAQ from '../models/ChatbotFAQ.js';

export const autoSeedIfEmpty = async () => {
  try {
    const testCount = await Test.countDocuments();
    if (testCount > 0) {
      console.log(`[AutoSeed] Database already initialized with ${testCount} diagnostic tests.`);
      return;
    }

    console.log('[AutoSeed] Fresh database detected. Initializing Harsha Diagnostics catalog & zones...');

    const defaultTests = [
      {
        name: 'Complete Blood Picture (CBP / CBC)',
        category: 'Hematology',
        price: 250,
        sampleType: 'Whole Blood (EDTA Purple Tube)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '6 hours',
        description: 'Complete hemogram measuring Hemoglobin, RBC, WBC count, Platelets, MCV, MCH, and ESR.',
        isActive: true
      },
      {
        name: 'Random Blood Sugar (RBS)',
        category: 'Sugar',
        price: 100,
        sampleType: 'Sodium Fluoride (Grey Tube)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '4 hours',
        description: 'Measures instant blood glucose levels to screen for acute diabetes or hypoglycemia.',
        isActive: true
      },
      {
        name: 'Fasting Blood Sugar (FBS)',
        category: 'Sugar',
        price: 120,
        sampleType: 'Sodium Fluoride (Grey Tube)',
        fastingRequirement: '8-10 hours overnight fasting',
        turnaroundTime: '4 hours',
        description: 'Measures baseline glucose levels after fasting to diagnose pre-diabetes and diabetes.',
        isActive: true
      },
      {
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'Sugar',
        price: 450,
        sampleType: 'Whole Blood (EDTA Purple Tube)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '6 hours',
        description: 'Gold standard test reflecting average blood sugar control over the past 90 days.',
        isActive: true
      },
      {
        name: 'Lipid & Cholesterol Profile',
        category: 'Lipid',
        price: 500,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: '10-12 hours overnight fasting',
        turnaroundTime: '8 hours',
        description: 'Comprehensive cardiovascular assessment measuring Total Cholesterol, HDL, LDL, VLDL, and Triglycerides.',
        isActive: true
      },
      {
        name: 'Thyroid Function Profile (T3, T4, TSH)',
        category: 'Thyroid',
        price: 400,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: 'Morning fasting recommended',
        turnaroundTime: '8 hours',
        description: 'Evaluates endocrine metabolism, hypo/hyper-thyroidism, and hormone regulation.',
        isActive: true
      },
      {
        name: 'Liver Function Test (LFT)',
        category: 'Liver',
        price: 600,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: '8 hours fasting recommended',
        turnaroundTime: '8 hours',
        description: 'Comprehensive liver enzyme and protein panel: Bilirubin (Total/Direct), SGOT/AST, SGPT/ALT, Alkaline Phosphatase, Total Protein, and Albumin.',
        isActive: true
      },
      {
        name: 'Kidney / Renal Function Test (KFT / RFT)',
        category: 'Liver',
        price: 600,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '8 hours',
        description: 'Renal clearance panel: Blood Urea Nitrogen (BUN), Serum Creatinine, Uric Acid, and Electrolytes (Na+, K+, Cl-).',
        isActive: true
      },
      {
        name: 'Vitamin D (25-Hydroxy)',
        category: 'Vitamins',
        price: 900,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '12 hours',
        description: 'Measures circulating 25-OH Vitamin D for bone density, calcium absorption, and immunity.',
        isActive: true
      },
      {
        name: 'Vitamin B12 (Cyanocobalamin)',
        category: 'Vitamins',
        price: 800,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: 'Fasting recommended',
        turnaroundTime: '12 hours',
        description: 'Crucial for neurological health, nerve sheath integrity, and red blood cell production.',
        isActive: true
      },
      {
        name: 'Complete Health Master Checkup Package',
        category: 'Bundles',
        price: 1499,
        sampleType: 'Multi-Tube (EDTA + SST + Fluoride)',
        fastingRequirement: '10-12 hours overnight fasting',
        turnaroundTime: '12 hours',
        description: 'Includes CBP, Fasting Sugar, HbA1c, Lipid Profile, LFT, KFT, and Thyroid Profile at 50% package savings.',
        isActive: true
      }
    ];

    await Test.insertMany(defaultTests);
    console.log(`[AutoSeed] Successfully created ${defaultTests.length} default diagnostic catalog tests.`);

    // Check service zone
    const zoneCount = await ServiceZone.countDocuments();
    if (zoneCount === 0) {
      await ServiceZone.create({
        name: 'Anantapur City Diagnostic Hub',
        centerCoordinates: { lat: 14.6819, lng: 77.6006 },
        radiusKm: 5.0,
        freeRadiusKm: 3.0,
        extraChargeAmount: 20.0,
        isActive: true
      });
      console.log('[AutoSeed] Created default Anantapur Service Zone.');
    }

    // Check FAQs
    const faqCount = await ChatbotFAQ.countDocuments();
    if (faqCount === 0) {
      await ChatbotFAQ.insertMany([
        {
          question_en: 'How do I prepare for fasting blood tests?',
          question_te: 'ఉపవాస రక్త పరీక్షలకు ఎలా సిద్ధం కావాలి?',
          answer_en: 'Drink plain water only for 8-12 hours prior to sample collection. Avoid tea, coffee, breakfast, or smoking.',
          answer_te: 'నమూనా సేకరించడానికి 8-12 గంటల ముందు కేవలం మంచినీరు మాత్రమే తాగండి. టీ, కాఫీ, అల్పాహారం లేదా ధూమపానం నివారించండి.',
          category: 'Preparation',
          order: 1,
          isActive: true
        },
        {
          question_en: 'When will I receive my digital reports?',
          question_te: 'నా డిజిటల్ నివేదికలు ఎప్పుడు అందుతాయి?',
          answer_en: 'Routine tests (Sugar, CBP) are delivered in 4-6 hours. Specialized profiles (Vitamins, HbA1c) are delivered within 12 hours via WhatsApp, SMS, and this app.',
          answer_te: 'సాధారణ పరీక్షలు 4-6 గంటల్లో అందుతాయి. ప్రత్యేక పరీక్షల నివేదికలు 12 గంటల్లోపు వాట్సాప్, SMS మరియు ఈ యాప్‌లో డౌన్‌లోడ్ చేసుకోవచ్చు.',
          category: 'Reports',
          order: 2,
          isActive: true
        }
      ]);
      console.log('[AutoSeed] Created default multilingual chatbot FAQs.');
    }
  } catch (err) {
    console.error('[AutoSeed] Non-blocking seeding error:', err.message);
  }
};
