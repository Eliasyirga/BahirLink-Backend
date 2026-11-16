// Lazily loaded by controllers/verifyController.js
const Tesseract = require("tesseract.js");

const ocrExtract = async (filePath) => {
  const { data } = await Tesseract.recognize(filePath, "eng");
  return data.text;
};

const parseIdFields = (text) => {
  const cleaned = text.replace(/\s+/g, " ").trim();

  const idNumber = cleaned.match(/\b\d{6,}\b/);
  const dob = cleaned.match(/(\d{2}[\/.-]\d{2}[\/.-]\d{4})/);

  return {
    raw: cleaned,
    idNumber: idNumber ? idNumber[0] : null,
    dob: dob ? dob[0] : null,
  };
};

module.exports = { ocrExtract, parseIdFields };
