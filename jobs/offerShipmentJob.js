const axios            = require('axios');
const { CronJob }      = require('cron');
const { getProximity } = require('../methods/get-proximity.js');

let currentShipment = {};
let shipmentId = 0;
let driversList;
let driverIdList;
//console.log('Driver ID List: ' + driverIdList);
let numDrivers;
//console.log('Number of drivers: ' + numDrivers);
let driverDistances = new Array(numDrivers);
let numDenies = 0;

/* --------------------------------------------------------------------------------- */

let sortedDriverDistances;
//console.log('Driver Distances: ' + driverDistances);
//console.log('Sorted Driver Drivers: ' + sortedDriverDistances);

let currentDriver = 0; // testing
//console.log('Current Driver Distance: ' + sortedDriverDistances[currentDriver]);
let driverId;
//console.log(driverId);

/* --------------------------------------------------------------------------------- */

const onComplete = () => {
    console.log('Completed shipment');
}

const onTick = () => {
    axios({
        method: 'post',
        url: `http://challenge.shipwithbolt.com/driver/${driverId}/dispatch`,
        data: {
            "shipmentId": Number(shipmentId),
        }
    }).then(res => {
        console.log(`Package ${res.data.shipmentId} was ${res.data.response} by driver ${res.data.driverId}.`);
        if (res.data.response === 'Accepted') {
            offerShipmentJob.stop(); // stop when accepted
        }
        else if (res.data.response === 'Denied') {
            driverId = driverDistances.indexOf(sortedDriverDistances[++currentDriver]) + 1;
            numDenies++;
        }
    }).catch(error => { // error handling
        console.log(error.response.status + ' ' + error.response.statusText);
        console.log(error.response.data.message);
        if (error.response.status === 400) {
            console.log('Shipment ID used: ' + shipmentId);
        }
        else if (error.response.status === 404) {
            console.log('Driver ID used: ' + driverId);
        }
    });

    if (numDenies >= numDrivers) {
        console.log('Driver not found. Please try again.');
        offerShipmentJob.stop(); // stop when all drivers have denied... too hacky?
    }
}

const offerShipmentJob = new CronJob({
    cronTime: '*/10 * * * * *', // every 10 seconds
    onComplete,
    onTick,
    start: false,
    timeZone: 'America/Los_Angeles',
});

const offerShipment = (shipment, drivers, shipmentIdentification) => {
    currentShipment = shipment;
    driversList = drivers;
    driverIdList = Object.keys(driversList);
    shipmentId = shipmentIdentification;
    numDrivers = driverIdList.length;

    for (let i = 0; i < numDrivers; i++) {
        driverDistances[i] = getProximity(currentShipment, driversList[i + 1]);
    }

    sortedDriverDistances = [...driverDistances];
    sortedDriverDistances.sort((a, b) => (a - b));

    driverId = driverDistances.indexOf(sortedDriverDistances[currentDriver]) + 1;

    offerShipmentJob.start();
}

// offerShipmentJob.start(); // testing

module.exports = {
    offerShipment: offerShipment,
}