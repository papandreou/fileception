const fileception = require('../lib/fileception');
const expect = require('unexpected').clone().use(require('unexpected-sinon'));
const fs = require('fs');
const sinon = require('sinon');

describe('fileception', () => {
    describe('when passed a function as the second parameter', () => {
        describe('that returns a promise', () => {
            it('should remove the mock after the promise has been resolved', () => {
                return fileception({'/foo': { 'bar.txt': 'quux'}}, () => {
                    return new Promise(function (resolve, reject) {
                        setTimeout(resolve, 10);
                    }).then(function () {
                        expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                    });
                }).then(() => expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/));
            });
        });

        describe('that throws synchronously', () => {
            it('should remove the mock and rethrow the error', () => {
                expect(() => {
                    fileception({'/foo': { 'bar.txt': 'quux'}}, () => {
                        throw new Error('oh no');
                    });
                }, 'to throw', new Error('oh no')).then(() => {
                    expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
                });
            });
        });

        describe('that returns nothing and does not throw', () => {
            it('should remove the mock immediately', () => {
                fileception({'/foo': { 'bar.txt': 'quux'}}, () => {});

                expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
            });
        });
    });


    describe('when passed a function as the first parameter', () => {
        it('is used as a promise factory (and no mocks are installed)', () => {
            var spy = sinon.spy();
            fileception(spy);
            expect(spy, 'was called once');
        });
    });
});
