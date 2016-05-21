// ==UserScript==
// @name         sweepy
// @namespace    http://tweakfix.wordpress.com
// @version      0.1.0a
// @description  BitSweep bot for bit-exo.com!
// @author       HalfMoon
// @match        https://bit-exo.com/
// @grant        none
// ==/UserScript==
var v = '0.1.0a';
var sweepy = sweepy || {
}; // declare sweepy as object
(function ($) { // $ forces jQuery into our function (jQuery is already on site, no need to include)
  sweepy.bot = {
    load: function () {
      /************************************************************
			** variables and settings
			************************************************************/
      var config = {
        baseBet: 0.01, // in bits
        minBomb: 1,
        maxBomb: 25,
        setBomb: 15, // set bomb amount
        tapBomb: 1, // how many to click
        edge: 0.8,
      };
      var stats = {
        wins: 0,
        loss: 0,
        cash: 0, // profit (hopefully)
        balance: 0
      };
      var nextWager = 0;
      var block = 0;
      var checkBet = 0;
      var clickBet = 0;
      var start = 0;
      /************************************************************
			** display gui
			************************************************************/
      $('body').append('<div class="sweepy"></div>');
      $('.sweepy').html(updateGUI()); // load html from updateGUI() function below
      $('.sweepy').css({ // set css to make things pretty
        position: 'fixed',
        background: '#bec3c7',
        border: '1px solid white',
        color: '#2d3e50',
        fontSize: '85%',
        textAlign: 'right',
        height: 'auto', // allows box to grow to fit content
        width: '175px',
        padding: '2px',
        top: '10px',
        right: '10px'
      });
      function updateGUI() {
        var gui = '' +
        '<div style="float: left;"><label>sweepy</label> <small>v' + v + ' (by: HalfMoon)</small></div>' +
        '<div><label>base wager</label> : <input class="sweepyBase" type="number" value="' + config.baseBet + '" min="0.01" step="0.01" style="width: 75px; padding: 0; text-align: center;"> bits</div>' +
        '<button class="double">X2</button>'+ '<button class="half">/2</button>'+
        '<div ><label># of bombs</label> : <input class="sweepyBomb" type="number" value="' + config.setBomb + '" min="1" max="24" step="1" style="width: 50px; padding: 0; text-align: center;"></div>' +
        '<div><label># to sweep</label> : <input class="sweepyTaps" type="number" value="' + config.tapBomb + '" min="1" max="24" step="1" style="width: 50px; padding: 0; text-align: center;"></div>' +
        '<div><label>house edge</label> : <input class="sweepyEdge" type="number" value="' + config.edge + '" min="0.8" max="5.0" step="0.1" style="width: 50px; padding: 0; text-align: center;"></div>' +
        '<div><label>wins</label> : <span class="wins">' + stats.wins + '</span> | <label>losses</label> : <span class="loss">' + stats.loss + '</span></div>' +
        '<div><label>cash</label> : <span class="balance">' + stats.balance + '</span> | <label>profit</label> : <span class="profit">' + stats.cash + '</span></div>' +
        '<button class="startMining">start</button>';
        return gui;
      } /************************************************************
			** setting handler
			************************************************************/

      $('.sweepyBase, .sweepyBomb, .sweepyTaps, .sweepyEdge').change(function () {
        updateSettings();
      });
      function updateSettings() {
        config.baseBet = $('.sweepyBase').val();
        if (worldStore.state.coin_type === 'BTC') { // site says btc
          var wager = (config.baseBet / 1000000).toFixed(8);
          Dispatcher.sendAction('UPDATE_WAGER', {
            str: wager.toString()
          });
        } else { // site says bits
          Dispatcher.sendAction('UPDATE_WAGER', {
            str: config.baseBet.toString()
          });
        }
        config.setBomb = $('.sweepyBomb').val();
        Dispatcher.sendAction('SET_BOMBSELECT', config.setBomb);
        config.tapBomb = $('.sweepyTaps').val();
        config.edge = $('.sweepyEdge').val();
        setEdge(config.edge);
        updateGUI();
      } /************************************************************
			** bot functions
			************************************************************/

      function setEdge(edge) {
        do {
          if (Number($('.bot_edge').text().replace('%', '')) < edge) {
            Dispatcher.sendAction('INC_HOUSE_EDGE');
          } else {
            Dispatcher.sendAction('DEC_HOUSE_EDGE');
          }
        } 
        while (Number($('.bot_edge').text().replace('%', '')) != edge);
      }
      function setPage() {
        Dispatcher.sendAction('CHANGE_GAME_TAB', 'BITSWEEP');
        start = 1;
      }
      function stopIt(){
        if($('.sweepyBase').val<stats.balance){
          clearTimeout(clickBet);
            clearTimeout(checkBet);
          alert("No more money!");
        }
      }
      function madClicker(time) {
        if (start == 1) {
          setTimeout(function () {
            madclick(1);
          }, 500);
        } 
        else {
          madclick(1);
        }
        function madclick(i) {
          console.log('Click', i);
          $('.bs-hide.' + i).children('.BS_BTN').click();
          checkBet = setTimeout(check, time, i);
        }
        function check(i) {
          console.log('Check', i);
          if (worldStore.state.bets.data[worldStore.state.bets.end].profit > 0 && i < config.tapBomb) {
            i++;
            console.log('Increment i');
            stats.cash += Math.round(worldStore.state.bets.data[worldStore.state.bets.end].profit) / 100;
            Number((stats.cash).toFixed(2));
            clickBet = setTimeout(madclick, time, i);
          } else if (worldStore.state.bets.data[worldStore.state.bets.end].profit < 0) {
            console.log('tile number ' + i + ' Loss');
            getProfit();
            $('.profit').text(stats.cash);
            stats.loss++;
            $('.loss').text(stats.loss);
            getBalance();
            $('.balance').text(stats.balance);
            console.log('Number of losses are ' + stats.loss);
            setTimeout(function () {
              $('#BS-START').click();
            }, 200);
            botSweep();
          } 
          else if (i >= config.tapBomb) {
            console.log('We Won');
            stats.wins++;
            getProfit();
            $('.profit').text(stats.cash);
            $('.wins').text(stats.wins);
            console.log('Number of wins are ' + stats.wins);
            getBalance();
            $('.balance').text(stats.balance);
            $('#BS-START').click();
            $('#BS-START').click();
            botSweep();
          } 
          else {
            console.log('Exit Backup');
            clearTimeout(clickBet);
            clearTimeout(checkBet);
          }
        }
      }
      function getBalance() {
        stats.balance = $('span[data-reactid=".0.0.0.2.0.1.0"]').text().replace('BTC', '');
        stats.balance = stats.balance * 1000000;
        Number((stats.balance).toFixed(2));
        return stats.balance
      }
      function getProfit() {
        stats.cash += Math.round(worldStore.state.bets.data[worldStore.state.bets.end].profit) / 100;
        Number(stats.cash).toFixed(2);
        return stats.cash;
      }

      function botSweep() {
        // loop through tiles - click the first available tile
        clearTimeout(clickBet);
        clearTimeout(checkBet);
        if (block == 0) {
          madClicker(2000);
        } 
        else if (block == 1 || stats.balance < config.baseBet) {
          console.log('Blocked');
          clearTimeout(clickBet);
        } 
        
        else {
          console.log('Emergency Start');
          madClicker(2000);
        }
      }
      $('.double').click(function(){
        config.baseBet=config.baseBet*2;
        $('.sweepyBase').val(config.baseBet);
        updateGUI();
      });
      $('.half').click(function(){
        config.baseBet=config.baseBet/2;
        $('.sweepyBase').val(config.baseBet);
        updateGUI();
      });
      $('.startMining').click(function () {
        if ($('.startMining').text() == 'start') {
          $('.startMining').text('stop');
          // make sure all settings are set on site
          updateSettings();
          // click start game
          block = 0;
          setPage();
          getBalance();
          updateSettings();
          $('#BS-START').click();
          botSweep();
        } else {
          $('.startMining').text('start');
          console.log('Blocking');
          block = 1;
          clearTimeout(clickBet);
        }
      });
    }
  };
}) (jQuery);
new sweepy.bot.load();