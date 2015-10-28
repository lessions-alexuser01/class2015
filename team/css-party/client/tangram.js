var Please = require('pleasejs');

module.exports = function () {
  var baseColor = Please.make_color();
  var colors = Please.make_color({
    base_color: baseColor[0],
    colors_returned: 100
  });

  var baseX = Math.floor(Math.random() * 1000) + 250;
  var baseY = Math.floor(Math.random() * 1000) + 250;

  return [
    {
      "text": "",
      "style": "border-width:75px;border-style:solid;border-color:transparent transparent " + colors[0] + " " + colors[0] + ";left:" + baseX + "px;top:" + (baseY+26) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform:rotate(-135deg)"
    },
    {
      "text": "",
      "style": "border-width: 75px;border-style:solid;border-color:transparent transparent " + colors[1] + " " + colors[1] + ";left: " + (baseX+107) + "px;top:" + (baseY-80) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform: rotate(-45deg);"
    },
    {
      "text": "",
      "style": "border-width:50px;border-style:solid;border-color:transparent transparent " + colors[2] + " " + colors[2] + ";left: " + (baseX+187) + "px;top: " + (baseY+103) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform: rotate(-90deg);"
    },
    {
      "text": "",
      "style": "border-width: 35px;border-style:solid;border-color:transparent transparent " + colors[3] + " " + colors[3] + ";left: " + (baseX+253) + "px;top: " + (baseY+11) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform: rotate(45deg);"
    },
    {
      "text": "",
      "style": "border-width: 35px;border-style:solid;border-color:transparent transparent " + colors[4] + " " + colors[4] + ";left: " + (baseX+152) + "px;top: " + (baseY+112) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform:rotate(135deg)"
    },
    {
      "text": "",
      "style": "width: 70px;height: 70px;left: " + (baseX+203) + "px;top: " + (baseY+63) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform:rotate(45deg);background:" + colors[5] + ""
    },
    {
      "text": "",
      "style": "width: 100px;height: 57px;left: " + (baseX+110) + "px;top: " + (baseY+148) + "px;position:absolute;overflow:hidden;max-height:300px;max-width:300px;transform:skew(-45deg, 0deg);background:" + colors[6] + ""
    },
    null,
    null,
    null
  ];
};
