const crypto = require("crypto");
const fs = require("fs");
const decrypt = require("./decrypt");

const dataPackage = require("./signMessage").dataPackage;

const hash = crypto.createHash(dataPackage.algorithm);

const publicKey = fs.readFileSync(__dirname + "/id_rsa_pub.pem", "utf8");

const decryptedMessage = decrypt.decryptWithPublicKey(publicKey, dataPackage.signedAndEncryptedData);

const decryptedMessageHex = decryptedMessage.toString();

const hashOfOriginal = hash.update(JSON.stringify(dataPackage.originalData));
const hashOfOriginalHex = hash.digest("hex");

if (hashOfOriginalHex === decryptedMessageHex) {
    console.log("Success! Verification Complete!");
} else {
    console.log("Failure! Data is Falsely Signed!");
};