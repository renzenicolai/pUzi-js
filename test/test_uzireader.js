"use strict";

const path = require("path");
const fs = require("fs");
const chai = require("chai");
const expect = chai.expect;
const uzireader = require("../uzireader.js");

const success = "SUCCESS";

function readCert(certPath) {
    certPath = path.join("test", "certs", certPath);
    return fs.readFileSync(certPath);
}

function checkCert(certPath) {
    let cert = readCert(certPath);
    return new uzireader.UziPassUser(success, cert);
}

describe('UziReader', () => {
    it("test_check_request_has_no_cert", () => {
        expect(() => {
            new uzireader.UziPassUser();
        }).to.throw(uzireader.UziExceptionServerConfigError);
    });

    it("test_check_ssl_client_failed", () => {
        expect(() => {
            new uzireader.UziPassUser();
        }).to.throw(uzireader.UziExceptionServerConfigError);
    });

    it("test_check_no_client_cert", () => {
        expect(() => {
            new uzireader.UziPassUser(success);
        }).to.throw(uzireader.UziExceptionClientCertError);
    });

    it("test_check_cert_without_valid_data", () => {
        expect(() => {
            checkCert("mock-001-no-valid-uzi-data.cert");
        }).to.throw("No valid UZI data found");
    });

    it("test_check_cert_with_invalid_san", () => {
        expect(() => {
            checkCert("mock-002-invalid-san.cert");
        }).to.throw("No valid UZI data found");
    });

    it("test_check_cert_with_invalid_other_name", () => {
        expect(() => {
            checkCert("mock-003-invalid-othername.cert");
        }).to.throw("No valid UZI data found");
    });
    
    it("test_check_cert_without_ia5_string", () => {
        expect(() => {
            checkCert("mock-004-othername-without-ia5string.cert");
        }).to.not.throw();
    });

    it("test_check_cert_incorrect_san_data", () => {
        expect(() => {
            checkCert("mock-005-incorrect-san-data.cert");
        }).to.throw("Incorrect SAN found");
    });

    it("test_check_cert_incorrect_san_data_2", () => {
        expect(() => {
            checkCert("mock-006-incorrect-san-data.cert");
        }).to.throw("Incorrect SAN found");
    });

    it("test_check_valid_cert", () => {
        let cert = readCert("mock-011-correct.cert");
        let data = new uzireader.UziPassUser(success, cert);
        expect(data.AgbCode).to.equal("00000000");
        expect(data.self.CardType).to.equal("N")
        expect(data.givenName).to.equal("john")
        expect(data.OidCa).to.equal("2.16.528.1.1003.1.3.5.5.2")
        expect(data.Role).to.equal("30.015")
        expect(data.SubscriberNumber).to.equal("90000111")
        expect(data.surName).to.equal("doe-12345678")
        expect(data.UziNumber).to.equal("12345678")
        expect(data.UziVersion).to.equal("1")
    });

    it("test_check_valid_admin_cert", () => {
        let cert = readCert("mock-012-correct-admin.cert");
        let data = new uzireader.UziPassUser(success, cert);

        expect(data.AgbCode).to.equal("00000000")
        expect(data.CardType).to.equal("N")
        expect(data.givenName).to.equal("john")
        expect(data.OidCa).to.equal("2.16.528.1.1003.1.3.5.5.2")
        expect(data.Role).to.equal("01.015")
        expect(data.SubscriberNumber).to.equal("90000111")
        expect(data.surName).to.equal("doe-11111111")
        expect(data.UziNumber).to.equal("11111111")
        expect(data.UziVersion).to.equal("1")
    });
});
