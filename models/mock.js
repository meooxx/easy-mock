'use strict'

const mongoose = require('mongoose')

const Schema = mongoose.Schema

const schema = new Schema({
  project: {
    type: Schema.Types.ObjectId,
    ref: 'Project'
  },
  description: String,
  mode: String,
  url: String,
  method: String,
  parameters: String,
  response_model: String,
  tag: {
    type: String
  },
  create_at: {
    type: Date,
    default: Date.now
  }
})

schema.index({ project: 1, url: 1 }, { unique: true })

module.exports = mongoose.model('Mock', schema)
