// data
const drivers = require('./data/drivers.json');
const shipments = require('./data/shipments.json');
const shipmentIds = Object.keys(shipments);
const numShipments = shipmentIds.length;

// jobs
const { offerShipment } = require('./jobs/offerShipmentJob.js');

// console.log(shipments[shipmentIds[0]]);
// console.log(drivers);

offerShipment(shipments[shipmentIds[0]], drivers, shipmentIds[0]);