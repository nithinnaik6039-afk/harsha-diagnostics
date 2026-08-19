import mongoose from 'mongoose';
import { mockStore, MockDocument } from '../config/mockStore.js';

export const isDBConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

export const createSmartModel = (modelName, mongooseModel, mockCollectionName) => {
  function SmartModel(data = {}) {
    if (isDBConnected()) {
      return new mongooseModel(data);
    }
    return new MockDocument(data, mockCollectionName, mockStore);
  }

  // Model static methods
  SmartModel.find = function (query = {}) {
    if (isDBConnected()) {
      return mongooseModel.find(query);
    }
    return mockStore[mockCollectionName].find(query);
  };

  SmartModel.findOne = function (query = {}) {
    if (isDBConnected()) {
      return mongooseModel.findOne(query);
    }
    return mockStore[mockCollectionName].findOne(query);
  };

  SmartModel.findById = function (id) {
    if (isDBConnected()) {
      return mongooseModel.findById(id);
    }
    return mockStore[mockCollectionName].findById(id);
  };

  SmartModel.findByIdAndUpdate = function (id, update, options = {}) {
    if (isDBConnected()) {
      return mongooseModel.findByIdAndUpdate(id, update, options);
    }
    return mockStore[mockCollectionName].findByIdAndUpdate(id, update, options);
  };

  SmartModel.findByIdAndDelete = function (id) {
    if (isDBConnected()) {
      return mongooseModel.findByIdAndDelete(id);
    }
    return mockStore[mockCollectionName].findByIdAndDelete(id);
  };

  SmartModel.create = function (data) {
    if (isDBConnected()) {
      return mongooseModel.create(data);
    }
    return mockStore[mockCollectionName].create(data);
  };

  SmartModel.insertMany = function (items) {
    if (isDBConnected()) {
      return mongooseModel.insertMany(items);
    }
    return mockStore[mockCollectionName].insertMany(items);
  };

  SmartModel.countDocuments = function (query = {}) {
    if (isDBConnected()) {
      return mongooseModel.countDocuments(query);
    }
    return mockStore[mockCollectionName].countDocuments(query);
  };

  // Provide access to underlying mongoose model if needed
  SmartModel.mongooseModel = mongooseModel;
  SmartModel.modelName = modelName;

  return SmartModel;
};
