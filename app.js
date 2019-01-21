// data
const drivers = require('./data/drivers.json');
const shipments = require('./data/shipments.json');

// client
const DispatchClient = require('./client/dispatchClient.js');

// client instance
let dispatchClient = new DispatchClient(shipments, drivers);
