'use strict';

const mockfs = require('mock-fs');
const MountFs = require('mountfs');
const fs = require('fs');
const _ = require('lodash');

let unmockAfterCurrentTest;
let afterEachRegistered = false;

if (typeof afterEach === 'function') {
    afterEach(function () {
        if (unmockAfterCurrentTest) {
            unmockAfterCurrentTest();
            unmockAfterCurrentTest = undefined;
        }
    });
    afterEachRegistered = true;
}

function walkOptions(options) {
    if (typeof options === 'object') {
        Object.keys(options).forEach(function (key) {
            if (options[key] === null) {
                return;
            }

            if (options[key]._isFile) {
                delete options[key]._isFile;
                options[key] = mockfs.file(options[key]);
            } else if (options[key]._isSymlink) {
                delete options[key]._isSymlink;
                options[key] = mockfs.symlink(options[key]);
            } else if (options[key]._isDirectory) {
                delete options[key]._isDirectory;
                if (options[key].items && typeof options[key].items === 'object') {
                    options[key].items = walkOptions(options[key].items);
                }
                options[key] = mockfs.directory(options[key]);
            } else if (typeof options[key] === 'object') {
                options[key] = walkOptions(options[key]);
            }
        });
    }
    return options;
}

function rewriteMockFsOptions(input) {
    const options = _.cloneDeep(input, function dealWithBuffers(val) {
        if (val instanceof Buffer) {
            return val.slice();
        }
    });

    Object.keys(options).forEach(function (key) {
        if (!(/^\//.test(key))) {
            options['/' + key] = options[key];
            delete options[key];
        }
    });

    return walkOptions(options);
}

function mockOutFs(mocks) {
    const mockFileSystems = Object.keys(mocks).map(function (key) {
        const mockFsConfig = rewriteMockFsOptions(mocks[key]);
        return {
            mountPath: /\/$/.test(key) ? key : key + '/',
            fileSystem: mockfs.fs(mockFsConfig, {
                createCwd: false,
                createTmp: false
            })
        };
    });

    MountFs.patchInPlace();

    mockFileSystems.forEach(function (mockFileSystem) {
        fs.mount(mockFileSystem.mountPath, mockFileSystem.fileSystem);
    });

    return function unmock() {
        mockFileSystems.forEach(function (mockFs) {
            fs.unmount(mockFs.mountPath);
        });
        fs.unpatch();
    };
}

module.exports = function fileception(mockDefinition, promiseFactory) {
    if (typeof mockDefinition === 'function') {
        promiseFactory = mockDefinition;
        mockDefinition = undefined;
    }
    mockDefinition = mockDefinition || {};

    let unmock = mockOutFs(mockDefinition);

    if (typeof promiseFactory === 'function') {
        let returnValue;
        try {
            returnValue = promiseFactory();
        } catch (e) {
            unmock();
            throw e;
        }
        if (returnValue && typeof returnValue.then === 'function') {
            return returnValue.then(value => {
                unmock();
                return value;
            }, err => {
                unmock();
                throw err;
            });
        } else {
            unmock();
            return Promise.resolve();
        }
    } else if (afterEachRegistered) {
        unmockAfterCurrentTest = unmock;
    } else {
        throw new Error('fileception: No afterEach global found, cannot unmock automatically. Please use: fileception(mocks, () => ...)');
    }
};
