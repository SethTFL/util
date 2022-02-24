//cut/stretch settings for inImage if you want it to fill inCanvas
function Clip(inCanvas, inImage)
{
  var ratioCanvas = inCanvas.width/inCanvas.height;
  var ratioImage = inImage.width/inImage.height;
  var output = {};
  if(ratioCanvas > ratioImage)
  {
    output.Width = inImage.width;
    output.Height = inImage.width/ratioCanvas;
    output.X = 0
    output.Y = (inImage.height - output.Height)/2;
  }
  else
  {
    output.Height = inImage.height;
    output.Width = inImage.height*ratioCanvas;
    output.Y = 0
    output.X = (inImage.width - output.Width)/2;
  }
  return output;
}
// limit the inClip settings to not go bigger than inImage
function Limit(inClip, inImage)
{
  var adjustW, adjustH;
  if(inClip.Width > inImage.width)
  {
    adjustW = inClip.Width - inImage.width;
    adjustH = inClip.Height - inImage.height;

    inClip.Width -= adjustW;
    inClip.Height -= adjustH;
    inClip.X += adjustW/2;
    inClip.Y += adjustH/2;
  }
  return inClip;
}
function Align(inClip, inCanvas, inX, inY)
{
  var spanX, spanY;
  spanX = inCanvas.width - inClip.Width;
  spanY = inCanvas.height - inClip.Height;
  inClip.X = spanX*inX;
  inClip.Y = spanY*inY;
  return inClip;
}
function Download(inCanvas)
{
  var link;
  link = document.createElement('a');
  link.download = "picture_.png";
  link.href = inCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
  link.click();
}
function Draw(inWidth, inHeight, inX, inY, inForeground, inBackground, inCanvas)
{
  var context;

  console.log(inX, inY);
  
  context = inCanvas.getContext("2d");
  inCanvas.width = inWidth;
  inCanvas.height = inHeight;

  clip = Clip(inCanvas, inBackground);
  context.drawImage(
    inBackground,
    clip.X, clip.Y, clip.Width, clip.Height,
    0, 0, inCanvas.width, inCanvas.height
  );

  clip = Clip(inForeground, inCanvas);
  clip = Limit(clip, inForeground);
  clip = Align(clip, inCanvas, inX, inY);
  context.drawImage(
    inForeground,
    clip.X, clip.Y, clip.Width, clip.Height
  );
}

/********************************************************/
var background, foreground, canvas, align;

//create elements
    canvas = document.querySelector(".Output");
background = document.querySelector(".Input.Background");
foreground = document.querySelector(".Input.Foreground");
     align = document.querySelector(".Align");

//load images
window.onload = function()
{
  var x, y;
  var width, height;
  x = parseFloat(align.getAttribute("data-x"));
  y = parseFloat(align.getAttribute("data-y"));
  
  document.querySelector(".Download").addEventListener("click", function(inEvent)
  {
    Download(canvas);
  });
  document.querySelector("select").addEventListener("change", function(inEvent)
  {
    var parts;
    parts = inEvent.target.value.split(" x ");
    if(parts.length == 2)
    {
      Draw(parseInt(parts[0]), parseInt(parts[1]), x, y, foreground, background, canvas);
    }
    else
    {
      Draw(screen.width, screen.height, x, y, foreground, background, canvas);
    }
  });
  Draw(screen.width, screen.height, x, y, foreground, background, canvas);
};