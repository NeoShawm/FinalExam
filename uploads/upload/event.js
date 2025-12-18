  'use strict';

  function gotKey (event) {
      
      var key = event.key;
      
       if (key === 'x') {
        camAngle -= 5;
    }
    else if (key === 'X') {
        camAngle += 5;
    }
    else if (key === 'y') {
        camHeight -= 1;
    }
    else if (key === 'Y') {
        camHeight += 1;
    }
      
      draw();
  }
  
