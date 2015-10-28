/*

  Calculate the weight of a div (size in bytes of content)

*/
module.exports = function calcWeight (div) {
  return div.style.length + div.text.length;
};
