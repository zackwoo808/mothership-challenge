const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const DispatchClient = require('../../client/dispatchClient.js');

describe('Dispatch Client', function() {
    context('Constructor Arguments', function() {
        it('should fail if either shipments or drivers is not an object', function() {
            const drivers = 1;
            const shipments = {"firstKey": "not empty"};

            const dc = new DispatchClient(shipments, drivers, {"runOnInit": false});

            (typeof dc.shipments === 'object' &&
             typeof dc.drivers === 'object')
                .should.be.false;
        });

        it('should pass if shipments and drivers are objects', function () {
            const drivers = {};
            const shipments = {"firstKey": "not empty"};

            const dc = new DispatchClient(shipments, drivers, {"runOnInit": false});

            (typeof dc.shipments === 'object' &&
             typeof dc.drivers === 'object')
                .should.be.true;
        });       
    });
});