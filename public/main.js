$(function() {
  $('#subject')[0].focus();

  $('#add-form').on('keydown', '#verb', addMod);
  $('#verb').on('blur', transform);
  $('#add-form').submit(submitAdd);
  $('.delete-form').submit(submitDelete);
});

var modCount = 0;

function nextType(type) {
  return types[(types.indexOf(type) + 1) % types.length];
}

function addMod(e) {
  if ( e.which === 9 && !e.shiftKey ) {
    var last;
    var lastest;
    if ( modCount === 0 ) {
      last = $('#add-form');
      lastest = last.children('#verb');
    }
    else {
      last = $('#mod-' + (modCount - 1));
      lastest = last.children('#value-' + (modCount - 1));
    }

    // if ( modCount === 0 || $(this).attr('id') === 'value-' + (modCount-1) ) {
      $('#mods').append(createModLine(modCount));
      $('#mod-' + modCount).on('keydown', '#value-' + modCount, addMod);
      $('#value-' + modCount).on('blur', transform);
      modCount++;
      last.off('keydown');
    // }
  }
}

function transform(e) {
  $.post('/transform', {id: $(this).attr('id'), value: $(this).val()}, function(json) {
    $('#' + json.id).val(json.value);
  }, 'json');
}

function createModLine(modCount) {
  return '<div id="mod-' + modCount + '">' +
         createTag(modCount) +
         createValue(modCount) +
         '</div>\n';
}

function createTag(modCount) {
  var id = '"tag-' + modCount + '"'
  return '<input class="add-line tag" id=' + id +
         'type="text" name=' + id +
         ' placeholder="for" autocapitalize="none">\n';
}

function createValue(modCount) {
  var id = '"value-' + modCount + '"'
  return '<input class="add-line value" id=' + id +
         'type="text" name=' + id +
         ' placeholder="lulz" required autocapitalize="none">\n';
}

function submitAdd() {
  var raw = {};
  $('#add-form').serializeArray().forEach(function(elem) {
    raw[elem.name] = elem.value;
  });
  var mods = [];
  var i;
  for ( i = 0; ('tag-' + i) in raw; i++ ) {
    mods.push({
      tag:   raw['tag-' + i],
      value: raw['value-' + i]
    });
  }
  console.log(raw);
  var data = {
    subject: raw.subject,
    verb:    raw.verb,
    mods:    mods
  };

  $.post('/add', data, function(json) {
    console.log(json);
    location.reload(true);
  }, 'json');

  return false;
}

function submitDelete(e) {
  var uuid = $(this).children('.delete-uuid').val();

  $.post('/delete', {uuid: uuid}, function(json) {
    console.log(json);
    location.reload(true);
  }, 'json');

  return false;
}
