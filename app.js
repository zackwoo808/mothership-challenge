// data
const drivers = require('./data/drivers.json');
const shipments = require('./data/shipments.json');

// client
const DispatchClient = require('./client/dispatchClient.js');

// client instance
new DispatchClient(
    shipments,
    drivers,
    {
        "runOnInit": true,
        "driversPerRun": 3,
        "runInterval": 10,
    }
);
