import crypto from 'crypto';

// Helper to generate a valid 24-character hexadecimal ObjectId string
export const generateObjectId = () => {
  return crypto.randomBytes(12).toString('hex');
};

// Helper to extract nested value from an object (e.g. 'address.coordinates.lat')
const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
};

// Helper to set nested value
const setNestedValue = (obj, path, value) => {
  if (!obj || !path) return;
  const parts = path.split('.');
  let curr = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!curr[part] || typeof curr[part] !== 'object') {
      curr[part] = {};
    }
    curr = curr[part];
  }
  curr[parts[parts.length - 1]] = value;
};

// Query matcher function supporting Mongo operators ($or, $and, $in, $nin, $regex, $ne, $exists, etc.)
export const matchDoc = (doc, query) => {
  if (!query || Object.keys(query).length === 0) return true;

  for (const key of Object.keys(query)) {
    if (key === '$or') {
      const orList = query['$or'];
      if (Array.isArray(orList) && orList.length > 0) {
        const matchesAny = orList.some(subQuery => matchDoc(doc, subQuery));
        if (!matchesAny) return false;
      }
      continue;
    }

    if (key === '$and') {
      const andList = query['$and'];
      if (Array.isArray(andList) && andList.length > 0) {
        const matchesAll = andList.every(subQuery => matchDoc(doc, subQuery));
        if (!matchesAll) return false;
      }
      continue;
    }

    const val = query[key];
    const docVal = getNestedValue(doc, key);

    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof RegExp) && !(val instanceof Date)) {
      if ('$in' in val) {
        const inList = (val['$in'] || []).map(x => (x?._id ? x._id.toString() : x?.toString()));
        const docValStr = docVal?._id ? docVal._id.toString() : docVal?.toString();
        if (!inList.includes(docValStr)) return false;
        continue;
      }
      if ('$nin' in val) {
        const ninList = (val['$nin'] || []).map(x => (x?._id ? x._id.toString() : x?.toString()));
        const docValStr = docVal?._id ? docVal._id.toString() : docVal?.toString();
        if (ninList.includes(docValStr)) return false;
        continue;
      }
      if ('$regex' in val) {
        const flags = val['$options'] || '';
        const reg = new RegExp(val['$regex'], flags);
        if (!reg.test(String(docVal || ''))) return false;
        continue;
      }
      if ('$ne' in val) {
        const targetNe = val['$ne']?.toString ? val['$ne'].toString() : val['$ne'];
        const actualVal = docVal?.toString ? docVal.toString() : docVal;
        if (actualVal === targetNe) return false;
        continue;
      }
      if ('$exists' in val) {
        const exists = Boolean(val['$exists']);
        const isPresent = docVal !== undefined && docVal !== null;
        if (exists !== isPresent) return false;
        continue;
      }
      if ('$gt' in val) {
        if (!(docVal > val['$gt'])) return false;
        continue;
      }
      if ('$gte' in val) {
        if (!(docVal >= val['$gte'])) return false;
        continue;
      }
      if ('$lt' in val) {
        if (!(docVal < val['$lt'])) return false;
        continue;
      }
      if ('$lte' in val) {
        if (!(docVal <= val['$lte'])) return false;
        continue;
      }
    }

    if (val instanceof RegExp) {
      if (!val.test(String(docVal || ''))) return false;
      continue;
    }

    // Direct comparison
    if (val === null || val === undefined) {
      if (docVal !== null && docVal !== undefined) return false;
    } else if (docVal === null || docVal === undefined) {
      return false;
    } else {
      const valStr = val?._id ? val._id.toString() : (val.toString ? val.toString() : String(val));
      const docValStr = docVal?._id ? docVal._id.toString() : (docVal.toString ? docVal.toString() : String(docVal));
      if (valStr !== docValStr && val !== docVal) {
        return false;
      }
    }
  }

  return true;
};

// Document wrapper that mimics Mongoose document methods
export class MockDocument {
  constructor(data = {}, collectionName = '', store = null) {
    Object.assign(this, JSON.parse(JSON.stringify(data)));
    
    if (!this._id) {
      this._id = generateObjectId();
    } else {
      this._id = this._id.toString();
    }
    
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();

    if (collectionName === 'orders') {
      if (!this.statusTimeline || !Array.isArray(this.statusTimeline)) {
        this.statusTimeline = [{ status: this.status || 'Booked', timestamp: new Date() }];
      }
      if (!this.reports || !Array.isArray(this.reports)) {
        this.reports = [];
      }
      if (!this.declinedMLTs || !Array.isArray(this.declinedMLTs)) {
        this.declinedMLTs = [];
      }
    }

    Object.defineProperty(this, '_collectionName', { value: collectionName, writable: true });
    Object.defineProperty(this, '_store', { value: store, writable: true });
  }

  async save() {
    this.updatedAt = new Date();
    if (this._store && this._collectionName) {
      this._store.saveDoc(this._collectionName, this);
    }
    return this;
  }

  toObject() {
    const copy = { ...this };
    return copy;
  }

  toJSON() {
    return this.toObject();
  }
}

// Query wrapper that supports .populate(), .sort(), .select(), .limit(), .lean() and is Thenable
export class MockQuery {
  constructor(executor, store = null) {
    this._executor = executor;
    this._store = store;
    this._populates = [];
    this._sortObj = null;
    this._selectFields = null;
    this._limitCount = null;
    this._isLean = false;
  }

  populate(path, select) {
    if (typeof path === 'object' && path !== null) {
      this._populates.push(path);
    } else {
      this._populates.push({ path, select });
    }
    return this;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  select(fields) {
    this._selectFields = fields;
    return this;
  }

  limit(count) {
    this._limitCount = count;
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  async exec() {
    let result = await this._executor();

    if (!result) return result;

    const isArray = Array.isArray(result);
    // Create shallow copies so mutations during population do not corrupt original store objects
    let items = isArray 
      ? result.map(r => new MockDocument(r, r._collectionName, this._store)) 
      : [new MockDocument(result, result._collectionName, this._store)];

    // 1. Sorting
    if (this._sortObj) {
      const keys = Object.keys(this._sortObj);
      items.sort((a, b) => {
        for (const key of keys) {
          const dir = this._sortObj[key];
          const valA = getNestedValue(a, key);
          const valB = getNestedValue(b, key);
          if (valA < valB) return dir === 1 || dir === 'asc' ? -1 : 1;
          if (valA > valB) return dir === 1 || dir === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    // 2. Limit
    if (this._limitCount !== null && this._limitCount > 0) {
      items = items.slice(0, this._limitCount);
    }

    // 3. Populates
    if (this._store && this._populates.length > 0) {
      for (const pop of this._populates) {
        for (const item of items) {
          const refVal = getNestedValue(item, pop.path);
          if (!refVal) continue;

          let targetCollection = '';
          if (pop.path === 'customer') targetCollection = 'users';
          else if (pop.path === 'assignedMLT' || pop.path === 'declinedMLTs' || pop.path === 'mlt') targetCollection = 'mlts';
          else if (pop.path === 'tests') targetCollection = 'tests';
          else if (pop.path === 'assignedPartnerId' || pop.path === 'partner') targetCollection = 'partners';

          if (!targetCollection || !this._store[targetCollection]) continue;

          if (Array.isArray(refVal)) {
            const populatedList = refVal.map(id => {
              const idStr = id?._id ? id._id.toString() : id?.toString();
              const found = this._store[targetCollection].items.find(x => x._id.toString() === idStr);
              return found ? filterFields(found, pop.select) : id;
            });
            setNestedValue(item, pop.path, populatedList);
          } else {
            const idStr = refVal?._id ? refVal._id.toString() : refVal?.toString();
            const found = this._store[targetCollection].items.find(x => x._id.toString() === idStr);
            if (found) {
              setNestedValue(item, pop.path, filterFields(found, pop.select));
            }
          }
        }
      }
    }

    // 4. Select fields
    if (this._selectFields) {
      items = items.map(item => filterFields(item, this._selectFields));
    }

    // 5. Lean
    if (this._isLean) {
      items = items.map(i => (i.toObject ? i.toObject() : i));
    }

    return isArray ? items : items[0];
  }

  then(onFulfilled, onRejected) {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.exec().catch(onRejected);
  }

  finally(onFinally) {
    return this.exec().finally(onFinally);
  }

  get [Symbol.toStringTag]() {
    return 'Promise';
  }
}

// Helper to filter selected fields on a document
const filterFields = (doc, select) => {
  if (!select) return doc;
  const docObj = doc.toObject ? doc.toObject() : { ...doc };

  if (typeof select === 'string') {
    const fields = select.trim().split(/\s+/);
    const isExclusion = fields.some(f => f.startsWith('-'));

    if (isExclusion) {
      const excluded = fields.filter(f => f.startsWith('-')).map(f => f.slice(1));
      for (const field of excluded) {
        delete docObj[field];
      }
      return docObj;
    } else {
      const result = { _id: docObj._id };
      for (const field of fields) {
        if (docObj[field] !== undefined) {
          result[field] = docObj[field];
        }
      }
      return result;
    }
  }

  return docObj;
};

// In-Memory Collection Class
export class MockCollection {
  constructor(name, initialData = [], store = null) {
    this.name = name;
    this.store = store;
    this.items = initialData.map(d => new MockDocument(d, name, store));
  }

  find(query = {}) {
    return new MockQuery(() => {
      return this.items.filter(item => matchDoc(item, query));
    }, this.store);
  }

  findOne(query = {}) {
    return new MockQuery(() => {
      const found = this.items.find(item => matchDoc(item, query));
      return found || null;
    }, this.store);
  }

  findById(id) {
    return new MockQuery(() => {
      if (!id) return null;
      const idStr = id._id ? id._id.toString() : id.toString();
      const found = this.items.find(item => item._id.toString() === idStr);
      return found || null;
    }, this.store);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    if (!id) return null;
    const idStr = id._id ? id._id.toString() : id.toString();
    let doc = this.items.find(item => item._id.toString() === idStr);
    
    if (!doc) {
      if (options.upsert) {
        const newDocData = { _id: idStr, ...(update.$set || update) };
        doc = new MockDocument(newDocData, this.name, this.store);
        this.items.push(doc);
        return doc;
      }
      return null;
    }

    if (update.$set) {
      for (const [k, v] of Object.entries(update.$set)) {
        setNestedValue(doc, k, v);
      }
    }
    if (update.$push) {
      for (const [k, v] of Object.entries(update.$push)) {
        const curr = getNestedValue(doc, k) || [];
        if (Array.isArray(curr)) {
          curr.push(v);
          setNestedValue(doc, k, curr);
        }
      }
    }
    if (update.$inc) {
      for (const [k, v] of Object.entries(update.$inc)) {
        const curr = getNestedValue(doc, k) || 0;
        setNestedValue(doc, k, curr + v);
      }
    }

    // Direct field updates
    for (const [k, v] of Object.entries(update)) {
      if (!k.startsWith('$')) {
        setNestedValue(doc, k, v);
      }
    }

    doc.updatedAt = new Date();
    return doc;
  }

  async findByIdAndDelete(id) {
    if (!id) return null;
    const idStr = id._id ? id._id.toString() : id.toString();
    const idx = this.items.findIndex(item => item._id.toString() === idStr);
    if (idx !== -1) {
      const [deleted] = this.items.splice(idx, 1);
      return deleted;
    }
    return null;
  }

  async create(data) {
    if (Array.isArray(data)) {
      return this.insertMany(data);
    }
    const doc = new MockDocument(data, this.name, this.store);
    this.items.push(doc);
    return doc;
  }

  async insertMany(items) {
    const docs = items.map(d => new MockDocument(d, this.name, this.store));
    this.items.push(...docs);
    return docs;
  }

  async countDocuments(query = {}) {
    if (!query || Object.keys(query).length === 0) {
      return this.items.length;
    }
    return this.items.filter(item => matchDoc(item, query)).length;
  }
}

// Master Mock Store
class MockStore {
  constructor() {
    this.initDefaultData();
  }

  initDefaultData() {
    // 1. Diagnostic Catalog Tests
    const initialTests = [
      {
        _id: '64a000000000000000000001',
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
        _id: '64a000000000000000000002',
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
        _id: '64a000000000000000000003',
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
        _id: '64a000000000000000000004',
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
        _id: '64a000000000000000000005',
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
        _id: '64a000000000000000000006',
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
        _id: '64a000000000000000000007',
        name: 'Liver Function Test (LFT)',
        category: 'Liver',
        price: 600,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: '8 hours fasting recommended',
        turnaroundTime: '8 hours',
        description: 'Comprehensive liver enzyme and protein panel: Bilirubin, SGOT/AST, SGPT/ALT, Alkaline Phosphatase, Total Protein, and Albumin.',
        isActive: true
      },
      {
        _id: '64a000000000000000000008',
        name: 'Kidney / Renal Function Test (KFT / RFT)',
        category: 'Liver',
        price: 600,
        sampleType: 'Serum Separator Tube (Yellow SST)',
        fastingRequirement: 'No fasting required',
        turnaroundTime: '8 hours',
        description: 'Renal clearance panel: Blood Urea Nitrogen (BUN), Serum Creatinine, Uric Acid, and Electrolytes.',
        isActive: true
      },
      {
        _id: '64a000000000000000000009',
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
        _id: '64a000000000000000000010',
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
        _id: '64a000000000000000000011',
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

    // 2. Demo MLT Phlebotomists
    const initialMlts = [
      {
        _id: '64b000000000000000000001',
        name: 'Rajesh Kumar',
        phone: '1112223334',
        email: 'mlt_rajesh@harsha.com',
        isVerified: true,
        isOnline: true,
        rating: 4.9,
        ratingsCount: 142,
        earnings: 4500,
        photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
        location: { type: 'Point', coordinates: [77.6006, 14.6819] },
        liveLocation: { lat: 14.6819, lng: 77.6006, updatedAt: new Date() }
      },
      {
        _id: '64b000000000000000000002',
        name: 'Anita Rao',
        phone: '8765432109',
        email: 'anita.mlt@gmail.com',
        isVerified: true,
        isOnline: true,
        rating: 4.8,
        ratingsCount: 98,
        earnings: 3200,
        photoUrl: 'https://images.unsplash.com/photo-1594824813593-3d07e60b2401?w=150',
        location: { type: 'Point', coordinates: [77.6050, 14.6850] },
        liveLocation: { lat: 14.6850, lng: 77.6050, updatedAt: new Date() }
      },
      {
        _id: '64b000000000000000000003',
        name: 'Suresh Babu',
        phone: '9876543211',
        email: 'suresh.mlt@gmail.com',
        isVerified: true,
        isOnline: true,
        rating: 4.7,
        ratingsCount: 65,
        earnings: 2800,
        location: { type: 'Point', coordinates: [77.5980, 14.6790] }
      },
      {
        _id: '64b000000000000000000004',
        name: 'Anitha Reddy',
        phone: '9876543212',
        email: 'anitha.mlt@gmail.com',
        isVerified: true,
        isOnline: true,
        rating: 5.0,
        ratingsCount: 110,
        earnings: 5100,
        location: { type: 'Point', coordinates: [77.6100, 14.6900] }
      }
    ];

    // 3. Demo Users / Customers
    const initialUsers = [
      {
        _id: '64c000000000000000000001',
        name: 'Rahul Sharma',
        firstName: 'Rahul',
        lastName: 'Sharma',
        phone: '9876543210',
        email: 'rahul.patient@gmail.com',
        age: 32,
        gender: 'Male',
        bloodGroup: 'O+',
        addresses: [
          {
            name: 'Home',
            addressLine: 'Flat 302, Sri Krishna Nilayam, Court Road, Anantapur',
            coordinates: { lat: 14.6819, lng: 77.6006 }
          }
        ],
        familyMembers: [
          { name: 'Sunita Sharma', age: 29, gender: 'Female', relation: 'Spouse' },
          { name: 'Aarav Sharma', age: 5, gender: 'Male', relation: 'Child' }
        ]
      },
      {
        _id: '64c000000000000000000002',
        name: 'Priya Verma',
        firstName: 'Priya',
        lastName: 'Verma',
        phone: '1234567890',
        email: 'priya.verma@gmail.com',
        age: 28,
        gender: 'Female',
        bloodGroup: 'B+',
        addresses: [
          {
            name: 'Home',
            addressLine: 'House 45, Subash Nagar, Near RTC Bus Stand, Anantapur',
            coordinates: { lat: 14.6830, lng: 77.6020 }
          }
        ],
        familyMembers: []
      }
    ];

    // 4. Default Service Zone
    const initialZones = [
      {
        _id: '64d000000000000000000001',
        name: 'Anantapur City Diagnostic Hub',
        centerCoordinates: { lat: 14.6819, lng: 77.6006 },
        radiusKm: 5.0,
        freeRadiusKm: 3.0,
        extraChargeAmount: 20.0,
        isActive: true
      }
    ];

    // 5. Default Chatbot FAQs
    const initialFaqs = [
      {
        _id: '64e000000000000000000001',
        question_en: 'How do I prepare for fasting blood tests?',
        question_te: 'ఉపవాస రక్త పరీక్షలకు ఎలా సిద్ధం కావాలి?',
        answer_en: 'Drink plain water only for 8-12 hours prior to sample collection. Avoid tea, coffee, breakfast, or smoking.',
        answer_te: 'నమూనా సేకరించడానికి 8-12 గంటల ముందు కేవలం మంచినీరు మాత్రమే తాగండి. టీ, కాఫీ, అల్పాహారం లేదా ధూమపానం నివారించండి.',
        category: 'Preparation',
        order: 1,
        isActive: true
      },
      {
        _id: '64e000000000000000000002',
        question_en: 'When will I receive my digital reports?',
        question_te: 'నా డిజిటల్ నివేదికలు ఎప్పుడు అందుతాయి?',
        answer_en: 'Routine tests (Sugar, CBP) are delivered in 4-6 hours. Specialized profiles (Vitamins, HbA1c) are delivered within 12 hours via WhatsApp, SMS, and this app.',
        answer_te: 'సాధారణ పరీక్షలు 4-6 గంటల్లో అందుతాయి. ప్రత్యేక పరీక్షల నివేదికలు 12 గంటల్లోపు వాట్సాప్, SMS మరియు ఈ యాప్‌లో డౌన్‌లోడ్ చేసుకోవచ్చు.',
        category: 'Reports',
        order: 2,
        isActive: true
      }
    ];

    // 6. Default Partners
    const initialPartners = [
      {
        _id: '64f000000000000000000001',
        name: 'Harsha Express Rider 1',
        email: 'rider1@harsha.com',
        phone: '9000111222',
        location: { type: 'Point', coordinates: [77.6006, 14.6819] },
        isOnline: true,
        earnings: 1200
      }
    ];

    this.tests = new MockCollection('tests', initialTests, this);
    this.mlts = new MockCollection('mlts', initialMlts, this);
    this.users = new MockCollection('users', initialUsers, this);
    this.orders = new MockCollection('orders', [], this);
    this.serviceZones = new MockCollection('serviceZones', initialZones, this);
    this.chatbotFaqs = new MockCollection('chatbotFaqs', initialFaqs, this);
    this.partners = new MockCollection('partners', initialPartners, this);
    this.certificates = new MockCollection('certificates', [], this);
    this.delayEvents = new MockCollection('delayEvents', [], this);
  }

  saveDoc(collectionName, doc) {
    if (this[collectionName]) {
      const idx = this[collectionName].items.findIndex(i => i._id.toString() === doc._id.toString());
      if (idx !== -1) {
        this[collectionName].items[idx] = doc;
      } else {
        this[collectionName].items.push(doc);
      }
    }
  }
}

export const mockStore = new MockStore();
