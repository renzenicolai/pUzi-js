# pUZI.js

Proficient UZI pass reader for Node.js

The pUZI library is also available for [PHP](https://github.com/minvws/pUzi-php) and [Python](https://github.com/minvws/pUzi-python).

The UZI card is part of an authentication mechanism for medical staff and doctors working in the Netherlands. The cards are distributed by the CIBG. More information and the relevant client software can be found at www.uziregister.nl (in Dutch).

pUZI is a simple and functional module which allows you to use the UZI cards as authentication mechanism. It consists of:

1. a reader that reads the data on the card and gives an UziUser object in return (this repository).

pUZI is available under the EU PL licence. It was created early 2021 during the COVID19 campaign as part of the vaccination registration project BRBA for the ‘Ministerie van Volksgezondheid, Welzijn & Sport, programma Realisatie Digitale Ondersteuning.’

Questions and contributions are welcome via [GitHub](https://github.com/minvws/pUzi-js/issues).

## Requirements

* [Forge](https://github.com/digitalbazaar/forge): node-forge v0.10.0

## Development requirements

These libraries are only needed to provide a framework for running the unittests.

* [Mocha](https://mochajs.org/)
* [Chai](https://www.chaijs.com/)
