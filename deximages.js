/**
*    deximages.js
*
*    injected javascript for
*    DexImages Safari Extension
*    Version 1.0
*    © 2011 lucdesign
*    ++oida pumpm muass!
**/

(function() {

  // var
  // testfeld = newElement('DIV', 'testfeld', document.body ),
  // testbalken = newElement('DIV', 'testbalken', testfeld),
  // tester = 0;

  // helper
  function detectImageDir () {
    var
    htm = document.getElementsByTagName('html')[0].innerHTML,
    ttl = document.title.indexOf('Index of ') === 0,
    url = document.URL.substr(-1) === '/',
    end = document.URL.match(/\/\?/) != null,
    tpd = htm.match(/\[To Parent Directory\]/) !== null,
    frm = htm.match(/frameset/i) === null,
    div = document.getElementsByTagName('div').length === 0;
    return  ( (ttl && url && frm || end || tpd) && div);
  }
  // end 'detectImageDir'

  // helper
  function newElement ( nodename, classname, parent, shown ) {

    var newElem = document.createElement(nodename);
    
    newElem.className = classname;
    if ( shown !== undefined ) { newElem.toggle(shown); }
    parent.appendChild(newElem);
    return newElem;
  }
  // end 'newElement'
  
  // helper
  this.sendMessage = function (m, d) {
    safari.self.tab.dispatchMessage(m, d);
  };
  // end 'sendMessage()'

  // Class 'LinkList'
  function LinkList () {

    var ll = this;

    this.pictures = [];
    this.pictures = [];
    this.loaded = 0;
    this.pointer = {
      off : -1,
      old : -1,
      now : -1
    };

    // @generates {array} pictures
    (function () {
      var
      i,
      isWP = document.URL.match(/wp-content/i),
      links = document.getElementsByTagName('a'),
      baseURL,
      urlParts;

      for (i = 0; i < links.length; i++) {
        baseURL = links[i].href.split('?')[0];
        if (isWP) {
          urlParts = baseURL.split('-');
          if (urlParts.length > 1 && urlParts[urlParts.length-1].match(/^\d+x\d+\...+/)) {
            baseURL = '';
          }
        }
        // get rid of smaller versions and thumbnails
        if (baseURL.search(/\.thumbnail|_tn\.|TN_\.|_tm\.|big\.|_thumb|[_-]small|_pre\.?\./) > 0) baseURL = '';
        if (baseURL.match(/\/_.?/)) baseURL = '';
        // only count in images
        if (baseURL.search(/.gif|.jpg|.jpeg|.png|.bmp/i) > -1) {
          ll.pictures.push({ originalLink : links[i], href : baseURL });
          links[i].classList.add('good');
        }
      }
    })();
    // end array 'LinkList.pictures'

    this.count = this.pictures.length;

    if (this.count > 0) {
      // generate our DOM elements and methods
      this.userInterface = new UserInterface (this);
    }
  } 
  // end Class 'LinkList'

  // Class 'UserInterface'
  function UserInterface (ll) {

    document.body.className = 'dexImages';

    var ui = this;

    HTMLElement.prototype.toggle = function (v) {
      if (v) {
        this.classList.add('show');
      } else {
        this.classList.remove('show');
      }
    };

    this.shown = false;
    this.nav   = new Navi;
    this.stack = new Stack;
    this.bezel = new Bezel;
    this.scrolledDistance = 0;

    // method
    this.handleKeypress = function (e) {
      var goodKey = true;
      switch (e.keyCode) {
        case 37 : ui.doAction('l'); break;
        case 39 : ui.doAction('r'); break;
        case 40 : ui.doAction('d'); break;
        case 27 : ui.doAction('x'); break;
        case 88 : ui.doAction('x'); break;
        case 38 : ui.doAction('u'); break;
        default : goodKey = false; break;
      }
      if (goodKey) {
        e.preventDefault();
        ui.bezel.keyAction = true;
      }
    };
    // end 'UserInterface.handleKeypress'

    // method
    this.goStep = function (step) {
      ll.pointer.now += step;
      ll.pointer.now = ll.pointer.now >= ll.count  ? ll.pointer.off : ll.pointer.now;
      ll.pointer.now = ll.pointer.now < ll.pointer.off ? ll.count-1 : ll.pointer.now; 
      this.redraw('step');
    };
    // end 'UserInterface.goStep'

    // method
    this.openInNewTab = function () {
      sendMessage('newTab', ll.pictures[this.pointer.now].href + '?from=deximages');
    };
    // end 'UserInterface.openInNewTab'

    // method
    this.doAction = function (code) {
      switch (code) {
        case 'l' : this.goStep(-1); break;
        case 'r' : this.goStep(1); break;
        case 'x' : ll.pointer.now = ll.pointer.off; this.redraw('off'); break; 
        case 'u' : if (this.shown) { this.redraw('off'); } else { history.back(); } break;
        case 'd' : if (this.shown) { this.openInNewTab(); }
        else {
          if (ll.pointer.now === ll.pointer.off) {
            this.goStep(1);
          }
          this.redraw('on');
          this.bezel.keyAction = false;
          this.bezel.resetAutoHiding();
        } 
        break;
        default : break;
      }
    };
    // end 'UserInterface.doAction'
    
    // Class
    function Navi () {

      var nav = this;

      this.bar = newElement('DIV', 'bar', document.body );
      this.bar.loadprogress = newElement('DIV', 'load', this.bar, true );
      this.bar.loadprogress.style.width = 0;
      this.bar.loadprogress.iterate = function (e) {
        e.target.style.cssText =
        'max-width: '   + ui.stack.w + 'px; ' +
        'max-height: '  + ui.stack.h + 'px;';
        e.target.parentNode.style.cssText = 
        'margin-left: ' + Math.floor(( ui.stack.w - e.target.clientWidth  ) / 2) + 'px; ' +
        'margin-top: '  + Math.floor(( ui.stack.h - e.target.clientHeight ) / 2) + 'px;';
        ll.loaded++;
        ui.nav.bar.loadprogress.style.width = Math.floor( document.body.clientWidth / (ll.count - 1) * ll.loaded );
        if (ll.count === ll.loaded) {
          ui.nav.bar.loadprogress.toggle(false);
        }
      };
      this.bar.slider = newElement('DIV', 'slider', this.bar, true);
      this.bar.slider.style.width = Math.max((0 | 100 / ll.count), 1) + '%';

      // local 'drag'
      function drag (e) {

        var p;

        switch (e.type) {
          case 'mousedown' :
          e.preventDefault();
          nav.bar.slider.dragged = true;
          nav.bar.slider.classList.add('dragged');
          break;
          case 'mousemove' : case 'click' :
          if (nav.bar.slider.dragged || e.type == 'click') {
            p = Math.floor(e.clientX / nav.bar.clientWidth * ll.count);
            if ( p != ll.pointer.now ) {
              ll.pointer.now = p;
              ui.redraw('step');
            }
          }
          break;
          case 'mouseup' : case 'mouseout' :
          if (nav.bar.slider.dragged && ( e.type === 'mouseup' || e.toElement.nodeName === 'HTML')) {
            e.preventDefault();
            nav.bar.slider.dragged = false;
            nav.bar.slider.classList.remove('dragged');
          }
        }
      }

      this.bar.slider.dragged = false;
      this.bar.slider.classList.remove('dragged');

      // add some interactivity to the bar
      this.bar.addEventListener('click', drag, false);
      this.bar.addEventListener('mousedown', drag, false);
      window.addEventListener('mousemove', drag, false);
      window.addEventListener('mouseup', drag, false);
      document.body.addEventListener('mouseout', drag, false);
    }
    // end 'UserInterface.Navi'

    // Class
    function Stack () {

      this.wrapper = newElement('DIV', 'stack', document.body, false);
      this.w = this.wrapper.clientWidth;
      this.h = this.wrapper.clientHeight;
      // load all images into the stack
      for (i = 0; i < ll.count; i++) {

        var pic = ll.pictures[i], linkParts;

        pic.A = newElement('A', null, this.wrapper, false);
        pic.IMG = newElement('IMG', null, pic.A );
        linkParts = pic.href.split('/');
        pic.IMG.title = 'Image ' + (i + 1) + ' of ' + ll.count + ' – ' + linkParts[linkParts.length - 1];
        pic.IMG.addEventListener('load', ui.nav.bar.loadprogress.iterate, false);
        pic.IMG.src = pic.A.href = pic.href;
        pic.A.target = '_blank';
      }
    }
    // end 'UserInterface.ImageStack'

    // Class
    function Bezel () {
      
      var bzl = this;
      this.mouseIsOver = false;
      this.hideTimeout = false;
      this.keyAction = false;

      this.explanations = [
      'First Image',                // 0
      'Last Image',                 // 1
      'Previous Image',             // 2
      'Next Image',                 // 3
      'To Slideshow',               // 4
      'Exit Slideshow',             // 5
      'Back to Slideshow',          // 6
      'Go back in Browser History', // 7
      'Open Image in New Tab'       // 8
      ];


      this.hideNow = function () {
        if (!bzl.mouseIsOver && ui.shown) {
          bzl.hideTimeout = false;
          bzl.plate.toggle(false);
        }
      };

      this.resetAutoHiding = function () {

        if (!bzl.keyAction) {
          bzl.plate.toggle(true);
          if (bzl.hideTimeout) {
            clearTimeout(bzl.hideTimeout);
          }
          if (!bzl.mouseIsOver) {
            bzl.hideTimeout = setTimeout( bzl.hideNow, 700);
          }
        } else {
          bzl.keyAction = false;
        }
      };
      
      // method
      this.observeMouseAction = function (e) {
        
        if (e.type === 'mousemove' && e.x === 0 && e.y === 0) { return; }
        
        switch (e.type) {
          case 'mouseover' : // entering
          bzl.mouseIsOver = true;
          break;
          case 'mouseout' : // leaving
          if ( bzl.mouseIsOver ) {
            to = e.toElement;
            while ( !( to.classList.contains('bezel') ) && ( to.nodeName != 'BODY') ) {
              to = to.parentNode;
            }
            bzl.mouseIsOver = to.classList.contains('bezel') ? true : false;
          }
          break;
          case 'mousemove' :
          break;
        }
        bzl.resetAutoHiding();
        
        // testfeld.innerHTML = bzl.mouseIsOver;
      };
      // end 'UserInterface.bezel.mouse'

      // local
      function showExplanations (e) {

        // acts on mouseover on the on-screen-corsor keys,
        // shows explanation for the keys
        // @param {event} e the mouseevent

        var
        xpl = bzl.std,
        txt = bzl.explanations;

        if (e.type === 'mouseover' || e.type === 'mousedown') {
          switch (e.target.className) {
            case 'l': xpl = ll.pointer.now === ll.pointer.off ? txt[1] : ll.pointer.now === 0 ? txt[5] : txt[2]; break;
            case 'r': xpl = ll.pointer.now === ll.pointer.off ? txt[0] : ll.pointer.now === (ll.count - 1) ? txt[5] : txt[3]; break;
            case 'u': xpl = ui.shown ? txt[5] : txt[7]; break;
            case 'd': xpl = ui.shown ? txt[8] : ll.pointer.now === ll.pointer.off ? txt[4] : txt[6]; break;
            default: break;
          }
        }
        bzl.exp.innerHTML = xpl;
      }
      // end 'showExplanations'
      
      // local
      function clickOnArrow (e) {

        // acts on mousdown or mouseup on the on-screen-corsor keys,
        // simulates hold-and-repeat of real keys
        // @param {event} e the mouseevent

        var
        target = e.target,
        type = e.type,
        intervalID = null,
        holdTimeoutID = false;

        if (type === 'mousedown' && target.className.match(/r|l/)) {
          holdTimeoutID = setTimeout(
          function() {
            target.removeEventListener('mouseup', function () { ui.doAction(target.className); }, false);
            intervalID = setInterval(function() { ui.doAction(target.className); }, 200);
            window.addEventListener('mouseup', function() { clearInterval(intervalID); }, false);
          },
          600);
          target.addEventListener('mouseout', function() { clearTimeout(holdTimeoutID); }, false);
          window.addEventListener('mouseup', function() { clearTimeout(holdTimeoutID); }, false);
        }
        if (type === 'mouseup') { ui.doAction(target.className); }
      }
      // end 'clickOnArrow'

      this.hideTimeout = false;
      
      this.plate = newElement( 'DIV', 'bezel', document.body, true );
      
      var
      p, txt,
      btn = newElement('DIV', 'buttons', this.plate ),
      row1  = newElement('DIV', null, btn),
      row2  = newElement('DIV', null, btn),
      u   = newElement('DIV', 'u',  row1 ),
      l   = newElement('DIV', 'l',  row2 ),
      d   = newElement('DIV', 'd',  row2 ),
      r   = newElement('DIV', 'r',  row2 );

      this.exp =  newElement('DIV', 'keyExp', this.plate);
      
      this.std =  ll.count + ' unique image' + ((ll.count > 1) ? 's' : '') + ' detected.<br />Use Arrow Keys to navigate.';
      this.exp.innerHTML = this.std;

      btn.addEventListener('mouseover', showExplanations, false);
      btn.addEventListener('mouseout',  showExplanations, false);
      btn.addEventListener('mousedown', clickOnArrow, false);
      btn.addEventListener('mouseup',   clickOnArrow, false);
      
      this.drag = function (e) {
        
        var
        x, y,
        w = bzl.plate.offsetWidth,
        h = bzl.plate.offsetHeight;
        
        switch (e.type) {
          case 'mousedown' :
          e.preventDefault();
          if ( e.target.classList.contains('bezel') && e.offsetY < 20 ) {
            bzl.dragging = true;
            bzl.startPos = {
              mouseX : e.screenX,
              mouseY : e.screenY,
              bezelX : bzl.plate.offsetLeft,
              bezelY : bzl.plate.offsetTop
            };
          };
          document.addEventListener('mousemove', bzl.drag, false);
          document.addEventListener('mouseup'  , bzl.drag, false);
          break;
          case 'mousemove' :
          if (bzl.dragging) {
            x = bzl.startPos.bezelX - bzl.startPos.mouseX + e.screenX;
            y = bzl.startPos.bezelY - bzl.startPos.mouseY + e.screenY;
            x = x < 0 ? 0 : x; 
            x = x > (ui.stack.w - w) ? (ui.stack.w - w) : x;
            y = y < 0 ? 0 : y; 
            y = y > (ui.stack.h - h) ? (ui.stack.h - h) : y;
            bzl.plate.style.left = x;
            bzl.plate.style.top  = y;
          }
          break;
          case 'mouseup' :
          bzl.dragging = false;
          document.removeEventListener('mousemove', bzl.drag, false);
          document.removeEventListener('mouseup'  , bzl.drag, false);
          break;
        }
      };
      this.plate.addEventListener('mousedown', bzl.drag, false);
      
      this.plate.addEventListener('mouseover', bzl.observeMouseAction, false);
      this.plate.addEventListener('mouseout' , bzl.observeMouseAction, false);
    }
    // end 'UserInterface.bezel'

    // method
    this.redraw = function (e) {

      var
      reason = e.type || e,
      bez = {
        x : ui.bezel.plate.offsetLeft,
        y : ui.bezel.plate.offsetTop,
        w : ui.bezel.plate.offsetWidth,
        h : ui.bezel.plate.offsetHeight
        };

      // reset mousewheel distance
      ui.scrolledDistance = 0;
      switch (reason) {
        case 'resize' : {
          ui.stack.w = ui.stack.wrapper.clientWidth;
          ui.stack.h = ui.stack.wrapper.clientHeight;
          bez.x = bez.x < 0 ? 0 : bez.x; 
          bez.x = bez.x > (ui.stack.w - bez.w) ? (ui.stack.w - bez.w) : bez.x;
          bez.y = bez.y < 0 ? 0 : bez.y; 
          bez.y = bez.y > (ui.stack.h - bez.h) ? (ui.stack.h - bez.h) : bez.y;
          ui.bezel.plate.style.left = bez.x;
          ui.bezel.plate.style.top  = bez.y;

          if (ll.pointer.now !== ll.pointer.off) {
            ll.pictures[ll.pointer.now].IMG.style.cssText =
            'max-width: '  + ui.stack.w + 'px; ' +
            'max-height: ' + ui.stack.h + 'px;';
            ll.pictures[ll.pointer.now].A.style.cssText = 
            'margin-left: ' + Math.floor((ui.stack.w - ll.pictures[ll.pointer.now].IMG.clientWidth) / 2) + 'px; '+
            'margin-top: '  + Math.floor((ui.stack.h - ll.pictures[ll.pointer.now].IMG.clientHeight) / 2); + 'px;';
            
          }
          break;
        }
        case 'step' : {
          // update slider position
          ui.nav.bar.slider.style.marginLeft = 
          Math.floor(((ui.stack.w - ui.nav.bar.slider.clientWidth) * ll.pointer.now) / (ll.count - 1)) + 'px';
          // hide last image
          if (ll.pointer.old !== ll.pointer.off) { // coming from another image?
            ll.pictures[ll.pointer.old].A.toggle(false);
            ll.pictures[ll.pointer.old].originalLink.classList.remove('fat');
          } else {
            ui.bezel.keyAction = false;
            ui.bezel.resetAutoHiding();
          }
          // show new image
          if ( ll.pointer.now !== ll.pointer.off ) { // going to an image?
            ll.pictures[ll.pointer.now].A.toggle(true);
            ll.pictures[ll.pointer.now].originalLink.classList.add('fat');
            if (!ui.shown) {
              ui.show(true);
            } 
          } else  {
            // or hide the UI
            ui.show(false);
            ui.bezel.plate.toggle(true);
          }
          // bookkeeping ...
          ll.pointer.old = ll.pointer.now;
          break;
        }
        case 'off' : ui.show(false); break;
        case 'on'  : ui.show(true);  break;
        default: break;
      }
    };
    // end 'UserInterface.redraw'

    // method
    this.show = function (show) {
      if (show) {
        this.stack.wrapper.toggle(true);
        this.nav.bar.toggle(true);
        this.shown = true;
      } else {
        this.stack.wrapper.toggle(false);
        this.nav.bar.toggle(false);
        this.shown = false;
      }
    };
    // end 'UserInterface.show'

    // method
    this.wheel = function (e) {

      // reacts to mousewheel (or magic mouse stroke) events,
      // advances LinkList.pointer
      // uses a logarythmic function to reduce acceleration effects!

      var
      x = -e.wheelDeltaX,
      y =  e.wheelDeltaY,
      length,
      sign,
      delta = 70;

      if (x + y != 0) {
        length = Math.round( Math.log( Math.sqrt(x * x + y * y) ) ) ;
        sign = (x + y) >= 0 ? 1 : -1;
        if (!ui.shown && Math.abs( y ) > Math.abs( 2 * x ) ) {
          length = 0;
        }
      }
      
      if ( length > 0 ) {
        ui.scrolledDistance += length * sign;
        // testbalken.innerHTML = ui.scrolledDistance;
        // testbalken.style.width = ((Math.abs(ui.scrolledDistance)/delta)*350) + 'px';
        while (Math.abs(ui.scrolledDistance) > delta) {
          ui.goStep(sign);
        }
      }
      if (ui.shown) {
        e.preventDefault();
        return false;
      }
    };
    // end 'UserInterface.wheel'
    
    // make the UserInterface interactive
    window.addEventListener('keydown', ui.handleKeypress, false);
    window.addEventListener('resize', ui.redraw, false);
    document.addEventListener('mousewheel', ui.wheel, false);
  }
  // end Class 'UserInterface'

  // ------------------------------------------------------------------------------

  // if the current site is a directory, we start our magic
  if ( detectImageDir() ) {
    var linkList = new LinkList();
  }
})();