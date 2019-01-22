const DistanceCalculations = require('../../methods/distanceCalculations.js');

describe('Simple Calculations', function() {
    context('degreesToRadians', function() {
        it('should pass if correct calculation made', function() {
            const dc = new DistanceCalculations();
            let rad = dc.degreesToRadians(180);

            rad.should.equal(Math.PI);
        });
    });
});