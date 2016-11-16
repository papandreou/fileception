fileception
===========

Mock out the FS module during a test, experimentally extracted from
[unexpected-fs](https://github.com/unexpectedjs/unexpected-fs/):

```js
var fileception = require('fileception');
var assert = require('assert');
var fs = require('fs');

it('should read the contents of a file', function () {
    fileception({
        '/foo': {
            'bar.txt': 'quux'
        }
    });

    assert.equal(fs.readFileSync('/foo/bar.txt', 'utf-8'), 'quux');
});
```

When the test is done, the fs module will automatically be restored.
