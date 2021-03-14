# pUZI.js

Javascript version of the pUZI library for Node.js

Work in progress.

## Requirements
Forge, with some changes:

Add the following lines to `node_modules/node-forge/lib/oids.js`:

```
_IN('2.5.4.4',  'surname');
_IN('2.5.4.12', 'title');
_IN('2.5.4.42', 'givenName');
```
