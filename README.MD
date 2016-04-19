# face-crop
## Description
Detects face in image and crops it.

## Installation
`npm i face-crop`

## Options
- **src** : _String_ - source image absolute path
- **dst** : _Object_
  - **path** : _String_ - destination image absolute path
  - **width**? : _Number_ - destination image width ( equals **height** is not present )
  - **height**? : _Number_ - destination image height ( equals **width** is not present )
- **scale**? : _Number_ - size multiplier of the found face

## Exceptions
Promise will be rejected in case of lack of required options or if no faces found.

## Usage
```javascript
const FC = require('face-crop');
const Path = require('path');

FC({
    src: Path.resolve("./imgs/1.png"),
    dst: {
        path: Path.resolve("./out/1.png"),
        width: 200,
        height: 200
    },
    scale: 3
}).then(path => {
    //foo
}).catch(e => {
    //bar
});
```
