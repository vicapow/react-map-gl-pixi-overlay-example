'use strict';

var React = require('react');
var window = require('global/window');
var r = require('r-dom');
var PIXI = require('pixi.js');
var browser = require('bowser');
var ViewportMercator = require('viewport-mercator-project');
var prefix = browser.webkit ? '-webkit-' : browser.gecko ? '-moz-' : '';

module.exports = React.createClass({

  displayName: 'Overlay',

  propTypes: {
    locations: React.PropTypes.array.isRequired,
    width: React.PropTypes.number.isRequired,
    height: React.PropTypes.number.isRequired,
    longitude: React.PropTypes.number.isRequired,
    latitude: React.PropTypes.number.isRequired,
    zoom: React.PropTypes.number.isRequired,
    isDragging: React.PropTypes.bool.isRequired,
    lngLatAccessor: React.PropTypes.func.isRequired,
    keyAccessor: React.PropTypes.func.isRequired,
    sizeAccessor: React.PropTypes.func.isRequired
  },

  getDefaultProps: function getDefaultProps() {
    return {
      lngLatAccessor: function lngLatAccessor(location) {
        return [location.longitude, location.latitude];
      },
      keyAccessor: function keyAccessor(location) {
        return String(location.id);
      },
      sizeAccessor: function sizeAccessor(location) {
        return location.size;
      },
      locations: []
    };
  },

  _createPIXIRenderer: function _createPIXIRenderer() {
    return new PIXI.WebGLRenderer(this.props.width, this.props.height, {
      antialias: true,
      transparent: true,
      resolution: window.devicePixelRatio || 1,
      view: this.refs.overlay
    });
  },

  componentDidMount: function componentDidMount() {
    this._renderer = this._createPIXIRenderer();
    this._stage = new PIXI.Container();
    this._locationsContainer = new PIXI.Container();
    this._stage.addChild(this._locationsContainer);
    this._locations = [];
    this._updateScene();
    this._redraw();
  },

  componentWillReceiveProps: function componentWillReceiveProps(newProps) {
    if (newProps !== this.props.location) {
      this._locationsDirty = true;
    }
  },

  componentDidUpdate: function componentDidUpdate() {
    if (this._locationsDirty) {
      this._updateScene();
    }
    this._locationsDirty = false;
    this._redraw();
  },

  _updateScene: function _updateScene() {
    var added = [];
    var incomingHash = {};
    if (this.props.locations) {
      added = this.props.locations.filter(function filter(location) {
        var key = this.props.keyAccessor(location);
        incomingHash[key] = true;
        return !this._locations[key];
      }.bind(this));
    }

    var removed = Object.keys(this._locations).filter(function filter(key) {
      return !incomingHash[key];
    });

    added.forEach(function each(location) {
      var graphics = new PIXI.Graphics();
      graphics.beginFill(0xff00ff, 0.2);
      graphics.drawCircle(0, 0, this.props.sizeAccessor(location));
      graphics.endFill();
      var node = new PIXI.Container();
      node.addChild(graphics);
      node._data = location;
      this._locationsContainer.addChild(node);
      var key = this.props.keyAccessor(location);
      this._locations[key] = node;
    }.bind(this));
    removed.forEach(function each(node, key) {
      this._stage.locations.removeChild(node);
      delete this._locations[key];
    }.bind(this));

    this._locationsDirty = false;
  },

  _redraw: function _redraw() {
    var mercator = ViewportMercator(this.props);
    this._renderer.resize(this.props.width, this.props.height);
    Object.keys(this._locations).forEach(function each(key) {
      var node = this._locations[key];
      var lngLat = this.props.lngLatAccessor(node._data);
      var pixel = mercator.project(lngLat);
      node.position.x = pixel[0];
      node.position.y = pixel[1];
    }.bind(this));
    this._renderer.render(this._stage);
  },

  render: function render() {
    var pixelRatio = window.devicePixelRatio;
    return r.canvas({
      ref: 'overlay',
      width: this.props.width * pixelRatio,
      height: this.props.height * pixelRatio,
      onMouseDown: this._onStartDrag,
      style: {
        width: this.props.width + 'px',
        height: this.props.height + 'px',
        position: 'absolute',
        pointerEvents: 'all',
        cursor: this.props.isDragging ? prefix + 'grabbing' : prefix + 'grab',
        left: 0,
        top: 0
      }
    });
  }
});
