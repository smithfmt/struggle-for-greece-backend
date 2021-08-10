const crypto = require("crypto");

module.exports.decryptWithPrivateKey = (privateKey, encryptedMessage) => {
    return crypto.privateDecrypt(privateKey, encryptedMessage);
};

module.exports.decryptWithPublicKey = (publicKey, encryptedMessage) => {
    return crypto.publicDecrypt(publicKey, encryptedMessage);
};
