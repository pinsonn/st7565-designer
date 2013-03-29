#ST7565 Graphical LCD Designer#

st7565-designer is a HTML5 web application for designing bitmaps and fonts for the st7565 graphical lcd. 
Encoded bitmaps and fonts work well with Adafruit's ST7565 arduino library. This web application was written
for my own use and was designed to run locally on my own computer. I tested it with recent releases of
Firefox, Safari, and Chrome. I did not test it in IE, nor do I intend to do so. 

##Legalese:

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.

##Usage:

- Draw a line between the last pixel and the current pixel by holding down the shift key.
- Undo with ctrl-z or command-z. No redo yet.
- Save and restore bitmaps/fonts from local storage
- Export/Import all saved items to/from a JSON file
- Drag and drop an image on the canvas (with canvas dimensions set to 128x64) to write a dithered approximation of the image to the display
- Current quantization/dithering techniques available: Floyd-Steinberg, Atkinson, and Sierra Lite (Sierra-2-4A), and Threshold

##Known issues:

- Chrome does not allow file access from local files by default, which is neceassary for this app to work properly. 
If run locally (i.e. not through a hostor local server), start chrome with the '--allow-file-access-from-files' flag 
or run 'python -m SimpleHTTPServer' in the directory you've saved the repo in

- Current version of Safari (5.1.7 at time of testing in May 2012) doesn't support the FileReader object. Attempting to 
load saved bitmaps/fonts from a json file won't work as a result. Webkit nightlies do support FileReader, suggesting 
Safari may well do so as well in a future release. Webkit nightlies available from http://nightly.webkit.org/

- No anomalies noted in Firefox

- Some dithering methods result in stray pixels. Currently investigating why. 

##Node-webkit:

- Behaves more like a true "native" application with file save dialogs and access to the system clipboard. 

##Revision History:
**3/28/13**- Added node-webkit implementation. 
**12/15/12**- Threshold quantization for dropped images added to dithering routines. 
**11/27/12**- Support for one-bit image dithering added. Drop an image onto the display canvas and behold the wonders!
**6/28/12**- Initial commit. 
