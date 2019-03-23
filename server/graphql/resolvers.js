const { findStyleModels } = require('../models/style')
const events = require('../events')
const { pubsub } = require('./pubsub')

module.exports = {
  Event: {
    __resolveType: event => {
      switch (event.name) {
        case events.UPLOAD_SUCCEEDED:
          return 'UploadSucceededEvent'
        case undefined:
          throw new Error(`event name is missing: JSON.stringify(data)`)
        default:
          return 'GenericEvent'
      }
    }
  },
  Query: {
    styleModels: async (root, variables, context) => {
      return findStyleModels()
    }
  },
  Subscription: {
    styleTransferEvent: {
      subscribe: () => pubsub.asyncIterator('styleTransferEvent')
    }
  }
}
