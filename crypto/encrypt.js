const crypto = require("crypto");

module.exports.encryptWithPublicKey = (publicKey, message) => {
    const bufferMessage = Buffer.from(message, "utf8");
    return crypto.publicEncrypt(publicKey, bufferMessage);
};

module.exports.encryptWithPrivateKey = (privateKey, message) => {
    const bufferMessage = Buffer.from(message, "utf8");
    return crypto.privateEncrypt(privateKey, bufferMessage);
};
