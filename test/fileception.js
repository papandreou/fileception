const fileception = require('../lib/fileception');
const expect = require('unexpected').clone().use(require('unexpected-sinon'));
const fs = require('fs');
const pathModule = require('path');
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

        describe('that calls fileception again', () => {
            it('allows adding more mocks', () => {
                return fileception({'/foo': { 'bar.txt': 'quux'}}, () => {
                    return fileception({'/bar': { 'baz.txt': 'blah' }}, () => {
                        expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                        expect(fs.readFileSync('/bar/baz.txt', 'utf-8'), 'to equal', 'blah');
                    });
                });
            });

            it('allows adding more mocks', () => {
                return fileception({'/foo': { 'bar.txt': 'quux'}}, () => {
                    return fileception({'/bar': { 'baz.txt': 'blah' }}, () => {
                        expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                        expect(fs.readFileSync('/bar/baz.txt', 'utf-8'), 'to equal', 'blah');
                    }).then(() => {
                        expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                        expect(() => fs.readFileSync('/bar/baz.txt'), 'to throw', /ENOENT/);
                    });
                }).then(() => {
                    expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
                    expect(() => fs.readFileSync('/bar/baz.txt'), 'to throw', /ENOENT/);
                });
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

    describe('when no function is passed', function () {
        it('adds the mocks', function () {
            fileception({'/foo': { 'bar.txt': 'quux'}});
            expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
        });

        // Adding another test here is the easiest way to check that the mocks
        // were indeed removed by fileception's afterEach block:
        it('... and removes them after the test', function () {
            expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
        });

        describe('when the fileception function is called multiple times', function () {
            it('allows adding more mocks to an already mocked out directory', function () {
                fileception({'/foo': { 'bar.txt': 'quux'}});
                fileception({'/foo': { 'baz.txt': 'blah'}});
                expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                expect(fs.readFileSync('/foo/baz.txt', 'utf-8'), 'to equal', 'blah');
            });

            it('... and removes them after the test', function () {
                expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
                expect(() => fs.readFileSync('/foo/baz.txt'), 'to throw', /ENOENT/);
            });

            it('allows adding more mocked out directories', function () {
                fileception({'/foo': { 'bar.txt': 'quux'}});
                fileception({'/bar': { 'baz.txt': 'blah'}});
                expect(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'to equal', 'quux');
                expect(fs.readFileSync('/bar/baz.txt', 'utf-8'), 'to equal', 'blah');
            });

            it('... and removes them after the test', function () {
                expect(() => fs.readFileSync('/foo/bar.txt'), 'to throw', /ENOENT/);
                expect(() => fs.readFileSync('/bar/baz.txt'), 'to throw', /ENOENT/);
            });
        });
    });

    it('should not shadow files in CWD', function () {
        fileception({'/foo': { 'bar.txt': 'quux'}});
        expect(fs.readFileSync(pathModule.resolve(__dirname, '..', 'package.json'), 'utf-8'), 'to contain', '"version"');
    });
});
