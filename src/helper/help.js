

import CryptoJS from 'crypto-js';
export const url = 'http://localhost:5025';
//export const url = process.env.REACT_APP_API_URL;

export const expireInHour = '1';

const key = CryptoJS.enc.Utf8.parse('9356545685254934');
const iv = CryptoJS.enc.Utf8.parse('4795464582156878');


export const stringIsEmpty = (value) => {
  return value === null || value === '' || value === undefined;
};

export const getValueFromString = (text, key) => {
  try {
    const parts = text.split(/[*=]/);
    const result = parts.find(part => part.startsWith(`${key}_`));
    return result ? result.split('_')[1] : null;
  } catch (error) {
    return null;
  }
};

export const encryptData = (text) => {
  var strEncrypt = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  }).toString();

  var strEncryptTmp = strEncrypt.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return strEncryptTmp;
};

export const decryptData = (ciphertext) => {

  try {
    
    var strText = ciphertext.replace(/-/g, '+').replace(/_/g, '/');

    if (strText.length % 4 === 2) {
      strText += '==';
    }
    else if (strText.length % 4 === 3) {
      strText += '=';
    }

    const bytes = CryptoJS.AES.decrypt(strText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    const strDecrypt = bytes.toString(CryptoJS.enc.Utf8);
    return strDecrypt;
  } catch (error) {
    // return ciphertext;
    return null;
  }

};

export const getLocalData = (key) => {
  return decryptData(localStorage.getItem(encryptData(key)))
}



