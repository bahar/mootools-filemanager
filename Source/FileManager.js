/*

description: FileManager

requires:
  core/1.3: '*'
  more/1.3.0.1: [Array.Extras, String.QueryString, Hash, Element.Delegation, Element.Measure, Fx.Scroll, Fx.SmoothScroll, Drag, Drag.Move, Assets, Tips ]

provides:
  - filemanager

license:
  MIT-style license

todo:
  - Add Scroller.js (optional) for Drag&Drop in the Filelist
  - exchange SqueezBox with MilkBox

inspiration:
  - Loosely based on a Script by [Yannick Croissant](http://dev.k1der.net/dev/brooser-un-browser-de-fichier-pour-mootools/)

options:
  - url: (string) The base url to a file with an instance of the FileManager php class (FileManager.php), without QueryString
  - assetBasePath: (string) The path to all images and swf files used by the filemanager
  - directory: (string, relative to the directory set in to the filemanager php class) Can be used to load a subfolder instead of the base folder
  - language: (string, defaults to *en*) The language used for the FileManager
  - hideOnClick: (boolean, defaults to *false*) When true, hides the FileManager when the area outside of it is clicked
  - selectable: (boolean, defaults to *false*) If true, provides a button to select a file
  - destroy: (boolean, defaults to *false*) Whether to allow deletion of files or not
  - rename: (boolean, defaults to *false*) Whether to allow renaming of files or not
  - download: (boolean, defaults to *false*) Whether to allow downloading of files or not
  - createFolders: (boolean, defaults to *false*) Whether to allow creation of folders or not
  
  // set in uploader.js
  - upload: (boolean, defaults to *true*)
  - uploadAuthData: (object) Data to be send with the GET-Request of an Upload as Flash ignores authenticated clients
  - resizeImages: (boolean, defaults to *true*) Whether to show the option to resize big images or not
  
events:
  - onComplete(path, file): fired when a file gets selected via the "Select file" button
  - onModify(file): fired when a file gets renamed/deleted or modified in another way
  - onShow: fired when the FileManager opens
  - onHide: event fired when FileManager closes
  - onPreview: event fired when the user clicks an image in the preview
...
*/

var jsGET = {
  vars: {},
  load: function() {
    var hashVars = window.location.hash.split('#');
    if(typeof hashVars[1] != 'undefined') {
      hashVars = hashVars[1].split('&');
      for(var i = 0; i < hashVars.length; i++) {
          var hashVar = hashVars[i].split('=');
          this.vars[hashVar[0]] = hashVar[1];
      }
    }
    return this.vars;
  },
  clear: function() {
    window.location.hash = '#none';
    return false;
  },
  get: function(get) {
    this.load();    
    return (this.vars[get]) ? this.vars[get] : null;
  },
  set: function(set) {
    //console.log('savedHistory');
    this.load();
    
    if(typeof set != 'object') {
      setSplit = set.split('=');
      if(typeof setSplit[1] != 'undefined')
        set[setSplit[0]] = setSplit[1];
      else
        set[setSplit[0]] = '';
    }
    
    // var
    var hashString = '';
    var sep = '#';
    
    // check for change in existing vars
    for(var key in this.vars) {
      if(this.vars.hasOwnProperty(key)) {
        if(set.hasOwnProperty(key)) {
          hashString += sep+key+'='+set[key];
          delete set[key];
        } else if(typeof this.vars[key] != 'undefined') {
          hashString += sep+key+'='+this.vars[key];
        } else
          hashString += sep+key;
        sep = '&';
      }
    }
    
    // add new vars
    for(var key in set) {
      if(set.hasOwnProperty(key) &&
         (typeof this.vars[key] == 'undefined' || this.get(key) != set[key])) {
        hashString += sep+key+'='+set[key];
        sep = '&';
      }
    }
    window.location.hash = hashString;
    return this.load();
  },
  remove: function(remove) {
    this.load();
    
    if(typeof remove != 'object') {
      removes = new Array();
      removes[0] = remove;
    } else
      removes = remove;
    
    // var
    var hashString = '';
    var sep = '#';
    
    for (var i = 0; i < removes.length; i++) {
      if(this.vars.hasOwnProperty(removes[i]))
        delete this.vars[removes[i]];
    }
    
    // create new hash string
    for(var key in this.vars) {
      if(this.vars.hasOwnProperty(key)) {
        if(typeof this.vars[key] != 'undefined') {
          hashString += sep+key+'='+this.vars[key];
        } else
          hashString += sep+key;
        sep = '&';
      }
    }
    window.location.hash = hashString;
    return this.vars;
  },
  addListener: function(listener,callAlways,bind) { // use the returned interval ID for removeListener
    //var
    var self = this;
    var lastHash = '';
    var oldVars = new self.vars.constructor(); for(var key in self.vars) oldVars[key] = self.vars[key];;
    var newVars = {};
    
    function compare(obj1,obj2) {
      for(var key in obj1) if(obj1[key] !== obj2[key]) return false;
      return true;
    }
    
    this.pollHash = function() {
        if(lastHash !== window.location.hash) {
          // var
          lastHash = window.location.hash;
          newVars = self.vars;
          
          if(callAlways || compare(newVars,oldVars)) {
            // var
            //oldVars = new self.vars.constructor(); for(var key in self.vars) oldVars[key] = self.vars[key];
            self.load();
            //newVars = new self.vars.constructor(); for(var key in self.vars) newVars[key] = self.vars[key];
            var changedVars = new self.vars.constructor(); for(var key in self.vars) changedVars[key] = self.vars[key];
            /*
            console.log('-----');
            console.log(oldVars);
            console.log(changedVars);
            */
            // check for changed vars
            for(var key in changedVars)
              if(changedVars.hasOwnProperty(key) && typeof oldVars[key] != 'undefined' && oldVars[key] == changedVars[key]) {
                delete changedVars[key];
                delete oldVars[key];
              }
            // merge the rest of oldVars with the changedVars
            for(var key in oldVars) {
              if(oldVars.hasOwnProperty(key) && !(key in changedVars)) changedVars[key] = oldVars[key];
            }
            // call the given listener function
            if(typeof listener == 'function')
              listener.apply(bind,[changedVars]);
          }
          
          oldVars = new self.vars.constructor(); for(var key in self.vars) oldVars[key] = self.vars[key];
        }
    }
    return setInterval(this.pollHash, 500);
  },
  removeListener: function(listenerID) { // use the interval ID returned by addListener
    delete this.pollHash;
    return clearInterval(listenerID);
  }
}

var MooFileManagerUniqueID = 1;
var FileManager = new Class({

  Implements: [Options, Events],

  Request: null,
  Directory: null,
  Current: null,
  ID: null,

  options: {
    /*onComplete: function(){},
    onModify: function(){},
    onShow: function(){},
    onHide: function(){},
    onPreview: function(){}*/
    directory: '',
    url: null,
    assetBasePath: null,
    hideOnClick: false,
    language: 'en',
    selectable: false,
    destroy: false,
    rename: false,
    download: false,
    createFolders: false
  },
  
  hooks: {
    show: {},
    cleanup: {}
  },

  initialize: function(options) {
    this.setOptions(options);
    this.ID = MooFileManagerUniqueID;
    MooFileManagerUniqueID++;
    this.dragZIndex = 1300;
    this.droppables = [];
    this.assetBasePath = this.options.assetBasePath.replace(/(\/|\\)*$/, '/');
    this.Directory = this.options.directory;
    this.listType = 'list';
    this.dialogOpen = false;
    this.usingHistory = false;
    
    this.language = Object.clone(FileManager.Language.en);
    if(this.options.language != 'en') this.language = Object.merge(this.language, FileManager.Language[this.options.language]);  
    
    this.container = new Element('div', {'class': 'filemanager-container' + (Browser.opera ? ' filemanager-engine-presto' : '') + (Browser.ie ? ' filemanager-engine-trident' : '') + (Browser.ie8 ? '4' : '') + (Browser.ie9 ? '5' : '')});
    this.filemanager = new Element('div', {'class': 'filemanager'}).inject(this.container);
    this.header = new Element('div', {'class': 'filemanager-header'}).inject(this.filemanager);
    this.menu = new Element('div', {'class': 'filemanager-menu'}).inject(this.filemanager);
    this.loader = new Element('div', {'class': 'loader', opacity: 0, tween: {duration: 300}}).inject(this.header);
    this.previewLoader = new Element('div', {'class': 'loader', opacity: 0, tween: {duration: 300}});
    this.browserLoader = new Element('div', {'class': 'loader', opacity: 0, tween: {duration: 300}});
    // switch the path, from clickable to input text
    this.clickablePath = new Element('span', {'class': 'filemanager-dir'});
    this.selectablePath = new Element('input',{'type':'text','class': 'filemanager-dir','readonly':'readonly'})
    
    this.header.adopt(new Element('a', {href:'#','class': 'filemanager-dir-title',text: this.language.dir}).addEvent('click',(function(e){
      e.stop();
      if(this.header.getElement('span.filemanager-dir')!= null)
          this.selectablePath.replaces(this.clickablePath);
      else
        this.clickablePath.replaces(this.selectablePath);
    }).bind(this)),this.clickablePath);
    
    var self = this;
    // -> catch a click on an element in the file/folder browser
    this.relayClick = function(e) {
      if(e) e.stop();
      self.storeHistory = true;
      
      var file = this.retrieve('file');
      if (this.retrieve('edit')) {
        this.eliminate('edit');
        return;
      }
      
      if (file.mime == 'text/directory'){
        this.addClass('selected');
        self.load(self.Directory + file.name);
        return;
      }

      self.fillInfo(file);
      if (self.Current) self.Current.removeClass('selected');
      self.Current = this.addClass('selected');

      self.switchButton();
    };

    this.toggleList = function(e)
    {
      if(e) e.stop();
      $$('.filemanager-browserheader a').set('opacity',0.5);
      this.set('opacity',1);
      self.listType = (this.id == 'togggle_side_list') ? 'list' : 'thumb';
      self.load(self.Directory);
    }

    this.browsercontainer = new Element('div',{'class': 'filemanager-browsercontainer'}).inject(this.filemanager);
    this.browserheader = new Element('div',{'class': 'filemanager-browserheader'}).inject(this.browsercontainer);
    this.browserheader.adopt(this.browserLoader);
    this.browserScroll = new Element('div', {'class': 'filemanager-browserscroll'}).inject(this.browsercontainer).addEvent('mouseover',(function(){
      this.browser.getElements('span.fi.hover').each(function(span){ span.removeClass('hover'); });
    }).bind(this));
    this.browserheader.adopt([      
      new Element('a',{
        'id':'togggle_side_boxes',
        'class':'listType',
        'style' : 'margin-right: 10px;'
      }).set('opacity',0.5).addEvents({
        click: this.toggleList
      }),
      new Element('a',{
        'id':'togggle_side_list',
        'class':'listType'
      }).set('opacity',1).addEvents({
        click: this.toggleList
      })
    ]);
    
    this.browser = new Element('ul', {'class': 'filemanager-browser'})./*addEvents({
      click: (function(){
        return self.deselect();
      }),
      'click:relay(li span.fi)': this.relayClick
    }).*/inject(this.browserScroll);
    
    if(this.options.createFolders) this.addMenuButton('create');
    if(this.options.download) this.addMenuButton('download');
    if(this.options.selectable) this.addMenuButton('open');
    
    this.info = new Element('div', {'class': 'filemanager-infos', opacity: 0}).inject(this.filemanager);

    var head = new Element('div', {'class': 'filemanager-head'}).adopt([
      new Element('img', {'class': 'filemanager-icon'}),
      new Element('h1')
    ]);

    this.info.adopt([head, new Element('h2', {text: this.language.information})]);

    new Element('dl').adopt([
      new Element('dt', {text: this.language.modified}),
      new Element('dd', {'class': 'filemanager-modified'}),
      new Element('dt', {text: this.language.type}),
      new Element('dd', {'class': 'filemanager-type'}),
      new Element('dt', {text: this.language.size}),
      new Element('dd', {'class': 'filemanager-size'})
    ]).inject(this.info);
    
    this.preview = new Element('div', {'class': 'filemanager-preview'}).addEvent('click:relay(img.preview)', function(){
      self.fireEvent('preview', [this.get('src')]);
    });
    this.info.adopt([
      new Element('h2', {'class': 'filemanager-headline', text: this.language.more}),
      this.preview
    ]);
    
    this.closeIcon = new Element('a', {
      'class': 'filemanager-close',
      title: this.language.close,
      events: {click: this.hide.bind(this)}
    }).inject(this.filemanager);
    
    this.tips = new Tips({
      className: 'tip-filebrowser',
      offsets: {x: 15, y: 0},
      text: null,
      showDelay: 50,
      hideDelay: 50,
      onShow: function(){
        this.tip.set('tween', {duration: 250}).setStyle('display', 'block').fade(1);
      },
      onHide: function(){
        this.tip.fade(0).get('tween').chain(function(){
          this.element.setStyle('display', 'none');
        });
      }
    });
    this.tips.attach(this.closeIcon.appearOn(this.closeIcon, [1, 1]).appearOn(this.filemanager, 1));
    
    this.imageadd = new Asset.image(this.assetBasePath + 'add.png', {
      'class': 'browser-add'
    }).set('opacity', 0).inject(this.container);
    
    this.container.inject(document.body);
    this.overlay = new Overlay(this.options.hideOnClick ? {
      events: {click: this.hide.bind(this)}
    } : null);
    
    this.bound = {
      keydown: (function(e){
        if (e.control || e.meta) this.imageadd.fade(1);
      }).bind(this),
      keyup: (function(){
        this.imageadd.fade(0);
      }).bind(this),
      keyboardInput: (function(e){
        if(this.dialogOpen) return;

        if (e.key=='esc') this.hide();
        if (e.key=='up') {
          e.preventDefault();
          this.browserSelection('up');
        }
        if (e.key=='down') {
          e.preventDefault();
          this.browserSelection('down');
        }
        if (e.key=='enter') {
          e.preventDefault();
          this.browserSelection('enter');
        }
        if (e.key=='backspace') {
          e.preventDefault();
          this.browserSelection('backspace');
        }
      }).bind(this),
      scroll: (function(){
        this.filemanager.center(this.offsets);
        this.fireEvent('scroll');
        
        scrollSize = this.browsercontainer.getSize();
        headerSize = this.browserheader.getSize();
        this.browserScroll.setStyle('height',scrollSize.y - headerSize.y);

      }).bind(this)
    };
   
   // autostart filemanager when set
   if(typeof jsGET != 'undefined' && jsGET.get('fmID') == this.ID)
    this.show();
  },
  
  hashHistory: function(vars) { // get called from the jsGET listener
    this.storeHistory = false;
    //console.log(vars);
    if(vars['fmPath'] == '')
      vars['fmPath'] = '/';
    
    Object.each(vars,function(value,key) {        
        if(key == 'fmPath') {
          this.load(value);
        }
        
        if(key == 'fmFile') {
          this.browser.getElements('span.fi span').each((function(current){
            if(current.get('title') == value) {
              this.deselect();
              this.Current = current.getParent('span.fi');
              new Fx.Scroll(this.browserScroll,{duration: 250,offset:{x:0,y:-(this.browserScroll.getSize().y/4)}}).toElement(current.getParent('span.fi'));
              current.getParent('span.fi').addClass('selected');
              this.fillInfo(current.getParent('span.fi').retrieve('file'));
            }
          }).bind(this));
        }
    },this);
  },
  
  show: function(e){
    if (e) e.stop();
    this.onShow = false;
    
    // get and set history
    if(typeof jsGET != 'undefined') {
      if(jsGET.get('fmFile') != null) this.onShow = true;
      if(jsGET.get('fmPath') != null) this.Directory = jsGET.get('fmPath');
      jsGET.set({'fmID':this.ID,'fmPath':this.Directory});
      this.hashListenerId = jsGET.addListener(this.hashHistory,false,this);
    }
    
    this.load(this.Directory);
    this.overlay.show();

    this.info.set('opacity', 0);
    
    this.container.setStyles({
        opacity: 0,
        display: 'block'
      });
    
    this.filemanager.center(this.offsets);
    this.fireEvent('show');
    this.container.set('opacity', 1);
    this.fireHooks('show');

    window.addEvents({
      'scroll': this.bound.scroll,
      'resize': this.bound.scroll
    });
    // add keyboard navigation
    if((Browser.Engine && (Browser.Engine.trident || Browser.Engine.webkit)) || (Browser.ie || Browser.chrome || Browser.safari))
     document.addEvent('keydown', this.bound.keyboardInput);
    else
     document.addEvent('keypress', this.bound.keyboardInput);
    
    scrollSize = this.browsercontainer.getSize();
    headerSize = this.browserheader.getSize();
    this.browserScroll.setStyle('height',scrollSize.y - headerSize.y);
    
    this.container.tween('opacity',1);
  },
  
  hide: function(e){
    if (e) e.stop();
    
    // stop hashListener
    if(typeof jsGET != 'undefined')
      jsGET.removeListener(this.hashListenerId);
    
    this.overlay.hide();
    this.tips.hide();
    this.browser.empty();
    this.container.setStyle('display', 'none');
    
    this.fireHooks('cleanup').fireEvent('hide');
    
    // add keyboard navigation
    window.removeEvent('scroll', this.bound.scroll).removeEvent('resize', this.bound.scroll);
    if((Browser.Engine && (Browser.Engine.trident || Browser.Engine.webkit)) || (Browser.ie || Browser.chrome || Browser.safari))
     document.removeEvent('keydown', this.bound.keyboardInput);
    else
     document.removeEvent('keypress', this.bound.keyboardInput);
  },

  open: function(e){
    e.stop();
    if (!this.Current) return false;
    this.fireEvent('complete', [
      this.normalize(this.Current.retrieve('file').path),
      this.Current.retrieve('file')
    ]);
    this.hide();
  },
  
  download: function(e) {
    e.stop();
    if (!this.Current) return false;
    window.open(this.normalize(this.Current.retrieve('file').path));
  },

  create: function(e){
    e.stop();
    var input = new Element('input', {'class': 'createDirectory','autofocus':'autofocus'});
    
    var self = this;
    new Dialog(this.language.createdir, {
      language: {
        confirm: this.language.create,
        decline: this.language.cancel
      },
      content: [
        input
      ],
      onOpen: this.onDialogOpen.bind(this),
      onClose: this.onDialogClose.bind(this),
      onShow: function(){
        input.addEvent('keyup', function(e){
          if (e.key == 'enter') e.target.getParent('div.dialog').getElement('button.dialog-confirm').fireEvent('click');
        }).focus();
      },
      onConfirm: function() {
        new FileManager.Request({
          url: self.options.url + '?event=create',
          onSuccess: self.fill.bind(self),
          data: {
            file: input.get('value'),
            directory: self.Directory,
            type: self.listType
          }
        }).send();
      }
    });
  },

  deselect: function(el) {
    if (el && this.Current != el) return;
    
    if (el) this.fillInfo();
    if (this.Current) this.Current.removeClass('selected');
    this.Current = null;

    this.switchButton();
  },

  load: function(dir, nofade) {
    
    this.deselect();
    if (!nofade) this.info.fade(0);    
    
    if (this.Request) this.Request.cancel();

    this.Request = new FileManager.Request({
      url: this.options.url,
      onRequest: (function(){
        this.browserLoader.set('opacity', 1);
      }).bind(this),
      onSuccess: (function(j) {
        this.fill(j, nofade);
      }).bind(this),
      onComplete: (function() {
        this.browserLoader.fade(0);
      }).bind(this),
      onFailure: (function(xmlHttpRequest) {
        this.showError(xmlHttpRequest);
      }).bind(this),
      data: {
        directory: dir,
        type: this.listType
      }
    }, this).send();
  },

  destroy: function(file){
    var self = this;
    new Dialog(this.language.destroyfile, {
      language: {
        confirm: this.language.destroy,
        decline: this.language.cancel
      },
      onOpen: this.onDialogOpen.bind(this),
      onClose: this.onDialogClose.bind(this),
      onConfirm: function() {
        new FileManager.Request({
          url: self.options.url + '?event=destroy',
          data: {
            file: file.name,
            directory: self.Directory
          },
          onSuccess: function(j){
            if (!j || j.content!='destroyed'){
              new Dialog(self.language.nodestroy, {language: {confirm: self.language.ok}, buttons: ['confirm']});
              return;
            }

            self.fireEvent('modify', [Object.clone(file)]);
            file.element.getParent().fade(0).get('tween').chain(function(){
              self.deselect(file.element);
              this.element.destroy();
            });
          }
        }).send();
      }
    });

  },

  rename: function(file) {
    var self = this;
    var name = file.name;
    var input = new Element('input', {'class': 'rename', value: name,'autofocus':'autofocus'});    
    
    if (file.mime != 'text/directory') name = name.replace(/\..*$/, '');
    
    new Dialog(this.language.renamefile, {
      language: {
        confirm: this.language.rename,
        decline: this.language.cancel
      },
      content: [
        input
      ],
      onOpen: this.onDialogOpen.bind(this),
      onClose: this.onDialogClose.bind(this),
      onShow: function(){
        input.addEvent('keyup', function(e){
          if (e.key=='enter') e.target.getParent('div.dialog').getElement('button.dialog-confirm').fireEvent('click');
        }).focus();
      },
      onConfirm: (function(){
        new FileManager.Request({
          url: self.options.url + '?event=move',
          onSuccess: (function(j){
            if (!j || !j.name) return;

            self.fireEvent('modify', [Object.clone(file)]);

            file.element.getElement('span').set('text', j.name);
            file.name = j.name;
            self.fillInfo(file);
          }).bind(this),
          onFailure: (function(xmlHttpRequest) {
            this.showError(xmlHttpRequest);
          }).bind(self),
          data: {
            file: file.name,
            name: input.get('value'),
            directory: self.Directory
          }
        }, self).send();
      }).bind(this)
    });
  },
  
  browserSelection: function(direction) {   
    if(this.browser.getElement('li') == null) return;

    // folder up
    if(this.Directory && direction == 'backspace')
      this.load(this.Directory + '..');
    
    // none is selected
    if(this.browser.getElement('span.fi.hover') == null && this.browser.getElement('span.fi.selected') == null) {
      // select first folder
      this.browser.getFirst('li').getElement('span.fi').addClass('hover');
      new Fx.Scroll(this.browserScroll,{duration: 250}).toElement(this.browser.getFirst('li').getElement('span.fi'));
    } else {
      // select the current file/folder or the one with hover
      var current = null;
      if(this.browser.getElement('span.fi.hover') == null && this.browser.getElement('span.fi.selected') != null)
        current = this.browser.getElement('span.fi.selected');
      else if(this.browser.getElement('span.fi.hover') != null)
        current = this.browser.getElement('span.fi.hover');
      var browserScrollFx = new Fx.Scroll(this.browserScroll,{duration: 150}); //offset: {x:0,y:-(this.browserScroll.getSize().y / 4)},

      // go down
      if(direction == 'down') {
        if(current.getParent('li').getNext('li') != null) {
          current.removeClass('hover');
          var next = current.getParent('li').getNext('li').getElement('span.fi');
          next.addClass('hover');   
          if((current.getPosition(this.browserScroll).y + (current.getSize().y*2)) >= this.browserScroll.getSize().y)
            browserScrollFx.toElement(current);
        }
      // go up
      } else if(direction == 'up') {
        if(current.getParent('li').getPrevious('li') != null) {
          current.removeClass('hover');      
          var previous = current.getParent('li').getPrevious('li').getElement('span.fi');      
          previous.addClass('hover');
          if((current.getPosition(this.browserScroll).y) <= current.getSize().y) {
            browserScrollFx.start(current.getPosition(this.browserScroll).x,(this.browserScroll.getScroll().y - this.browserScroll.getSize().y + (current.getSize().y*2)))
          }
        }
      
      // select
      } else if(direction == 'enter') {
        this.storeHistory = true;
        this.Current = current;
        if(this.browser.getElement('span.fi.selected') != null) // remove old selected one
          this.browser.getElement('span.fi.selected').removeClass('selected');
        current.addClass('selected');
        var currentFile = current.retrieve('file');        
        if(currentFile.mime == 'text/directory')
          this.load(currentFile.path.replace(this.root,''));
        else {
          this.fillInfo(currentFile);
        }
      }
    }
  },
  
  fill: function(j, nofade) {
    this.Directory = j.path;
    this.CurrentDir = j.dir;
    if (!nofade && !this.onShow) this.fillInfo(j.dir);
    this.browser.empty();
    this.root = j.root;
    var self = this;
    
    // set history
    if(typeof jsGET != 'undefined' && this.storeHistory && j.dir.mime == 'text/directory')
      jsGET.set({'fmPath':j.path});

    this.CurrentPath = this.root + this.Directory;
    var text = [], pre = [];
    var rootPath = j.root.slice(0,-1).split('/');
    rootPath.pop();
    this.CurrentPath.split('/').each(function(folderName){
      if (!folderName) return;

      pre.push(folderName);
      var path = ('/'+pre.join('/')+'/').replace(j.root,'');
      // add non-clickable path
      if(rootPath.contains(folderName)) {
        text.push(new Element('span', {'class': 'icon',text: folderName}));
      // add clickable path
      } else {
        text.push(new Element('a', {
            'class': 'icon',
            href: '#',
            text: folderName
          }).addEvent('click', function(e){
            e.stop();  
            self.load(path);
          })
        );
      }
      text.push(new Element('span', {text: ' / '}));
    });
    
    text.pop();
    text[text.length-1].addClass('selected').removeEvents('click').addEvent('click', function(e){e.stop();});
    this.selectablePath.set('value','/'+this.CurrentPath);
    this.clickablePath.empty().adopt(new Element('span', {text: '/ '}), text);
    
    if (!j.files) return;    
    
    // ->> generate browser list
    var els = [[], []];

    Array.each(j.files, function(file) {
      
      file.dir = j.path;
      var largeDir = '';
      // generate unique id
      var newDate = new Date;
      uniqueId = newDate.getTime();
      var icon = (this.listType == 'thumb') ? new Asset.image(file.thumbnail+'?'+uniqueId,{'class':this.listType}) : new Asset.image(file.thumbnail);
      
      var el = file.element = new Element('span', {'class': 'fi ' + this.listType, href: '#'}).adopt(
        icon,
        new Element('span', {text: file.name, title:file.name})
      ).store('file', file);

      // add click event, only to directories, files use the revert function (to enable drag n drop)
      if(file.mime == 'text/directory')
        el.addEvent('click',this.relayClick);
      
      // -> add icons
      var icons = [];
      // dowload icon
      if(file.mime!='text/directory' && this.options.download)
        icons.push(new Asset.image(this.assetBasePath + 'Images/disk.png', {title: this.language.download}).addClass('browser-icon').addEvent('mouseup', (function(e){
          e.preventDefault();
          el.store('edit',true);
          window.open(file.path);
        }).bind(this)).inject(el, 'top'));

      // rename, delete icon
      if(file.name != '..') {       
        var editButtons = new Array();
        if(this.options.rename) editButtons.push('rename');
        if(this.options.destroy) editButtons.push('destroy');
        editButtons.each(function(v){
          icons.push(new Asset.image(this.assetBasePath + 'Images/' + v + '.png', {title: this.language[v]}).addClass('browser-icon').addEvent('mouseup', (function(e){
            e.preventDefault();
            el.store('edit',true);
            this.tips.hide();
            this[v](file);
          }).bind(this)).inject(el,'top'));
        }, this);
      }

      els[file.mime == 'text/directory' ? 1 : 0].push(el);
      //if (file.name == '..') el.set('opacity', 0.7);
      el.inject(new Element('li',{'class':this.listType}).inject(this.browser)).store('parent', el.getParent());
      icons = $$(icons.map(function(icon){return icon.appearOn(icon, [1, 0.7]);})).appearOn(el.getParent('li'), 0.7);
      
      // ->> LOAD the FILE/IMAGE from history when PAGE gets REFRESHED (only directly after refresh)
      if(this.onShow && typeof jsGET != 'undefined' && jsGET.get('fmFile') != null && file.name == jsGET.get('fmFile')) {
        this.deselect();
        this.Current = file.element;
        new Fx.Scroll(this.browserScroll,{duration: 250,offset:{x:0,y:-(this.browserScroll.getSize().y/4)}}).toElement(file.element);
        file.element.addClass('selected');
        this.fillInfo(file);
      } else if(this.onShow && jsGET.get('fmFile') == null)
        this.onShow = false;
    }, this);
    
    // -> cancel dragging
    var self = this, revert = function(el) {
      el.set('opacity', 1).removeClass('drag').removeClass('move').setStyles({
        opacity: 1,
        'z-index': 'auto',
        position: 'relative',
        width: 'auto',
        left: 0,
        top: 0
      }).inject(el.retrieve('parent'));
      //el.getElements('img.browser-icon').set('opacity', 0);
      
      document.removeEvent('keydown', self.bound.keydown).removeEvent('keyup', self.bound.keydown);
      self.imageadd.fade(0);

      self.relayClick.apply(el);
    };

    // -> make dragable
    $$(els[0]).makeDraggable({
      droppables: $$(this.droppables.combine(els[1])),
      //stopPropagation: true,

      onDrag: function(el, e){
        self.imageadd.setStyles({
          'left': e.page.x + 20,
          'top': e.page.y + 20,
        });
        self.imageadd.fade('in');
      },

      onBeforeStart: function(el){
        self.deselect();
        self.tips.hide();
        var position = el.getPosition();
        el.addClass('drag').setStyles({
          'z-index': self.dragZIndex,
          'position': 'absolute',
          'width': el.getWidth() - el.getStyle('paddingLeft').toInt() - el.getStyle('paddingRight').toInt(),
          'left': position.x,
          'top': position.y
        }).inject(self.container);
      },

      onCancel: revert,

      onStart: function(el){
        el.set('opacity', 0.7).addClass('move');
        document.addEvents({
          keydown: self.bound.keydown,
          keyup: self.bound.keyup
        });
      },

      onEnter: function(el, droppable){
        droppable.addClass('droppable');
      },

      onLeave: function(el, droppable){
        droppable.removeClass('droppable');
      },

      onDrop: function(el, droppable, e){
        revert(el);

        if (e.control || e.meta || !droppable) el.setStyles({left: 0, top: 0});
        if (!droppable && !e.control && !e.meta) return;
        
        var dir;
        if (droppable){
          droppable.addClass('selected').removeClass('droppable');
          (function(){droppable.removeClass('selected');}).delay(300);
          if (self.onDragComplete(el, droppable)) return;

          dir = droppable.retrieve('file');
        }
        var file = el.retrieve('file');

        new FileManager.Request({
          url: self.options.url + '?event=move',
          data: {
            file: file.name,
            directory: self.Directory,
            newDirectory: dir ? dir.dir + '/' + dir.name : self.Directory,
            copy: e.control || e.meta ? 1 : 0
          },
          onSuccess: function(){
            if (!dir) self.load(self.Directory);
          },
          onFailure: (function(xmlHttpRequest) {
            this.showError(xmlHttpRequest);
          }).bind(self)
        }, self).send();

        self.fireEvent('modify', [Object.clone(file)]);

        if (!e.control && !e.meta)
          el.fade(0).get('tween').chain(function(){
            self.deselect(el);
            el.getParent().destroy();
          });
      }
    });
    
    $$(els[0].combine(els[1])).setStyles({'left': 0, 'top': 0});

    this.tips.attach(this.browser.getElements('img.browser-icon'));
  },

  fillInfo: function(file) {
    if (!file) file = this.CurrentDir;
    if (!file) return;
    
    // set file history
    //console.log(this.storeHistory);
    if(typeof jsGET != 'undefined' && this.storeHistory) {
      if(file.mime != 'text/directory')
        jsGET.set({'fmFile':file.name});
      else
        jsGET.set({'fmFile':''});
    }
    
    var size = this.size(file.size);    
    var icon = file.icon;
    
    this.switchButton();

    this.info.fade(1).getElement('img').set({
      src: icon,
      alt: file.mime
    });
    
    this.fireHooks('cleanup');
    this.preview.empty();

    this.info.getElement('h1').set('text', file.name);
    this.info.getElement('h1').set('title', file.name);
    this.info.getElement('dd.filemanager-modified').set('text', file.date);
    this.info.getElement('dd.filemanager-type').set('text', file.mime);
    this.info.getElement('dd.filemanager-size').set('text', !size[0] && size[1] == 'Bytes' ? '-' : (size.join(' ') + (size[1] != 'Bytes' ? ' (' + file.size + ' Bytes)' : '')));
    this.info.getElement('h2.filemanager-headline').setStyle('display', file.mime == 'text/directory' ? 'none' : 'block');

    if (file.mime=='text/directory') return;

    if (this.Request) this.Request.cancel();

    this.Request = new FileManager.Request({
      url: this.options.url + '?event=detail',
      onRequest: (function() {
        this.previewLoader.inject(this.preview);
        this.previewLoader.set('opacity', 1);
      }).bind(this),
      onSuccess: (function(j) {
        
        this.previewLoader.fade(0).get('tween').chain((function() {
          this.previewLoader.dispose();
        
          var prev = this.preview.removeClass('filemanager-loading').set('html', j && j.content ? j.content.substitute(this.language, /\\?\$\{([^{}]+)\}/g) : '').getElement('img.preview');
          if (prev) prev.addEvent('load', function(){
            this.setStyle('background', 'none');
          });
          
          var els = this.preview.getElements('button');
          if (els) els.addEvent('click', function(e){
            e.stop();
            window.open(this.get('value'));
          });
          
          if(typeof milkbox != 'undefined')
            milkbox.reloadPageGalleries();

        }).bind(this));
      }).bind(this),
      onFailure: (function(xmlHttpRequest) {
        this.previewLoader.dispose();
        this.showError(xmlHttpRequest);
      }).bind(this),
      data: {
        directory: this.Directory,
        file: file.name
      }
    }, this).send();
    
  },

  size: function(size){
    var tab = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    for(var i = 0; size > 1024; i++)
      size = size/1024;

    return [Math.round(size), tab[i]];
  },

  normalize: function(str){
    return str.replace(/\/+/g, '/');
  },

  switchButton: function() {
    var chk = !!this.Current;
    var els = new Array();
    els.push(this.menu.getElement('button.filemanager-open'));
    els.push(this.menu.getElement('button.filemanager-download'));
    els.each(function(el){
      if (el) el.set('disabled', !chk)[(chk ? 'remove' : 'add') + 'Class']('disabled');
    });
  },
  
  // adds buttons to the file main menu, which onClick start a method with the same name
  addMenuButton: function(name) {
    var el = new Element('button', {
      'class': 'filemanager-' + name,
      text: this.language[name]
    }).inject(this.menu, 'top');
    if (this[name]) el.addEvent('click', this[name].bind(this));
    return el;
  },
  
  fireHooks: function(hook){
    var args = Array.slice(arguments, 1);
    for(var key in this.hooks[hook]) this.hooks[hook][key].apply(this, args);
    return this;
  },
  
  showError: function(xmlHttpRequest) {
    var errorText = xmlHttpRequest.responseText.toString();
    var self = this;
    
    if(errorText.indexOf('{') != -1)
      errorText = errorText.substring(0,errorText.indexOf('{'));
    
    new Dialog(this.language.error, {
      buttons: ['confirm'],
      language: {
        confirm: this.language.ok
      },
      content: [
        errorText
      ],
      onOpen: this.onDialogOpen.bind(this),
      onClose: this.onDialogClose.bind(this)
    });
  },
  
  onRequest: function(){this.loader.set('opacity', 1);},
  onComplete: function(){this.loader.fade(0);},
  onDialogOpen: function(){this.dialogOpen = true; this.onDialogOpenWhenUpload.apply(this);},
  onDialogClose: function(){this.dialogOpen = false; this.onDialogCloseWhenUpload.apply(this);},
  onDialogOpenWhenUpload: function(){},
  onDialogCloseWhenUpload: function(){},
  onDragComplete: Function.from(false)
});

FileManager.Request = new Class({  
  Extends: Request.JSON,
  
  initialize: function(options, filebrowser){
    this.parent(options);
    
    if (filebrowser) this.addEvents({
      request: filebrowser.onRequest.bind(filebrowser),
      complete: filebrowser.onComplete.bind(filebrowser)
    });
  }
});

FileManager.Language = {};

(function(){

// ->> load DEPENCIES
var scriptSource = (function() {
      var scripts = document.getElementsByTagName('script');
      var script = scripts[scripts.length - 1].src;
      return script.substring(0, script.lastIndexOf('/')) + '/';
  }());
document.getElement('head').adopt(new Element('script',{'type':'text/javascript','src':scriptSource+'../Assets/js/milkbox/milkbox.js'}));
document.getElement('head').adopt(new Element('link',{'type':'text/css','rel':'stylesheet','href':scriptSource+'../Assets/js/milkbox/css/milkbox.css'}));
document.getElement('head').adopt(new Element('link',{'type':'text/css','rel':'stylesheet','href':scriptSource+'../Assets/Css/FileManager.css'}));
document.getElement('head').adopt(new Element('link',{'type':'text/css','rel':'stylesheet','href':scriptSource+'../Assets/Css/Additions.css'}));


Element.implement({
  
    appearOn: function(el) {
      
      var $defined = function(obj){ return (obj != undefined); };
      
      var params = Array.link(Array.from(arguments).erase(arguments[0]), {options: Type.isObject, opacity: $defined}),
        opacity = typeOf(params.opacity) == 'array' ? [params.opacity[0] || 1, params.opacity[1] || 0] : [params.opacity || 1, 0];
      
      this.set({
        opacity: opacity[1],
        tween: params.options || {duration: 500}
      });

      $$(el).addEvents({
        mouseenter: this.fade.pass(opacity[0],this),
        mouseleave: this.fade.pass(opacity[1],this)
      });
      
      return this;
    },
  
  center: function(offsets){
    var scroll = document.getScroll(),
      offset = document.getSize(),
      size = this.getSize(),
      values = {x: 'left', y: 'top'};
    
    if (!offsets) offsets = {};
    
    for (var z in values){
      var style = scroll[z] + (offset[z] - size[z]) / 2 + (offsets[z] || 0);
      this.setStyle(values[z], style < 10 ? 10 : style);
    }
    
    return this;
  }
  
});

this.Dialog = new Class({
  
  Implements: [Options, Events],
  
  options: {
    /*onShow: function(){},
    onOpen: function(){},
    onConfirm: function(){},
    onDecline: function(){},
    onClose: function(){},*/
    request: null,
    buttons: ['confirm', 'decline'],
    language: {}
  },
  
  initialize: function(text, options){
    this.setOptions(options);
    this.dialogOpen = false;
    
    this.el = new Element('div', {
      'class': 'dialog' + (Browser.ie ? ' dialog-engine-trident' : '') + (Browser.ie ? ' dialog-engine-trident' : '') + (Browser.ie8 ? '4' : '') + (Browser.ie9 ? '5' : ''),
      opacity: 0,
      tween: {duration: 250}
    }).adopt([
      typeOf(text) == 'string' ? new Element('div', {text: text}) : text
    ]);
    
    if(typeof this.options.content != 'undefined') {
      this.options.content.each((function(content){
        if(content && typeOf(content) == 'element') this.el.getElement('div').adopt(content);
        else if(content) this.el.getElement('div').set('html',this.el.getElement('div').get('html')+'<br>'+content);
      }).bind(this));
    }
    
    Array.each(this.options.buttons, function(v){
      new Element('button', {'class': 'dialog-' + v, text: this.options.language[v]}).addEvent('click', (function(e){
        if (e) e.stop();
        this.fireEvent(v).fireEvent('close');
        this.overlay.hide();
        this.destroy();
      }).bind(this)).inject(this.el);
    }, this);
    
    this.overlay = new Overlay({
      'class': 'overlay overlay-dialog',
      events: {click: this.fireEvent.pass('close',this)},
      tween: {duration: 250}
    });
    
    this.bound = {
      scroll: (function(){
        if (!this.el) this.destroy();
        else this.el.center();
      }).bind(this),
      keyesc: (function(e){
        if (e.key == 'esc') {
          e.stopPropagation();
          this.fireEvent('close').destroy()
        };
      }).bind(this)
    };
    
    this.show();
  },
  
  show: function(){
    this.overlay.show();
    var self = this.fireEvent('open');
    this.el.setStyle('display', 'block').inject(document.body).center().fade(1).get('tween').chain(function(){
      var button = this.element.getElement('button.dialog-confirm') || this.element.getElement('button');
      if (button) button.focus();
      self.fireEvent('show');
    });
    
    document.addEvents({
      'scroll': this.bound.scroll,
      'resize': this.bound.scroll,
      'keyup': this.bound.keyesc
    });
  },
  
  destroy: function() {    
    if (this.el)
      this.el.fade(0).get('tween').chain((function(){
        this.overlay.destroy();
        this.el.destroy();
      }).bind(this));
      
      document.removeEvent('scroll', this.bound.scroll).removeEvent('resize', this.bound.scroll).removeEvent('keyup', this.bound.keyesc);
  }
  
});

this.Overlay = new Class({
  
  initialize: function(options){
    this.el = new Element('div', Object.append({
      'class': 'overlay'
    }, options)).inject(document.body);
  },
  
  show: function(){
    this.objects = $$('object, select, embed').filter(function(el){
      return el.id == 'SwiffFileManagerUpload' || el.style.visibility == 'hidden' ? false : !!(el.style.visibility = 'hidden');
    });
    
    this.resize = (function(){
      if (!this.el) this.destroy();
      else this.el.setStyles({
        width: document.getScrollWidth(),
        height: document.getScrollHeight()
      });
    }).bind(this);
    
    this.resize();
    
    this.el.setStyles({
      opacity: 0,
      display: 'block'
    }).get('tween').pause().start('opacity', 0.5);
    
    window.addEvent('resize', this.resize);
    
    return this;
  },
  
  hide: function(){
    this.el.fade(0).get('tween').chain((function(){
      this.revertObjects();
      this.el.setStyle('display', 'none');
    }).bind(this));
    
    window.removeEvent('resize', this.resize);
    
    return this;
  },
  
  destroy: function(){
    this.revertObjects().el.destroy();
  },
  
  revertObjects: function(){
    if (this.objects && this.objects.length)
      this.objects.each(function(el){
        el.style.visibility = 'visible';  
      });
    
    return this;
  }
  
});

})();