$(document).ready(function () {
  $('#gameDiv').hide();
  $('.modal-trigger').leanModal();
  $('.tooltipped').tooltip({ delay: 50 });
});

var socket = io({
  transports: ['websocket', 'polling'],
  forceNew: true,
  timeout: 10000,
  reconnection: true,
  reconnectionAttempts: 10
});
var gameInfo = null;

socket.on('playerDisconnected', function (data) {
  Materialize.toast(data.player + ' 润了润了~ 🏃‍♂️💨', 4000);
});

socket.on('hostRoom', function (data) {
  if (data != undefined) {
    if (data.players.length >= 11) {
      $('#hostModalContent').html(
        '<h5>房间码:</h5><code>' +
          data.code +
          '</code><br /><h5>警告: 人也太多了吧！最多11人哦~</h5><h5>已在房间的玩家</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
        })
      );
    } else if (data.players.length > 1) {
      $('#hostModalContent').html(
        '<h5>房间码:</h5><code>' +
          data.code +
          '</code><br /><h5>已在房间的玩家</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
        })
      );
      $('#startGameArea').html(
        '<br /><button onclick=startGame(' +
          data.code +
          ') type="submit" class= "waves-effect waves-light green darken-3 white-text btn-flat">开整！冲冲冲 🚀</button >'
      );
    } else {
      $('#hostModalContent').html(
        '<h5>房间码:</h5><code>' +
          data.code +
          '</code><br /><h5>已在房间的玩家</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
        })
      );
    }
  } else {
    Materialize.toast(
      '昵称要填啊！（最多12个字符哦~）',
      4000
    );
    $('#joinButton').removeClass('disabled');
  }
});

socket.on('hostRoomUpdate', function (data) {
  $('#playersNames').html(
    data.players.map(function (p) {
      return '<span>' + p + '</span><br />';
    })
  );
  if (data.players.length == 1) {
    $('#startGameArea').empty();
  }
});

socket.on('joinRoomUpdate', function (data) {
  $('#startGameAreaDisconnectSituation').html(
    '<br /><button onclick=startGame(' +
      data.code +
      ') type="submit" class= "waves-effect waves-light green darken-3 white-text btn-flat">开整！冲冲冲 🚀</button >'
  );
  $('#joinModalContent').html(
    '<h5>' +
      data.host +
      "的房间</h5><hr /><h5>已在房间的玩家</h5><p>你现在是老大了，可以开始游戏啦！</p>"
  );

  $('#playersNamesJoined').html(
    data.players.map(function (p) {
      return '<span>' + p + '</span><br />';
    })
  );
});

socket.on('joinRoom', function (data) {
  if (data == undefined) {
    $('#joinModal').closeModal();
    Materialize.toast(
      "昵称和房间码要对才行！（昵称最多12个字符，不能和别人撞名~）",
      4000
    );
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else {
    $('#joinModalContent').html(
      '<h5>' +
        data.host +
        "的房间</h5><hr /><h5>已在房间的玩家</h5><p>等房主开始游戏哦~离开页面、刷新或返回会掉线的！</p>"
    );
    $('#playersNamesJoined').html(
      data.players.map(function (p) {
        return '<span>' + p + '</span><br />';
      })
    );
  }
});

socket.on('dealt', function (data) {
  $('#mycards').html(
    data.cards.map(function (c) {
      return renderCard(c);
    })
  );
  $('#usernamesCards').text(data.username + ' - 我的牌 🃏');
  $('#mainContent').remove();
});

socket.on('rerender', function (data) {
  if (data.myBet == 0) {
    $('#usernamesCards').text(data.username + ' - 我的牌 🃏');
  } else {
    $('#usernamesCards').text(data.username + ' - 下注: ￥' + data.myBet + ' 💰');
  }
  if (data.community != undefined)
    $('#communityCards').html(
      data.community.map(function (c) {
        return renderCard(c);
      })
    );
  else $('#communityCards').html('<p></p>');
  if (data.currBet == undefined) data.currBet = 0;
  
  // 翻译游戏阶段名称
  let stageInChinese = data.stage;
  if (data.stage === 'Pre-Flop') stageInChinese = '翻牌前 🎯';
  else if (data.stage === 'Flop') stageInChinese = '翻牌 🎴';
  else if (data.stage === 'Turn') stageInChinese = '转牌 🔄';
  else if (data.stage === 'River') stageInChinese = '河牌 🌊';
  
  $('#table-title').text(
    '第' +
      data.round +
      '局 | ' +
      stageInChinese +
      ' | 最高注: ￥' +
      data.topBet +
      ' | 奖池: ￥' +
      data.pot + ' 💸'
  );
  $('#opponentCards').html(
    data.players.map(function (p) {
      return renderOpponent(p.username, {
        text: p.status,
        money: p.money,
        blind: p.blind,
        bets: data.bets,
        buyIns: p.buyIns,
        isChecked: p.isChecked,
      });
    })
  );
  renderSelf({
    money: data.myMoney,
    text: data.myStatus,
    blind: data.myBlind,
    bets: data.bets,
    buyIns: data.buyIns,
  });
  if (!data.roundInProgress) {
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
  }
});

socket.on('gameBegin', function (data) {
  $('#navbar-ptwu').hide();
  $('#joinModal').closeModal();
  $('#hostModal').closeModal();
  if (data == undefined) {
    alert('啊哦，游戏出错了 😱');
  } else {
    $('#gameDiv').show();
  }
});

function playNext() {
  socket.emit('startNextRound', {});
}

socket.on('reveal', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();
  $('#opponentCards').html(
    data.endInfo.map(function (p) {
      if (p.win == true) {
        Materialize.toast(p.player + ' 赢得了这一局！🎉', 4000);
        return renderOpponentCards(p.player, {
          folded: p.fold,
          cards: p.cards,
          money: p.money,
          endHand: p.handText.replace('High Card', '高牌')
                            .replace('One Pair', '一对')
                            .replace('Two Pair', '两对')
                            .replace('Three of a Kind', '三条')
                            .replace('Straight', '顺子')
                            .replace('Flush', '同花')
                            .replace('Full House', '葫芦')
                            .replace('Four of a Kind', '四条')
                            .replace('Straight Flush', '同花顺')
                            .replace('Royal Flush', '皇家同花顺'),
          bets: data.bets,
          buyIns: p.buyIns,
        });
      } else {
        return renderOpponentCards(p.player, {
          folded: p.fold,
          cards: p.cards,
          money: p.money,
          endHand: p.handText.replace('High Card', '高牌')
                            .replace('One Pair', '一对')
                            .replace('Two Pair', '两对')
                            .replace('Three of a Kind', '三条')
                            .replace('Straight', '顺子')
                            .replace('Flush', '同花')
                            .replace('Full House', '葫芦')
                            .replace('Four of a Kind', '四条')
                            .replace('Straight Flush', '同花顺')
                            .replace('Royal Flush', '皇家同花顺'),
          bets: data.bets,
          buyIns: p.buyIns,
        });
      }
    })
  );
  if (data.selfInfo.win) {
    Materialize.toast('恭喜发财！这把是你的了！🎉', 4000);
  }
  $('#playNext').html(
    '<br /><button onClick=playNext() id="playNextButton" class="btn white black-text">下一局 👉</button>'
  );
});

socket.on('endHand', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();
  $('#table-title').text(data.winner + ' takes the pot of $' + data.pot);
  $('#playNext').html(
    '<button onClick=playNext() id="playNextButton" class="btn white black-text menuButtons">Start Next Game</button>'
  );
  $('#blindStatus').text('');
  if (data.folded == 'Fold') {
    $('#status').text('You Folded');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').addClass('grey');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
  }
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponent(p.username, {
        text: p.text,
        money: p.money,
        blind: '',
        bets: data.bets,
      });
    })
  );
});

var beginHost = function () {
  if ($('#hostName-field').val() == '') {
    $('.toast').hide();
    $('#hostModal').closeModal();
    Materialize.toast(
      '请输入有效的昵称！(昵称最长12个字符)',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else {
    socket.emit('host', { username: $('#hostName-field').val() });
    $('#joinButton').addClass('disabled');
    $('#joinButton').off('click');
  }
};

var joinRoom = function () {
  // yes, i know this is client-side.
  if (
    $('#joinName-field').val() == '' ||
    $('#code-field').val() == '' ||
    $('#joinName-field').val().length > 12
  ) {
    $('.toast').hide();
    Materialize.toast(
      '请输入有效的昵称和房间码！(昵称最长12个字符，且不能与其他玩家重复)',
      4000
    );
    $('#joinModal').closeModal();
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else {
    socket.emit('join', {
      code: $('#code-field').val(),
      username: $('#joinName-field').val(),
    });
    $('#hostButton').addClass('disabled');
    $('#hostButton').off('click');
  }
};

var startGame = function (gameCode) {
  socket.emit('startGame', { code: gameCode });
};

var fold = function () {
  socket.emit('moveMade', { move: 'fold', bet: 'Fold' });
};

var bet = function () {
  if (parseInt($('#betRangeSlider').val()) == 0) {
    Materialize.toast('下0是不行的哦，多来点！💰', 4000);
  } else if (parseInt($('#betRangeSlider').val()) < 2) {
    Materialize.toast('最少下￥2才行！别抠抠搜搜的～', 4000);
  } else {
    socket.emit('moveMade', {
      move: 'bet',
      bet: parseInt($('#betRangeSlider').val()),
    });
  }
};

function call() {
  socket.emit('moveMade', { move: 'call', bet: 'Call' });
}

var check = function () {
  socket.emit('moveMade', { move: 'check', bet: 'Check' });
};

var raise = function () {
  if (
    parseInt($('#raiseRangeSlider').val()) == $('#raiseRangeSlider').prop('min')
  ) {
    Materialize.toast(
      '加注必须高于当前最高注！别怂！💪',
      4000
    );
  } else {
    socket.emit('moveMade', {
      move: 'raise',
      bet: parseInt($('#raiseRangeSlider').val()),
    });
  }
};

function renderCard(card) {
  if (card.suit == '♠' || card.suit == '♣')
    return (
      '<div class="playingCard_black" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
  else
    return (
      '<div class="playingCard_red" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
}

function renderOpponent(name, data) {
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1];
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  
  // 翻译盲注状态
  let blindText = data.blind;
  if (data.blind === 'Big Blind') blindText = '大盲注';
  else if (data.blind === 'Small Blind') blindText = '小盲注';
  else if (data.blind === 'Dealer') blindText = '庄家';
  
  var buyInsText =
    data.buyIns > 0 ? (data.buyIns > 1 ? '次买入' : '次买入') : '';
  if (data.buyIns > 0) {
    if (data.text == 'Fold') {
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey"><div class="card-content white-text"><span class="card-title">' +
        name +
        ' (弃牌)</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
        blindText +
        '<br />' +
        (data.text == 'Fold' ? '弃牌' : data.text) +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText +
        ')' +
        '</div></div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '<br />让牌</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            '轮到他了' +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            '轮到他了' +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '<br />下注: ￥' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br /><br />' +
            '轮到他了' +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '<br />让牌</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            (data.text == 'Fold' ? '弃牌' : (data.text == 'Their Turn' ? '轮到他了' : '等待中')) +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            '轮到他了' +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '<br />下注: ￥' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            '轮到他了' +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        }
      }
    }
  }
  // buy-ins rendering
  else {
    if (data.text == 'Fold') {
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey"><div class="card-content white-text"><span class="card-title">' +
        name +
        ' (弃牌)</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
        blindText +
        '<br />' +
        data.text +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        '</div></div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '<br />让牌</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '<br />下注: ￥' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br /><br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '<br />让牌</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
            name +
            '<br />下注: ￥' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            blindText +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
            data.money +
            '</div></div></div>'
          );
        }
      }
    }
  }
}

function renderOpponentCards(name, data) {
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1].reverse();
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  var buyInsText2 =
    data.buyIns > 0 ? (data.buyIns > 1 ? '次买入' : '次买入') : '';
  if (data.buyIns > 0) {
    if (data.folded)
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey" ><div class="card-content white-text"><span class="card-title">' +
        name +
        ' | 下注: ￥' +
        bet +
        '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText2 +
        ')' +
        '</div></div></div>'
      );
    else
      return (
        '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
        name +
        ' | 下注: ￥' +
        bet +
        '</span><p><div class="center-align"> ' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div><br /><br /><br /><br /><br />' +
        data.endHand +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText2 +
        ')' +
        '</div></div></div>'
      );
  } else {
    if (data.folded)
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey" ><div class="card-content white-text"><span class="card-title">' +
        name +
        ' | 下注: ￥' +
        bet +
        '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        '</div></div></div>'
      );
    else
      return (
        '<div class="col s12 m2 opponentCard"><div class="card green darken-2" ><div class="card-content white-text"><span class="card-title">' +
        name +
        ' | 下注: ￥' +
        bet +
        '</span><p><div class="center-align"> ' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div><br /><br /><br /><br /><br />' +
        data.endHand +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">￥' +
        data.money +
        '</div></div></div>'
      );
  }
}

function renderOpponentCard(card) {
  if (card.suit == '♠' || card.suit == '♣')
    return (
      '<div class="playingCard_black_opponent" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
  else
    return (
      '<div class="playingCard_red_opponent" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
}

function updateBetDisplay() {
  if ($('#betRangeSlider').val() == $('#usernamesMoney').text()) {
    $('#betDisplay').html(
      '<h3 class="center-align">全下 ￥' +
        $('#betRangeSlider').val() +
        '</h36>'
    );
  } else {
    $('#betDisplay').html(
      '<h3 class="center-align">￥' + $('#betRangeSlider').val() + '</h36>'
    );
  }
}

function updateBetModal() {
  $('#betDisplay').html('<h3 class="center-align">￥0</h3>');
  document.getElementById('betRangeSlider').value = 0;
  var usernamesMoneyStr = $('#usernamesMoney').text().replace('￥', '');
  var usernamesMoneyNum = parseInt(usernamesMoneyStr);
  $('#betRangeSlider').attr({
    max: usernamesMoneyNum,
    min: 0,
  });
}

function updateRaiseDisplay() {
  $('#raiseDisplay').html(
    '<h3 class="center-align">加注至 ￥' +
      $('#raiseRangeSlider').val() +
      '</h3>'
  );
}

socket.on('updateRaiseModal', function (data) {
  $('#raiseRangeSlider').attr({
    max: data.usernameMoney,
    min: data.topBet,
  });
});

function updateRaiseModal() {
  document.getElementById('raiseRangeSlider').value = 0;
  socket.emit('raiseModalData', {});
}

socket.on('displayPossibleMoves', function (data) {
  if (data.fold == 'yes') $('#usernameFold').show();
  else $('#usernameHide').hide();
  if (data.check == 'yes') $('#usernameCheck').show();
  else $('#usernameCheck').hide();
  if (data.bet == 'yes') $('#usernameBet').show();
  else $('#usernameBet').hide();
  if (data.call != 'no' || data.call == 'all-in') {
    $('#usernameCall').show();
    if (data.call == 'all-in') $('#usernameCall').text('全下跟注');
    else $('#usernameCall').text('跟注 ￥' + data.call);
  } else $('#usernameCall').hide();
  if (data.raise == 'yes') $('#usernameRaise').show();
  else $('#usernameRaise').hide();
});

function renderSelf(data) {
  $('#playNext').empty();
  $('#usernamesMoney').text('￥' + data.money);
  if (data.text == 'Their Turn') {
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').addClass('yellow');
    $('#playerInformationCard').addClass('darken-2');
    $('#usernamesCards').removeClass('white-text');
    $('#usernamesCards').addClass('black-text');
    $('#status').text('轮到我了');
    Materialize.toast('轮到你了，快点行动！', 4000);
    socket.emit('evaluatePossibleMoves', {});
  } else if (data.text == 'Fold') {
    $('#status').text('你已弃牌');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('grey');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    Materialize.toast('你选择了弃牌，下一局再战！', 3000);
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
  } else {
    $('#status').text('');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('green');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
  }
  
  // 翻译盲注状态
  let blindText = data.blind;
  if (data.blind === 'Big Blind') blindText = '大盲注';
  else if (data.blind === 'Small Blind') blindText = '小盲注';
  else if (data.blind === 'Dealer') blindText = '庄家';
  
  $('#blindStatus').text(blindText);
}
