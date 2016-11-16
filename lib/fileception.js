var resolveNext;
var promise;
afterEach(function () {
    if (resolveNext) {
        resolveNext();
        resolveNext = undefined;
        return promise;
    }
});

var expect = require('unexpected').clone().use(require('unexpected-fs'));

// Disable the footgun protection of our Unexpected clone:
expect.notifyPendingPromise = function () {};

module.exports = function fileception(mockDefinition) {
    promise = expect(function () {
        return expect.promise(function (resolve, reject) {
            resolveNext = resolve;
        });
    }, 'with fs mocked out', mockDefinition, 'not to error');
};
