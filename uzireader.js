"use strict";

const forge = require("node-forge");
const pki = forge.pki;
const asn1 = forge.asn1;

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
    ALTNAME_OTHERNAME_TYPE = 0
    
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
        for (let key in data) {
            this[key] = data[key];
        }
    }
    
    _getName(subject) {
        // Finds and returns the surname, and givenName
        let givenName = null;
        let surname = null
        for (let key in subject.attributes) {
            let attribute = subject.attributes[key];
            if (typeof attribute.name === "string") {
                if (attribute.name === "surname") {
                    surname = attribute.value;
                } else if (attribute.name === "givenName") {
                    givenName = attribute.value;
                }
            }
            if (givenName && surname) {
                return {givenName: givenName, surname: surname};
            }
        }
        throw new UziException("No surname / givenName found");
    }
    
    _findSubjectAltName(altName) {
        if (altName.type !== this.ALTNAME_OTHERNAME_TYPE) {
            return null;
        }
        let result = null;
        for (let key in altName.value) {
            let value = altName.value[key];
            if (Array.isArray(value.value) && value.type === this.ALTNAME_OTHERNAME_TYPE) {
                result = this._findSubjectAltName(value);
                if (result) {
                    break;
                }
            } else if (typeof value.value === "string") {
                if (value.type === asn1.Type.IA5STRING) {
                    result = value.value;
                    break;
                }
            }
            
        }
        return result;
    }
    
    _getData() {
        // Attemps to parse the presented certificate and extract the user info from it
        if (!this.cert.subject) {
            throw new UziException("No subject rdnSequence");
        }

        const {givenName, surname} = this._getName(this.cert.subject);

        let extension = null;
        for (let key in this.cert.extensions) {
            if (this.cert.extensions[key].name === "subjectAltName") {
                extension = this.cert.extensions[key];
                break;
            }
        }
        
        if (extension === null) {
            throw new UziException("No valid UZI data found");
        }

        let subjectAltName = null;
        for (let key in extension.altNames) {
            let altName = extension.altNames[key];
            subjectAltName = this._findSubjectAltName(altName);
            if (subjectAltName) {
                break;
            }
        }
        
        if (subjectAltName !== null) {
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

            let data = subjectAltName.split("-");
            if (data.length < 6) {
                throw new UziException("Incorrect SAN found");
            }

            return {
                "givenName": givenName,
                "surName": surname,
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
