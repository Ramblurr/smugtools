function TrelloClipboard() {
    var me = this;

    var utils = {
        nodeName: function (node, name) {
            return !!(node.nodeName.toLowerCase() === name)
        }
    }
    var textareaId = 'simulate-trello-clipboard',
    containerId = textareaId + '-container',
    container, textarea

    var createTextarea = function () {
        container = document.querySelector('#' + containerId)
        if (!container) {
            container = document.createElement('div')
            container.id = containerId
            container.setAttribute('style', [, 'position: fixed;', 'left: 0px;', 'top: 0px;', 'width: 0px;', 'height: 0px;', 'z-index: 100;', 'opacity: 0;'].join(''))
            document.body.appendChild(container)
        }
        container.style.display = 'block'
        textarea = document.createElement('textarea')
        textarea.setAttribute('style', [, 'width: 1px;', 'height: 1px;', 'padding: 0px;'].join(''))
        textarea.id = textareaId
        container.innerHTML = ''
        container.appendChild(textarea)

        textarea.appendChild(document.createTextNode(me.value))
        textarea.focus()
        textarea.select()
    }

    var keyDonwMonitor = function (e) {
        var code = e.keyCode || e.which;
        if (!(e.ctrlKey || e.metaKey)) {
            return
        }
        var target = e.target
        if (utils.nodeName(target, 'textarea') || utils.nodeName(target, 'input')) {
            return
        }
        if (window.getSelection && window.getSelection() && window.getSelection().toString()) {
            return
        }
        if (document.selection && document.selection.createRange().text) {
            return
        }
        setTimeout(createTextarea, 0)
    }

    var keyUpMonitor = function (e) {
        var code = e.keyCode || e.which;
        if (e.target.id !== textareaId) {
            return
        }
        container.style.display = 'none'
    }

    document.addEventListener('keydown', keyDonwMonitor)
    document.addEventListener('keyup', keyUpMonitor)
}

TrelloClipboard.prototype.setValue = function (value) {
    this.value = value;
}

var clip = new TrelloClipboard();

function clipboard() {
    clip.setValue($('#code')[0].innerText);
}

function sort_key_desc(array, key) {
    return array.sort(function(a, b) {
        var x = a[key], y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}

var escapeHTML = function(html) {
    return html.replace(/[<>]/g, function(m) { return {'<':'&lt;','>':'&gt;'}[m]});
}

var parseBreakpoints = function() {
    var widths = [];
    $('#breakPointList li').each(function(key, item) {
        widths.push({'width': $(item).data('width'), 'unit':$(item).data('unit')});
    });
    widths = sort_key_desc(widths, 'width');
    return widths;
}

var emToPx = function(baseSize, ems) {
    return ems*baseSize;
}

var smug_url_re = /(http:\/\/.*\/0)(\/(?:L|M|S|XL)\/)(.*)(-(?:L|M|S|XL))(.jpg)/;
var getSmugUrl= function(baseUrl, width, density) {
    var templ = '$1/{W}x{W}/$3-{W}$5';
    var src_url = baseUrl.replace(smug_url_re, templ.replace(/\{W\}/g, width));
    return src_url + ' ' + density;
}


var updatePicture = function() {
    var widths = parseBreakpoints();
    var url = $('#inputPhoto').val();
    var embed_code = '';
    var sep = '\n  ';
    var captionText= $.trim($('#inputCaption').val());
    var doCaption = captionText.length > 0;

    if( url.match(smug_url_re) == null ) {
        $('#urlError').removeClass('hide');
        return;
    } else
        $('#urlError').addClass('hide');
    if( doCaption ) {
        embed_code += '<figure class="wp-caption aligncenter">\n';
    }
    embed_code += '<picture>';
    embed_code += sep+'<!--[if IE 9]><video style="display: none;"><![endif]-->';
    var picture = $('<picture>');
    var sizes = ['S', 'M', 'L', 'XL'];
    var img = '';
    for(var i = 0; i < widths.length;i++) {
        var size = sizes.pop();
        var w  = widths[i]['width'];
        var w_px = w;
        var unit  = widths[i]['unit'];

        if( unit == 'em' ) {
            w_px = emToPx(16, w);
        }

        var srcsets = [ getSmugUrl(url, w_px, '1x'), getSmugUrl(url, w_px*2, '2x')];
        var srcset = srcsets.join(', ');
        var width = w+unit;
        var sourcetag = $('<source>', { 'srcset':srcset, 'media':'(min-width:'+width+')'});
        embed_code += sep+sourcetag[0].outerHTML;
        picture.append(sourcetag);
        img = $('<img>', {'srcset':srcset}); // set to smallest during last iter
    };
    embed_code += sep+'<!--[if IE 9]></video><![endif]-->';
    embed_code += sep+img[0].outerHTML;
    embed_code += '\n</picture>';
    if( doCaption ) {
        embed_code += '\n<figcaption>{C}</figcaption>';
        embed_code = embed_code.replace('{C}', captionText);
        embed_code += '\n</figure>';
    }
    picture.append(img);
    //embed_code = embed_code.replace(/(\r\n|\n|\r)/gm,"");
    $('#code').empty().append(escapeHTML(embed_code)+'\n');
    $('#picturePreview').empty().append(picture);
    $('#code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
    $('#picturePreview img').addClass('center-block');
    picturefill();
    clipboard();
}

var deleteBreakpoint = function(event) {
    $(event.target).parent().remove();
    updatePicture();
};

var addBreakpoint = function(width, unit) {
    var combined = width + unit;
    if( width.length == 0)
        return;
    var but = $('<button>', {class:'inputRemove btn btn-sm btn-danger'});
    var i = $('<i>', {class:'glyphicon glyphicon-remove'});
    var li = $('<li>', {class:'list-group-item', 'data-width': width, 'data-unit':unit});
    but.append(i);
    li.append(but);
    li.append(combined);
    $('#breakPointList').append(li);
    $('button.inputRemove').click(deleteBreakpoint);
    updatePicture();
}

$('#inputClear').click(function() {
    $('#breakPointList').empty();
    updatePicture();
});

$('#inputAdd').click(function() {
    var unit = $("#inputUnit").val();
    var breakp = $.trim($("#inputBreakpoint").val());
    addBreakpoint(breakp, unit);
});

$('#formSmug  :input').change(function() {updatePicture();
});


/*
addBreakpoint(800, 'px');
addBreakpoint(640, 'px');
addBreakpoint(480, 'px');
addBreakpoint(320, 'px');
*/

/*
addBreakpoint(1024, 'px');
addBreakpoint(860, 'px');
addBreakpoint(640, 'px');
addBreakpoint(480, 'px');
*/

addBreakpoint(64, 'em');
addBreakpoint(40, 'em');
addBreakpoint(30, 'em');


updatePicture();

$('#code').tooltip();
