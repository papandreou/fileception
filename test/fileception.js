const fileception = require('../lib/fileception');
const expect = require('unexpected');
const fs = require('fs');

describe('fileception', () => {
    describe('when passed a function', () => {
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
});
