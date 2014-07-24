var SMUGMUG_API_KEY = 'm5ftsO41hLyfkGThVPjRFlk1LIIOIPUc';
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

var smug_url_re = /(http:\/\/.*\/\d)(\/(?:L|M|S|XL)\/)(.*)(-(?:L|M|S|XL))(.jpg)/;
var getSmugUrl= function(baseUrl, width, density) {
    var templ = '$1/{W}x{W}/$3-{W}$5';
    var src_url = baseUrl.replace(smug_url_re, templ.replace(/\{W\}/g, width));
    return src_url + ' ' + density;
}

var showError = function(error) {
    $('#urlError').text(error);
    $('#urlError').removeClass('hide');
    $('#loading-indicator').addClass('hide');
}

var clearError = function() {
    $('#urlError').addClass('hide');
}


var updatePicture = function() {
    clearError();
    var url = $('#inputPhoto').val();
    $('pre').addClass('hide');
    $('#loading-indicator').removeClass('hide');
    fetchSmugInfo(url);
};

var gotGallery = function(url, alb) {
    var widths = parseBreakpoints();
    var embed_code = '';
    var sep = '\n  ';
    var captionText= $.trim($('#inputCaption').val());
    var doCaption = captionText.length > 0;

    if( url.match(smug_url_re) == null ) {
        showError("<strong>Error</strong>: This isn't a supported SmugMug photo URL.");
        return;
    }

    if( doCaption ) {
        embed_code += '<figure class="wp-caption aligncenter">\n';
    }
    var anchor = $('<a>', {href: formatGalleryURL(alb)});
    embed_code += '<a href="'+formatGalleryURL(alb)+'">';
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
    picture.append(img);
    embed_code += sep+'<!--[if IE 9]></video><![endif]-->';
    embed_code += sep+img[0].outerHTML;
    embed_code += '\n</picture>';
    embed_code += '</a>';
    anchor.append(picture);
    if( doCaption ) {
        embed_code += '\n<figcaption>{C}</figcaption>';
        embed_code = embed_code.replace('{C}', captionText);
        embed_code += '\n</figure>';
    }
    $('#code').empty().append(escapeHTML(embed_code)+'\n');
    $('#picturePreview').empty().append(anchor);
    $('#code').each(function(i, block) {
        hljs.highlightBlock(block);
    });
    $('#picturePreview img').addClass('center-block');
    $('#loading-indicator').addClass('hide');
    $('pre').removeClass('hide');
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

var formatGalleryURL = function(alb) {
    return alb['URL'] + '/' + alb['id'] + '_' + alb['Key'];
}

var fetchSmugInfo = function(url) {
    var re = /(http:\/\/.*?\/.*?\/.*?)\/.*?/;
    var m = url.match(re);
    if( m == null ) {
        showError('Invalid SmugMug URL');
        return;
    }

    var tree_url = "https://api.smugmug.com/services/api/json/1.3.0/?method=smugmug.users.getTree&APIKey={K}&NickName=elusivetruth&Heavy=true&Callback=?"
    tree_url = tree_url.replace('{K}', SMUGMUG_API_KEY);
    $.getJSON(tree_url, function (data) {
        if( data['stat'] != 'ok' )  {
            console.log(data);
            showError('SmugMug API Error');
            return;
        }
        $.each(data['Categories'], function(index, cat) {
            if( !('Albums' in  cat) ) return;
            $.each(cat['Albums'], function(index, alb) {
                if( m[0].indexOf(alb['URL']) > -1 ){
                    smugmug_gallery = alb;
                    gotGallery(url, alb);
                }
            });
        });
    });
}

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


