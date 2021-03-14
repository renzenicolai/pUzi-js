"use strict";

const forge = require("node-forge");
const pki = forge.pki;

class UziPassUser {
    /*
     * UziPassUser object contains the following keys:
     *
     * givenName: givenName,
     * surName: surName,
     * OidCa: OID CA,
     * UziVersion: UZI Version,
     * UziNumber: UZI Number,
     * CardType: Card Type,
     * SubscriberNumber: Subscriber number,
     * Role: Role (reference page 89),
     * AgbCode: ABG Code,
     *
     * For reference please read
     * https://www.zorgcsp.nl/documents/RK1%20CPS%20UZI-register%20V10.2%20ENG.pdf
     */
    
    OID_IA5STRING = "2.5.5.5"  // see https://oidref.com/2.5.5.5
    
    constructor(verify="failed", cert=null) {
        /*
         * Sets up an UziPassUser object
         *
         * Expects the following vars from the webserver env
         * -  SSL_CLIENT_VERIFY
         * -  SSL_CLIENT_CERT
         */
        if (verify !== "SUCCESS") {
            throw new UziExceptionServerConfigError(
                "Webserver client cert check not passed"
            );
        }

        if ((typeof cert !== "string") && (!(cert instanceof Buffer))) {
            throw new UziExceptionClientCertError(
                 "No client certificate presented"
            );
        }
        
        this.cert = pki.certificateFromPem(cert.toString("ascii"));
        this._update(this._getData());
    }
    
    _update(data) {
        for (key in data) {
            this[key] = data[key];
        }
    }
    
    _getName(rdnSequence) {
        // Finds and returns the surName, and givenName
        let givenName = rdnSequence.getField("givenName");
        let surName = rdnSequence.getField("surname");
        if (givenName && surName) {
            return {givenName: givenName.value, surName: surName.value};
        }
        throw new UziException("No surname / givenName found");
    }
    
    _getData() {
        // Attemps to parse the presented certificate and extract the user info from it
        if (!this.cert.subject) {
            throw new UziException("No subject rdnSequence");
        }

        const {givenName, surName} = this._getName(this.cert.subject);

        let extension = null;
        for (extensionKey in this.cert.extensions) {
            let currExtension = this.cert.extensions[extensionKey];
            if (extension.oid._name === "subjectAltName") {
                extension = currExtension;
                break;
            }
        }

        for (key in extension.value) {
            value = extension.value[key]
                if ((type(value) !== x509.general_name.OtherName) ||
                    (value.type_id.dotted_string !== this.OID_IA5STRING)) {
                    continue;
                }

                subjectAltName = value.value.decode("ascii")

                /* Reference page 60
                 * 
                 * [0] OID CA
                 * [1] UZI Version
                 * [2] UZI number
                 * [3] Card type
                 * [4] Subscriber number
                 * [5] Role (reference page 89)
                 * [6] AGB code
                 */

                data = subjectAltName.split("-");
                if (data.length < 6) {
                    throw new UziException("Incorrect SAN found");
                }
                data[0] = data[0].split("?", 1)[1]

                return {
                    "givenName": givenName,
                    "surName": surName,
                    "OidCa": data[0],
                    "UziVersion": data[1],
                    "UziNumber": data[2],
                    "CardType": data[3],
                    "SubscriberNumber": data[4],
                    "Role": data[5],
                    "AgbCode": data[6],
                }
        }
        throw new UziException("No valid UZI data found");
    }
}

class UziException extends Error {
    // Base Exception for all Uzi Exceptions
}


class UziExceptionServerConfigError extends UziException {
    // Your webserver Did not pass the correct env
}


class UziExceptionClientCertError extends UziException {
    // The client did not present a certificate
}

module.exports = {
    UziPassUser: UziPassUser,
    UziException: UziException,
    UziExceptionServerConfigError: UziExceptionServerConfigError,
    UziExceptionClientCertError: UziExceptionClientCertError
};
