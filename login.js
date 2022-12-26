#!/usr/bin/gjs

imports.gi.versions.Gtk = '3.0';
imports.gi.versions.WebKit2 = '4.1';

const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const WebKit = imports.gi.WebKit2;Gtk
const Mainloop = imports.mainloop;

Gtk.init(null);

class WebBrowser extends Gtk.Application {
  constructor() {
    super({ application_id: 'OneDrive.login.WebBrowser' });

    this.inFile = `${GLib.get_tmp_dir()}/in`;
    this.outFile = `${GLib.get_tmp_dir()}/out`;

    this.connect('activate', () => this._onActivate());
    this.connect('startup', () => this._onStartup());
  }

  _onActivate() {
    this._window.present();

    GLib.spawn_command_line_async(
      `onedrive --auth-files ${this.inFile}:${this.outFile} --logout`
    );

    this.numeroTentativi = 0;
    this._attendiIn = Mainloop.timeout_add(500, this.startLogin.bind(this));
  }

  _onStartup() {
    this._buildUI();
    this._connectSignals();
  }

  _buildUI() {
    this._window = new Gtk.ApplicationWindow({
      application: this,
      window_position: Gtk.WindowPosition.CENTER,
      default_height: 768,
      default_width: 1024,
      border_width: 0,
      title: 'OneDrive login'
    });

    this._webView = new WebKit.WebView();

    const scrolledWindow = new Gtk.ScrolledWindow({
      hscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC
    });
    scrolledWindow.add(this._webView);

    const box = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      homogeneous: false,
      spacing: 0
    });

    box.pack_start(scrolledWindow, true, true, 0);
    this._window.add(box);
    this._window.show_all();
  }

  _connectSignals() {
    this._webView.connect('notify::title', () => {
      this._window.set_title(this._webView.title);
    });

    this._webView.connect('load_changed', (webView, loadEvent) => {
      if (loadEvent !== WebKit.LoadEvent.COMMITTED) {
        return;
      }
    });
  }

  startLogin() {
    if (this.numeroTentativi > 10) {
      console.log('Error in open file with uri');
      this.quit();
      return false;
    }
  
    let url = '';
    try {
      url = String(GLib.file_get_contents(this.inFile)[1]);
      this._homeUrl = url;
      this._webView.load_uri(this._homeUrl);
  
      this._attendiOut = Mainloop.timeout_add(500, this.endLogin.bind(this));
  
      return false;
    } catch (ex) {
      this.numeroTentativi++;
    }
  
    return true;
  }
  
  endLogin() {
    if (this._webView.get_uri().indexOf('code=') === -1) return true;
  
    let url = '';
    try {
      GLib.file_set_contents(this.outFile, this._webView.get_uri());
      Mainloop.timeout_add(1000, () => this.quit());
    } catch (ex) {
      console.log(ex.message);
    }
  
    return false;
  }
}