module.exports = function sanitizeText (text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
};
