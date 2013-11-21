#!/usr/bin/env node

var Readable  = require('stream').Readable
var Websocket = require('ws')
var xtend     = require('xtend')
var inherits  = require('util').inherits


var defaultOptions = {
        currencies: ['USD', 'LTC']
      , ticker: true
      , depth: false
      , trade: false
      , lag: false
    }

function createStream(options) {
  return new MtGoxStream(options)
}

function MtGoxStream(options) {
  options = xtend(defaultOptions, options)

  Readable.call(this, { objectMode: true })

  var self = this
  var ws = null

  this._read = function () {
    if (ws) return

    var url = 'wss://websocket.mtgox.com'
    ws = new Websocket(url)

    ws.on('open', function() {
      console.log('connected to:', url)
      if (options.ticker){
          for (var i = 0; i < options.currencies.length; i++) {
              subscribe('ticker.BTC' + options.currencies[i])
          }
      }
      if (options.depth) {
          for (var i = 0; i < options.currencies.length; i++) {
              subscribe('ticker.BTC' + options.currencies[i])
          }
      }
      if (options.trade) subscribe('trade.BTC')
      if (options.lag) subscribe('trade.lag')
    })

    ws.on('message', function(data) {
      if (isValid(data)) output(data)
    })
  }

  function isValid(data) {
    try {
      var obj = JSON.parse(data)
      if (obj.channel && obj.channel_name) {
        if ('trade.BTC' !== obj.channel_name) {
          return true
        }
        return obj.trade.price_currency === options.currency
      }
    } catch (err) {
      console.log('invalid json data', data)
    }
    return false
  }

  function output(data) {
    self.push(data)
    self.push('\n')
  }

  function subscribe(channel) {
    console.log('subscribing to channel:', channel)
    ws.send(JSON.stringify({ op: 'mtgox.subscribe', channel: channel }))
  }
}

inherits(MtGoxStream, Readable)



createStream().on('data', function(data){
    try {
        console.log("currency: " + JSON.parse(data).ticker.buy['currency']);
        console.log(JSON.parse(data).ticker.buy['value']);
    } catch (err) {}
});