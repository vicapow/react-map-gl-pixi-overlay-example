'use strict';

var document = require('global/document');
var Immutable = require('immutable');
var window = require('global/window');
var React = require('react');
var ReactDOM = require('react-dom');
var r = require('r-dom');
var MapGL = require('react-map-gl');
var Overlay = require('../src/overlay.react');
var Attribution = require('./attribution.react');
var assign = require('object-assign');
var rasterTileStyle = require('raster-tile-style');
var tileSource = '//tile.stamen.com/toner/{z}/{x}/{y}.png';
var mapStyle = rasterTileStyle([tileSource], 512);

var App = React.createClass({

  displayName: 'App',

  getInitialState: function getInitialState() {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        latitude: 37.7833,
        longitude: -122.4167,
        mapStyle: Immutable.fromJS(mapStyle),
        zoom: 11,
        isDragging: false
      }
    };
  },

  componentDidMount: function componentDidMount() {
    window.addEventListener('resize', function onResize() {
      this.setState({
        viewport: assign({}, this.state.viewport, {
          width: window.innerWidth,
          height: window.innerHeight
        })
      });
    }.bind(this));
    var data = [];
    var spread = 0.01;
    for (var i = 0; i < 5000; i++) {
      data.push({
        latitude: 37.7833 + Math.random() * spread - spread / 2,
        longitude: -122.4167 + Math.random() * spread - spread / 2,
        rotation: Math.random() * Math.PI * 2,
        id: 'id-' + i,
        size: Math.random() * 6 + 3
      });
    }
    this.setState({data: data});
    var loop = function _loop() {
      this.state.data.forEach(function each(datum) {
        var ll = [datum.longitude, datum.latitude];
        var diff = Math.random() * Math.PI / 5 - Math.PI / 10;
        datum.rotation += diff;
        var step = 0.0005;
        ll[0] += Math.sin(datum.rotation) * step;
        ll[1] += Math.cos(datum.rotation) * step;
        datum.longitude = ll[0];
        datum.latitude = ll[1];
      });
      this.forceUpdate();
      window.requestAnimationFrame(loop);
    }.bind(this);
    window.requestAnimationFrame(loop);
  },

  _onChangeViewport: function _onChangeViewport(viewport) {
    this.setState({viewport: assign({}, this.state.viewport, viewport)});
  },

  render: function render() {
    return r.div([
      r(MapGL, assign({}, this.state.viewport, {
        onChangeViewport: this._onChangeViewport
      }), [
        r(Overlay, assign({}, this.state.viewport, {
          locations: this.state.data
        }))
      ]),
      r(Attribution)
    ]);
  }
});
document.body.style.margin = 0;
var reactContainer = document.createElement('div');
document.body.appendChild(reactContainer);
ReactDOM.render(r(App), reactContainer);
